import * as vscode from 'vscode';
import type { AgentState, PerformanceScore } from './types.js';
import {
	GLOBAL_KEY_PERFORMANCE_SCORES,
	PERF_LOOP_PENALTY,
	PERF_REVERT_PENALTY,
	PERF_IDLE_PENALTY_PER_MIN,
	PERF_MAX_SCORES_STORED,
} from './constants.js';
import { isPremium } from './license.js';

/**
 * Calculate performance score for an agent session.
 * Score = 100 - penalties. Higher is better.
 */
export function calculateScore(agent: AgentState): PerformanceScore {
	const m = agent.metrics;
	const totalTools = Object.values(m.toolCounts).reduce((a, b) => a + b, 0);

	// Loop penalty: PERF_LOOP_PENALTY per detected loop
	const loopPenalty = Math.min(m.loopCount * PERF_LOOP_PENALTY, 40);

	// Revert penalty: detect consecutive edits to same file (rough heuristic)
	let revertCount = 0;
	const edits = m.filesEdited;
	for (let i = 1; i < edits.length; i++) {
		if (edits[i] === edits[i - 1]) {
			revertCount++;
		}
	}
	const revertPenalty = Math.min(revertCount * PERF_REVERT_PENALTY, 30);

	// Idle penalty: based on permission waits
	const idlePenalty = Math.min(m.permissionWaitCount * PERF_IDLE_PENALTY_PER_MIN, 20);

	const score = Math.max(0, Math.min(100, 100 - loopPenalty - revertPenalty - idlePenalty));

	return {
		agentId: agent.id,
		sessionId: agent.jsonlFile,
		score,
		breakdown: { loopPenalty, revertPenalty, idlePenalty },
		toolCount: totalTools,
		turnCount: m.turnCount,
		filesEdited: m.filesTouched.size,
		timestamp: Date.now(),
	};
}

/** Store a performance score in globalState history */
export function storeScore(context: vscode.ExtensionContext, score: PerformanceScore): void {
	if (!isPremium(context)) return;
	const scores = context.globalState.get<PerformanceScore[]>(GLOBAL_KEY_PERFORMANCE_SCORES, []);
	scores.push(score);
	// Keep only latest N scores
	const trimmed = scores.slice(-PERF_MAX_SCORES_STORED);
	context.globalState.update(GLOBAL_KEY_PERFORMANCE_SCORES, trimmed);
}

/** Get stored performance scores */
export function getStoredScores(context: vscode.ExtensionContext): PerformanceScore[] {
	return context.globalState.get<PerformanceScore[]>(GLOBAL_KEY_PERFORMANCE_SCORES, []);
}
