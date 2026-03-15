import * as vscode from 'vscode';
import type { AgentState, NotificationPrefs } from './types.js';
import { LONG_TASK_THRESHOLD_MS, LOOP_DETECTION_COUNT, GLOBAL_KEY_NOTIFICATION_PREFS } from './constants.js';
import { isPremium } from './license.js';

const DEFAULT_PREFS: NotificationPrefs = {
	permissionNotify: true,
	longTaskNotify: true,
	loopDetectionNotify: true,
};

export function getNotificationPrefs(context: vscode.ExtensionContext): NotificationPrefs {
	return context.globalState.get<NotificationPrefs>(GLOBAL_KEY_NOTIFICATION_PREFS, DEFAULT_PREFS);
}

export function setNotificationPrefs(context: vscode.ExtensionContext, prefs: NotificationPrefs): void {
	context.globalState.update(GLOBAL_KEY_NOTIFICATION_PREFS, prefs);
}

/**
 * Called when a tool_use is detected. Records the tool name for loop detection
 * and sets turnStartTime if this is the first tool in the turn.
 */
export function onToolStarted(agent: AgentState, toolName: string): void {
	// Track turn start time
	if (agent.turnStartTime === null) {
		agent.turnStartTime = Date.now();
	}

	// Track for loop detection
	agent.recentToolNames.push(toolName);
	// Keep last LOOP_DETECTION_COUNT * 2 entries to avoid unbounded growth
	const maxHistory = LOOP_DETECTION_COUNT * 2;
	if (agent.recentToolNames.length > maxHistory) {
		agent.recentToolNames = agent.recentToolNames.slice(-maxHistory);
	}
}

/**
 * Check if the agent is in a loop (same tool N+ times consecutively).
 * Returns the tool name if looping, null otherwise.
 */
export function checkLoopDetection(agent: AgentState): string | null {
	const names = agent.recentToolNames;
	if (names.length < LOOP_DETECTION_COUNT) return null;

	const lastTool = names[names.length - 1];
	let streak = 0;
	for (let i = names.length - 1; i >= 0; i--) {
		if (names[i] === lastTool) {
			streak++;
		} else {
			break;
		}
	}

	if (streak >= LOOP_DETECTION_COUNT) {
		return lastTool;
	}
	return null;
}

/**
 * Called when agent enters waiting state (turn completed).
 * Fires long-task notification if applicable.
 */
export function notifyPermissionWait(
	context: vscode.ExtensionContext,
	agent: AgentState,
): void {
	if (!isPremium(context)) return;
	const prefs = getNotificationPrefs(context);
	if (!prefs.permissionNotify) return;

	const label = agent.folderName || `Agent #${agent.id}`;
	vscode.window.showWarningMessage(
		`AgentCraft: ${label} needs permission to continue`,
		'Focus Terminal',
	).then((action) => {
		if (action === 'Focus Terminal') {
			agent.terminalRef.show();
		}
	});
}

/**
 * Called when agent completes a turn (waiting status).
 * Shows long-task notification if turn duration > threshold.
 */
export function notifyLongTaskComplete(
	context: vscode.ExtensionContext,
	agent: AgentState,
): void {
	if (!isPremium(context)) return;
	const prefs = getNotificationPrefs(context);
	if (!prefs.longTaskNotify) return;
	if (agent.longTaskNotified) return;
	if (agent.turnStartTime === null) return;

	const elapsed = Date.now() - agent.turnStartTime;
	if (elapsed < LONG_TASK_THRESHOLD_MS) return;

	agent.longTaskNotified = true;
	const label = agent.folderName || `Agent #${agent.id}`;
	const minutes = Math.round(elapsed / 60000);
	vscode.window.showInformationMessage(
		`AgentCraft: ${label} finished a ${minutes}min task`,
		'Focus Terminal',
	).then((action) => {
		if (action === 'Focus Terminal') {
			agent.terminalRef.show();
		}
	});
}

/**
 * Called on each tool completion to check for loops.
 */
export function notifyLoopDetected(
	context: vscode.ExtensionContext,
	agent: AgentState,
	toolName: string,
): void {
	if (!isPremium(context)) return;
	const prefs = getNotificationPrefs(context);
	if (!prefs.loopDetectionNotify) return;
	if (agent.loopNotified) return;

	agent.loopNotified = true;
	const label = agent.folderName || `Agent #${agent.id}`;
	vscode.window.showWarningMessage(
		`AgentCraft: ${label} may be stuck in a loop (${toolName} called ${LOOP_DETECTION_COUNT}+ times)`,
		'Focus Terminal',
	).then((action) => {
		if (action === 'Focus Terminal') {
			agent.terminalRef.show();
		}
	});
}

/**
 * Reset turn-related notification state when a new turn starts.
 */
export function resetTurnNotificationState(agent: AgentState): void {
	agent.turnStartTime = null;
	agent.longTaskNotified = false;
	agent.recentToolNames = [];
	agent.loopNotified = false;
}
