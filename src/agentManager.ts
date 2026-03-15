import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import type { AgentState, PersistedAgent, AgentTemplate, AgentMetrics } from './types.js';

function createEmptyMetrics(): AgentMetrics {
	return {
		toolCounts: {},
		filesTouched: new Set(),
		filesEdited: [],
		permissionWaitCount: 0,
		turnCount: 0,
		loopCount: 0,
		sessionStartTime: Date.now(),
		totalToolDuration: 0,
		lastToolStartTime: null,
	};
}
import { cancelWaitingTimer, cancelPermissionTimer } from './timerManager.js';
import { startFileWatching, readNewLines, ensureProjectScan } from './fileWatcher.js';
import type { NotificationEvent } from './transcriptParser.js';
import { JSONL_POLL_INTERVAL_MS, TERMINAL_NAME_PREFIX, WORKSPACE_KEY_AGENTS, WORKSPACE_KEY_AGENT_SEATS } from './constants.js';
import { migrateAndLoadLayout } from './layoutPersistence.js';

/** Build the `claude` CLI command with session ID and optional template flags */
function buildClaudeCommand(sessionId: string, template?: AgentTemplate): string {
	const parts = ['claude', '--session-id', sessionId];

	if (template?.appendSystemPrompt) {
		// Escape single quotes for shell
		const escaped = template.appendSystemPrompt.replace(/'/g, "'\\''");
		parts.push('--append-system-prompt', `'${escaped}'`);
	}

	if (template?.cliFlags) {
		parts.push(template.cliFlags);
	}

	return parts.join(' ');
}

export function getProjectDirPath(cwd?: string): string | null {
	const workspacePath = cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspacePath) return null;
	const dirName = workspacePath.replace(/[^a-zA-Z0-9-]/g, '-');
	const projectDir = path.join(os.homedir(), '.claude', 'projects', dirName);
	console.log(`[Pixel Agents] Project dir: ${workspacePath} → ${dirName}`);
	return projectDir;
}

