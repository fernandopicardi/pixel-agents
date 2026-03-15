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
