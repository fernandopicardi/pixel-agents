import type * as vscode from 'vscode';

export interface AgentState {
	id: number;
	terminalRef: vscode.Terminal;
	projectDir: string;
	jsonlFile: string;
	fileOffset: number;
	lineBuffer: string;
	activeToolIds: Set<string>;
	activeToolStatuses: Map<string, string>;
	activeToolNames: Map<string, string>;
	activeSubagentToolIds: Map<string, Set<string>>; // parentToolId → active sub-tool IDs
	activeSubagentToolNames: Map<string, Map<string, string>>; // parentToolId → (subToolId → toolName)
	isWaiting: boolean;
	permissionSent: boolean;
	hadToolsInTurn: boolean;
	/** Workspace folder name (only set for multi-root workspaces) */
	folderName?: string;
	/** Count of tool_use events completed in the current turn (for progress estimation) */
	turnToolCount: number;
	/** Timestamp when the current turn's first tool started (for long-task detection) */
	turnStartTime: number | null;
	/** Whether a long-task notification was already sent for this turn */
	longTaskNotified: boolean;
	/** Recent tool names for loop detection (newest last) */
	recentToolNames: string[];
	/** Whether a loop notification was already sent for the current streak */
	loopNotified: boolean;
	/** Template ID used to launch this agent */
	templateId?: string;
	/** Template display name */
	templateName?: string;
	/** Accumulated metrics for this agent session */
	metrics: AgentMetrics;
	/** File access records for heatmap */
	fileAccesses: FileAccessEvent[];
	/** Last tool status text (for standup view) */
	lastActivity?: string;
}

/** Per-agent accumulated metrics for dashboard and scoring */
export interface AgentMetrics {
	/** Tool usage counts by tool name */
	toolCounts: Record<string, number>;
	/** Unique files touched */
	filesTouched: Set<string>;
	/** Files written/edited (for revert detection) */
	filesEdited: string[];
	/** Total permission wait count */
	permissionWaitCount: number;
	/** Total turns completed */
	turnCount: number;
	/** Detected loops count */
	loopCount: number;
	/** Session start timestamp */
	sessionStartTime: number;
	/** Total active duration (ms) — approximation from tool start/end */
	totalToolDuration: number;
	/** Last tool start timestamp (for duration calc) */
	lastToolStartTime: number | null;
}

/** File access event for heatmap tracking */
export interface FileAccessEvent {
	agentId: number;
	filePath: string;
	toolName: string;
	timestamp: number;
}

/** Stored performance score per session */
export interface PerformanceScore {
	agentId: number;
	sessionId: string;
	score: number;
	breakdown: {
		loopPenalty: number;
		revertPenalty: number;
		idlePenalty: number;
	};
	toolCount: number;
	turnCount: number;
	filesEdited: number;
	timestamp: number;
}

export interface NotificationPrefs {
	/** OS notification on permission wait */
	permissionNotify: boolean;
	/** Notification when a long task completes */
	longTaskNotify: boolean;
	/** Alert when agent loops the same tool */
	loopDetectionNotify: boolean;
}

export interface PersistedAgent {
	id: number;
	terminalName: string;
	jsonlFile: string;
	projectDir: string;
	/** Workspace folder name (only set for multi-root workspaces) */
	folderName?: string;
	/** Template ID used to launch this agent */
	templateId?: string;
}

export interface AgentTemplate {
	/** Unique identifier */
	id: string;
	/** Display name */
	name: string;
	/** Short description */
	description: string;
	/** Whether this is a built-in template (cannot be edited/deleted) */
	builtIn?: boolean;
	/** Extra CLI flags appended to `claude --session-id <id>` */
	cliFlags?: string;
	/** Text appended to system prompt via --append-system-prompt */
	appendSystemPrompt?: string;
	/** Preferred character palette (0-5) */
	palette?: number;
	/** Working directory override */
	cwd?: string;
}