export async function launchNewTerminal(
	nextAgentIdRef: { current: number },
	nextTerminalIndexRef: { current: number },
	agents: Map<number, AgentState>,
	activeAgentIdRef: { current: number | null },
	knownJsonlFiles: Set<string>,
	fileWatchers: Map<number, fs.FSWatcher>,
	pollingTimers: Map<number, ReturnType<typeof setInterval>>,
	waitingTimers: Map<number, ReturnType<typeof setTimeout>>,
	permissionTimers: Map<number, ReturnType<typeof setTimeout>>,
	jsonlPollTimers: Map<number, ReturnType<typeof setInterval>>,
	projectScanTimerRef: { current: ReturnType<typeof setInterval> | null },
	webview: vscode.Webview | undefined,
	persistAgents: () => void,
	folderPath?: string,
	onNotification?: (event: NotificationEvent) => void,
	template?: AgentTemplate,
): Promise<void> {
	const folders = vscode.workspace.workspaceFolders;
	const cwd = template?.cwd || folderPath || folders?.[0]?.uri.fsPath;
	const isMultiRoot = !!(folders && folders.length > 1);
	const idx = nextTerminalIndexRef.current++;
	const terminalName = template?.name
		? `${TERMINAL_NAME_PREFIX} #${idx} (${template.name})`
		: `${TERMINAL_NAME_PREFIX} #${idx}`;
	const terminal = vscode.window.createTerminal({
		name: terminalName,
		cwd,
	});
	terminal.show();

	const sessionId = crypto.randomUUID();
	terminal.sendText(buildClaudeCommand(sessionId, template));

	const projectDir = getProjectDirPath(cwd);
	if (!projectDir) {
		console.log(`[Pixel Agents] No project dir, cannot track agent`);
		return;
	}

	// Pre-register expected JSONL file so project scan won't treat it as a /clear file
	const expectedFile = path.join(projectDir, `${sessionId}.jsonl`);
	knownJsonlFiles.add(expectedFile);

	// Create agent immediately (before JSONL file exists)
	const id = nextAgentIdRef.current++;
	const folderName = isMultiRoot && cwd ? path.basename(cwd) : undefined;
	const agent: AgentState = {
		id,
		terminalRef: terminal,
		projectDir,
		jsonlFile: expectedFile,
		fileOffset: 0,
		lineBuffer: '',
		activeToolIds: new Set(),
		activeToolStatuses: new Map(),
		activeToolNames: new Map(),
		activeSubagentToolIds: new Map(),
		activeSubagentToolNames: new Map(),
		isWaiting: false,
		permissionSent: false,
		hadToolsInTurn: false,
		turnToolCount: 0,
		folderName,
		turnStartTime: null,
		longTaskNotified: false,
		recentToolNames: [],
		loopNotified: false,
		templateId: template?.id,
		templateName: template?.name,
		metrics: createEmptyMetrics(),
		fileAccesses: [],
	};

	agents.set(id, agent);
	activeAgentIdRef.current = id;
	persistAgents();
	console.log(`[Pixel Agents] Agent ${id}: created for terminal ${terminal.name}${template ? ` (template: ${template.name})` : ''}`);
	webview?.postMessage({
		type: 'agentCreated',
		id,
		folderName,
		templateName: template?.name,
		palette: template?.palette,
	});

	ensureProjectScan(
		projectDir, knownJsonlFiles, projectScanTimerRef, activeAgentIdRef,
		nextAgentIdRef, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers,
		webview, persistAgents,
	);

	// Poll for the specific JSONL file to appear
	const pollTimer = setInterval(() => {
		try {
			if (fs.existsSync(agent.jsonlFile)) {
				console.log(`[Pixel Agents] Agent ${id}: found JSONL file ${path.basename(agent.jsonlFile)}`);
				clearInterval(pollTimer);
				jsonlPollTimers.delete(id);
				startFileWatching(id, agent.jsonlFile, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, webview, onNotification);
				readNewLines(id, agents, waitingTimers, permissionTimers, webview, onNotification);
			}
		} catch { /* file may not exist yet */ }
	}, JSONL_POLL_INTERVAL_MS);
	jsonlPollTimers.set(id, pollTimer);
}

export function removeAgent(
	agentId: number,
	agents: Map<number, AgentState>,
	fileWatchers: Map<number, fs.FSWatcher>,
	pollingTimers: Map<number, ReturnType<typeof setInterval>>,
	waitingTimers: Map<number, ReturnType<typeof setTimeout>>,
	permissionTimers: Map<number, ReturnType<typeof setTimeout>>,
	jsonlPollTimers: Map<number, ReturnType<typeof setInterval>>,
	persistAgents: () => void,
): void {
	const agent = agents.get(agentId);
	if (!agent) return;

	// Stop JSONL poll timer
	const jpTimer = jsonlPollTimers.get(agentId);
	if (jpTimer) { clearInterval(jpTimer); }
	jsonlPollTimers.delete(agentId);

	// Stop file watching
	fileWatchers.get(agentId)?.close();
	fileWatchers.delete(agentId);
	const pt = pollingTimers.get(agentId);
	if (pt) { clearInterval(pt); }
	pollingTimers.delete(agentId);
	try { fs.unwatchFile(agent.jsonlFile); } catch { /* ignore */ }

	// Cancel timers
	cancelWaitingTimer(agentId, waitingTimers);
	cancelPermissionTimer(agentId, permissionTimers);

	// Remove from maps
	agents.delete(agentId);
	persistAgents();
}

export function persistAgents(
	agents: Map<number, AgentState>,
	context: vscode.ExtensionContext,
): void {
	const persisted: PersistedAgent[] = [];
	for (const agent of agents.values()) {
		persisted.push({
			id: agent.id,
			terminalName: agent.terminalRef.name,
			jsonlFile: agent.jsonlFile,
			projectDir: agent.projectDir,
			folderName: agent.folderName,
			templateId: agent.templateId,
		});
	}
	context.workspaceState.update(WORKSPACE_KEY_AGENTS, persisted);
}

export function restoreAgents(
	context: vscode.ExtensionContext,
	nextAgentIdRef: { current: number },
	nextTerminalIndexRef: { current: number },
	agents: Map<number, AgentState>,
	knownJsonlFiles: Set<string>,
	fileWatchers: Map<number, fs.FSWatcher>,
	pollingTimers: Map<number, ReturnType<typeof setInterval>>,
	waitingTimers: Map<number, ReturnType<typeof setTimeout>>,
	permissionTimers: Map<number, ReturnType<typeof setTimeout>>,
	jsonlPollTimers: Map<number, ReturnType<typeof setInterval>>,
	projectScanTimerRef: { current: ReturnType<typeof setInterval> | null },
	activeAgentIdRef: { current: number | null },
	webview: vscode.Webview | undefined,
	doPersist: () => void,
	onNotification?: (event: NotificationEvent) => void,
): void {
	const persisted = context.workspaceState.get<PersistedAgent[]>(WORKSPACE_KEY_AGENTS, []);
	if (persisted.length === 0) return;

	const liveTerminals = vscode.window.terminals;
	let maxId = 0;
	let maxIdx = 0;
	let restoredProjectDir: string | null = null;

	for (const p of persisted) {
		const terminal = liveTerminals.find(t => t.name === p.terminalName);
		if (!terminal) continue;

		const agent: AgentState = {
			id: p.id,
			terminalRef: terminal,
			projectDir: p.projectDir,
			jsonlFile: p.jsonlFile,
			fileOffset: 0,
			lineBuffer: '',
			activeToolIds: new Set(),
			activeToolStatuses: new Map(),
			activeToolNames: new Map(),
			activeSubagentToolIds: new Map(),
			activeSubagentToolNames: new Map(),
			isWaiting: false,
			permissionSent: false,
			hadToolsInTurn: false,
			turnToolCount: 0,
			folderName: p.folderName,
			turnStartTime: null,
			longTaskNotified: false,
			recentToolNames: [],
			loopNotified: false,
			metrics: createEmptyMetrics(),
			fileAccesses: [],
		};

		agents.set(p.id, agent);
		knownJsonlFiles.add(p.jsonlFile);
		console.log(`[Pixel Agents] Restored agent ${p.id} → terminal "${p.terminalName}"`);

		if (p.id > maxId) maxId = p.id;
		// Extract terminal index from name like "Claude Code #3"
		const match = p.terminalName.match(/#(\d+)$/);
		if (match) {
			const idx = parseInt(match[1], 10);
			if (idx > maxIdx) maxIdx = idx;
		}

		restoredProjectDir = p.projectDir;

		// Start file watching if JSONL exists, skipping to end of file
		try {
			if (fs.existsSync(p.jsonlFile)) {
				const stat = fs.statSync(p.jsonlFile);
				agent.fileOffset = stat.size;
				startFileWatching(p.id, p.jsonlFile, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, webview, onNotification);
			} else {
				// Poll for the file to appear
				const pollTimer = setInterval(() => {
					try {
						if (fs.existsSync(agent.jsonlFile)) {
							console.log(`[Pixel Agents] Restored agent ${p.id}: found JSONL file`);
							clearInterval(pollTimer);
							jsonlPollTimers.delete(p.id);
							const stat = fs.statSync(agent.jsonlFile);
							agent.fileOffset = stat.size;
							startFileWatching(p.id, agent.jsonlFile, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, webview, onNotification);
						}
					} catch { /* file may not exist yet */ }
				}, JSONL_POLL_INTERVAL_MS);
				jsonlPollTimers.set(p.id, pollTimer);
			}
		} catch { /* ignore errors during restore */ }
	}

	// Advance counters past restored IDs
	if (maxId >= nextAgentIdRef.current) {
		nextAgentIdRef.current = maxId + 1;
	}
	if (maxIdx >= nextTerminalIndexRef.current) {
		nextTerminalIndexRef.current = maxIdx + 1;
	}

	// Re-persist cleaned-up list (removes entries whose terminals are gone)
	doPersist();

	// Start project scan for /clear detection
	if (restoredProjectDir) {
		ensureProjectScan(
			restoredProjectDir, knownJsonlFiles, projectScanTimerRef, activeAgentIdRef,
			nextAgentIdRef, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers,
			webview, doPersist,
		);
	}
}

/**
 * Detect and adopt existing Claude Code terminals that were opened before the extension started.
 *
 * Strategy:
 * 1. Find JSONL files in the CURRENT project dir that are actively being written to (last 10 min)
 * 2. Find unowned terminals whose name matches Claude Code patterns
 * 3. Only adopt if the count of active JSONL files matches the count of candidate terminals
 *    (avoids cross-project mismatches when multiple projects are open)
 * 4. If counts don't match, still adopt up to min(terminals, files) but log a warning
 *
 * The JSONL directory is already scoped to the current workspace:
 *   ~/.claude/projects/<workspace-hash>/
 * So files from other projects are never considered.
 */
export function adoptExistingTerminals(
	nextAgentIdRef: { current: number },
	agents: Map<number, AgentState>,
	activeAgentIdRef: { current: number | null },
	knownJsonlFiles: Set<string>,
	fileWatchers: Map<number, fs.FSWatcher>,
	pollingTimers: Map<number, ReturnType<typeof setInterval>>,
	waitingTimers: Map<number, ReturnType<typeof setTimeout>>,
	permissionTimers: Map<number, ReturnType<typeof setTimeout>>,
	webview: vscode.Webview | undefined,
	persistAgents: () => void,
	onNotification?: (event: NotificationEvent) => void,
): void {
	const projectDir = getProjectDirPath();
	if (!projectDir) return;

	// Gather terminal refs and JSONL files already owned by existing agents
	const ownedTerminals = new Set<vscode.Terminal>();
	const ownedJsonlFiles = new Set<string>();
	for (const agent of agents.values()) {
		ownedTerminals.add(agent.terminalRef);
		ownedJsonlFiles.add(agent.jsonlFile);
	}

	// Find unowned terminals whose name matches Claude Code patterns
	// Patterns: "Claude Code #N" (Pixel Agents), "claude" (default CLI), "Claude Code" (generic)
	const candidateTerminals = vscode.window.terminals.filter(t => {
		if (ownedTerminals.has(t)) return false;
		const name = t.name.toLowerCase();
		return name.includes('claude');
	});

	if (candidateTerminals.length === 0) {
		console.log('[Pixel Agents] adoptExistingTerminals: no unowned Claude Code terminals found');
		return;
	}

	// Get JSONL files in THIS project dir, sorted by modification time (most recent first)
	let jsonlFiles: Array<{ file: string; mtime: number }>;
	try {
		jsonlFiles = fs.readdirSync(projectDir)
			.filter(f => f.endsWith('.jsonl'))
			.map(f => {
				const fullPath = path.join(projectDir, f);
				try {
					const stat = fs.statSync(fullPath);
					return { file: fullPath, mtime: stat.mtimeMs };
				} catch {
					return null;
				}
			})
			.filter((entry): entry is { file: string; mtime: number } => entry !== null)
			.sort((a, b) => b.mtime - a.mtime);
	} catch {
		return;
	}

	// Only consider actively used files (modified in the last 10 minutes)
	// This tight window avoids adopting stale sessions from hours/days ago
	const activeThresholdMs = 10 * 60 * 1000;
	const recentFiles = jsonlFiles.filter(
		f => (Date.now() - f.mtime) < activeThresholdMs && !ownedJsonlFiles.has(f.file),
	);

	if (recentFiles.length === 0) {
		console.log('[Pixel Agents] adoptExistingTerminals: no active JSONL files in project dir');
		return;
	}

	// Only adopt up to min(terminals, files) to avoid mismatches
	const adoptCount = Math.min(candidateTerminals.length, recentFiles.length);
	if (candidateTerminals.length !== recentFiles.length) {
		console.log(
			`[Pixel Agents] adoptExistingTerminals: count mismatch — ${candidateTerminals.length} terminals vs ${recentFiles.length} active JSONL files. Adopting ${adoptCount}.`,
		);
	}

	let adopted = 0;
	for (let i = 0; i < adoptCount; i++) {
		const terminal = candidateTerminals[i];
		const jsonl = recentFiles[i];

		knownJsonlFiles.add(jsonl.file);

		const id = nextAgentIdRef.current++;
		const agent: AgentState = {
			id,
			terminalRef: terminal,
			projectDir,
			jsonlFile: jsonl.file,
			fileOffset: 0,
			lineBuffer: '',
			activeToolIds: new Set(),
			activeToolStatuses: new Map(),
			activeToolNames: new Map(),
			activeSubagentToolIds: new Map(),
			activeSubagentToolNames: new Map(),
			isWaiting: false,
			permissionSent: false,
			hadToolsInTurn: false,
			turnToolCount: 0,
			turnStartTime: null,
			longTaskNotified: false,
			recentToolNames: [],
			loopNotified: false,
			metrics: createEmptyMetrics(),
			fileAccesses: [],
		};

		agents.set(id, agent);
		activeAgentIdRef.current = id;

		console.log(`[Pixel Agents] Agent ${id}: auto-adopted terminal "${terminal.name}" → ${path.basename(jsonl.file)}`);
		webview?.postMessage({ type: 'agentCreated', id });

		// Skip to end of existing content, then start watching for new activity
		try {
			if (fs.existsSync(jsonl.file)) {
				const stat = fs.statSync(jsonl.file);
				agent.fileOffset = stat.size;
				startFileWatching(id, jsonl.file, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, webview, onNotification);
			}
		} catch { /* ignore */ }

		adopted++;
	}

	if (adopted > 0) {
		persistAgents();
		console.log(`[Pixel Agents] Auto-adopted ${adopted} existing Claude Code terminal(s) for this project`);
	}
}

export function sendExistingAgents(
	agents: Map<number, AgentState>,
	context: vscode.ExtensionContext,
	webview: vscode.Webview | undefined,
): void {
	if (!webview) return;
	const agentIds: number[] = [];
	for (const id of agents.keys()) {
		agentIds.push(id);
	}
	agentIds.sort((a, b) => a - b);

	// Include persisted palette/seatId from separate key
	const agentMeta = context.workspaceState.get<Record<string, { palette?: number; seatId?: string }>>(WORKSPACE_KEY_AGENT_SEATS, {});

	// Include folderName per agent
	const folderNames: Record<number, string> = {};
	for (const [id, agent] of agents) {
		if (agent.folderName) {
			folderNames[id] = agent.folderName;
		}
	}
	console.log(`[Pixel Agents] sendExistingAgents: agents=${JSON.stringify(agentIds)}, meta=${JSON.stringify(agentMeta)}`);

	webview.postMessage({
		type: 'existingAgents',
		agents: agentIds,
		agentMeta,
		folderNames,
	});

	sendCurrentAgentStatuses(agents, webview);
}

export function sendCurrentAgentStatuses(
	agents: Map<number, AgentState>,
	webview: vscode.Webview | undefined,
): void {
	if (!webview) return;
	for (const [agentId, agent] of agents) {
		// Re-send active tools
		for (const [toolId, status] of agent.activeToolStatuses) {
			webview.postMessage({
				type: 'agentToolStart',
				id: agentId,
				toolId,
				status,
			});
		}
		// Re-send waiting status
		if (agent.isWaiting) {
			webview.postMessage({
				type: 'agentStatus',
				id: agentId,
				status: 'waiting',
			});
		}
	}
}

export function sendLayout(
	context: vscode.ExtensionContext,
	webview: vscode.Webview | undefined,
	defaultLayout?: Record<string, unknown> | null,
): void {
	if (!webview) return;
	const layout = migrateAndLoadLayout(context, defaultLayout);
	webview.postMessage({
		type: 'layoutLoaded',
		layout,
	});
}
