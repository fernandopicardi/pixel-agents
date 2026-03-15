# AgentCraft — Premium Features Roadmap

> This file tracks the implementation progress of all premium features.
> It serves as both a **report** and a **continuity guide** for agents resuming work in new sessions.
>
> **How to use this file:**
>
> - Before starting work, read this file to understand current state
> - After completing a feature/task, update the status and add notes
> - Each feature has acceptance criteria — mark them as done when complete
> - Sprint sections at the bottom track what's in progress

---

## Feature List (ordered by implementation complexity)


| #   | Feature                     | Epic          | Complexity | Status    | Sprint   |
| --- | --------------------------- | ------------- | ---------- | --------- | -------- |
| F01 | Agent Hover Tooltip         | Agent UX      | XS         | `done`    | Sprint 1 |
| F02 | Smart Notifications         | Agent UX      | S          | `done`    | Sprint 1 |
| F03 | Agent Templates / Presets   | Agent Config  | S          | `done`    | Sprint 2 |
| F04 | Activity Timeline           | Analytics     | M          | `backlog` | —        |
| F05 | Agent Dashboard (metrics)   | Analytics     | M          | `backlog` | —        |
| F06 | Cost Budget & Guardrails    | Analytics     | M          | `backlog` | —        |
| F07 | File Heatmap                | Visualization | M          | `done`    | Sprint 4 |
| F08 | Git Awareness               | Integration   | L          | `backlog` | —        |
| F09 | Agent Orchestration / Teams | Orchestration | L          | `done`    | Sprint 6 |
| F10 | Agent Performance Scoring   | Analytics     | L          | `done`    | Sprint 6 |
| F11 | Project Map View            | Visualization | XL         | `backlog` | —        |
| F12 | Sub-agent Recreation Room   | Agent UX      | M          | `done`    | Sprint 8 |
| F13 | Session History Board       | Analytics     | M          | `backlog` | —        |
| F14 | Active Tasks Panel          | Agent UX      | S          | `done`    | Sprint 8 |


**Status values:** `backlog` → `in_progress` → `review` → `done`
**Complexity:** XS (<1h), S (1-4h), M (4-12h), L (1-3 days), XL (3+ days)

---

## F01 — Agent Hover Tooltip

**Epic:** Agent UX
**Complexity:** XS
**Status:** `done`
**Branch:** `feat/cursor-ide-support` (included in initial PR)

### Description

When hovering over an agent character in the office, show a tooltip with:

- Agent name / terminal name
- Current task description (extracted from the most recent JSONL tool_use)
- Completion percentage estimate (based on tool activity patterns)
- Current status (active, waiting, permission)

### Acceptance Criteria

- Tooltip appears on mouse hover over character sprite
- Shows agent ID/name and folder name (if multi-root)
- Shows current tool activity (e.g., "Editing: src/app.tsx")
- Shows estimated progress percentage with visual bar
- Tooltip disappears on mouse leave
- Does not interfere with click-to-select behavior
- Works for both regular agents and sub-agents

### Technical Notes

- Hover detection already exists in `OfficeCanvas.tsx` (mouse hit-testing)
- Tool activity data is in `agentTools` state from `useExtensionMessages`
- Progress estimation: count tool_use events in current turn vs average turn length
- Render as HTML overlay (not canvas) for text clarity

### Files to modify

- `webview-ui/src/office/components/OfficeCanvas.tsx` — hover detection
- `webview-ui/src/office/components/ToolOverlay.tsx` — tooltip rendering
- `webview-ui/src/hooks/useExtensionMessages.ts` — track tool counts for progress
- `src/transcriptParser.ts` — extract task description from JSONL

### Implementation Notes

- Tooltip already existed for hover/selected agents in `ToolOverlay.tsx` — enhanced it
- Added agent label (folder name or "Agent #N") above activity text
- Progress bar uses logarithmic curve: `(1 - e^(-toolCount/8)) * 100`, capped at 95%
- Progress never reaches 100% — turn completion is signaled by `turn_duration` which clears the bar
- Extension tracks `turnToolCount` per agent in `AgentState`, resets on new user prompt or turn end
- Sends `agentTurnProgress` message to webview on each tool completion
- Progress bar color matches status dot (green for active, amber for permission wait)

---

## F02 — Smart Notifications

**Epic:** Agent UX
**Complexity:** S
**Status:** `done`
**Branch:** `feat/smart-notifications`

### Description

Enhanced notification system beyond the current chime:

- Native OS notification when agent needs attention (permission wait)
- Notification when agent finishes a long task (> N minutes)
- Alert when agent is in a loop (same tool called 5+ times in a row)
- Configurable notification preferences in Settings modal

### Acceptance Criteria

- OS-level notifications via `vscode.window.showWarningMessage` for permission waits
- Long-task completion notification (2 min threshold)
- Loop detection: alert when same tool_use name appears 5+ times consecutively
- Settings UI: toggle each notification type independently
- Notifications respect system DND / focus mode (VS Code handles this natively)
- Sound notification setting still works independently

### Technical Notes

- Use `vscode.window.showInformationMessage` for native notifications (works cross-platform)
- Loop detection in `transcriptParser.ts` — track last N tool names per agent
- Store notification preferences in `globalState`
- Long-task timer: start on first `agentToolStart`, fire if no `agentStatus: waiting` within threshold

### Files to modify

- `src/transcriptParser.ts` — loop detection logic
- `src/AgentCraftViewProvider.ts` — fire native notifications
- `src/agentManager.ts` — long-task timer
- `src/constants.ts` — new timing constants
- `src/types.ts` — add notification preferences to state
- `webview-ui/src/components/SettingsModal.tsx` — notification toggles UI

### Implementation Notes

- New `src/notificationManager.ts` module handles all notification logic: prefs read/write, permission/long-task/loop alerts
- `NotificationPrefs` stored in `globalState` key `agent-craft.notificationPrefs` (defaults: all enabled)
- Permission wait: `vscode.window.showWarningMessage` with "Focus Terminal" action button
- Long-task detection: `turnStartTime` tracked per agent, fires when turn_duration arrives and elapsed > 2min threshold
- Loop detection: `recentToolNames` array tracks consecutive tool names; alerts when same tool appears 5+ times in a row
- `loopNotified` flag prevents duplicate loop alerts per streak; resets on new user prompt
- `NotificationEvent` type flows from `processTranscriptLine` → `readNewLines` → `startFileWatching` → `AgentCraftViewProvider.handleNotification`
- Permission notification triggered via `onPermissionDetected` callback passed through `startPermissionTimer`
- Settings UI: 3 toggles in SettingsModal (Permission Alerts, Long Task Complete, Loop Detection) — greyed out for free users
- All notifications gated behind `isPremium()` check in notificationManager
- Sound notifications remain independent (unchanged)
- `notificationPrefsLoaded` message syncs prefs from extension to webview on init and on change

---

## F03 — Agent Templates / Presets

**Epic:** Agent Config
**Complexity:** S
**Status:** `done`
**Branch:** `feat/agent-templates`

### Description

Define reusable agent configurations before launching:

- Custom name and skin/palette
- Working directory
- Claude CLI flags (e.g., `--allowedTools`, `--model`)
- System prompt / CLAUDE.md override
- Save/load templates per workspace

### Acceptance Criteria

- "New Agent" button opens template picker with built-in and custom templates
- Template editor modal: name, description, system prompt, CLI flags, palette selection
- Templates saved per workspace in `workspaceState`
- Template list in Settings modal with create/edit/delete (custom templates)
- Character spawns with pre-assigned palette from template
- Terminal starts with configured CLI flags and --append-system-prompt
- Import/export templates as JSON (deferred to future sprint)

### Technical Notes

- Store templates in `workspaceState` key `agent-craft.templates`
- Template type: `{ name, cwd?, cliFlags?, palette?, seatId? }`
- Modify `launchNewTerminal` to accept template config
- Bottom toolbar: long-press or dropdown on "+ Agent" to pick template

### Files to modify

- `src/types.ts` — `AgentTemplate` interface
- `src/agentManager.ts` — template-aware `launchNewTerminal`
- `src/AgentCraftViewProvider.ts` — template CRUD messages
- `src/constants.ts` — workspace key for templates
- `webview-ui/src/components/BottomToolbar.tsx` — template picker UI
- `webview-ui/src/components/SettingsModal.tsx` — template management
- New: `webview-ui/src/components/TemplateEditor.tsx`

### Implementation Notes

- New `src/agentTemplates.ts` module: built-in templates registry + CRUD for custom templates
- 3 built-in templates ship with the extension:
  - **Agile Workflow** — `--append-system-prompt` with structured agile practices (plan, iterate, summarize)
  - **Code Review** — read-focused agent with review structure instructions
  - **Quick Task** — vanilla Claude Code with no extra prompts
- `AgentTemplate` interface: `id, name, description, builtIn?, cliFlags?, appendSystemPrompt?, palette?, cwd?`
- `buildClaudeCommand()` helper builds `claude --session-id <id> [--append-system-prompt '...'] [flags]`
- Terminal names include template: `Claude Code #N (Agile Workflow)`
- Template picker dropdown appears on "+ Agent" click, replacing old folder-only picker
- Multi-root: after template selection, shows folder sub-picker (2-step flow with Back button)
- Custom templates require Premium license; built-in templates available to all users
- Template management in Settings modal: list all templates, Edit/Delete buttons on custom ones, "+ New" button
- `TemplateEditor.tsx`: modal with name, description, system prompt (textarea), CLI flags, palette picker (6 swatches + Auto)
- Templates persisted in `workspaceState` key `agent-craft.templates`
- Messages: `templatesLoaded`, `saveTemplate`, `deleteTemplate`; `openClaude` now accepts `templateId`
- `PersistedAgent` stores `templateId` for future restore reference
- `AgentState` stores `templateId` + `templateName` for runtime display

---

## F04 — Activity Timeline

**Epic:** Analytics
**Complexity:** M
**Status:** `backlog`
**Branch:** `feat/activity-timeline`

### Description

Visual timeline per agent showing chronological activity:

- File operations (read, edit, write, create) with file paths
- Bash commands executed
- Permission waits and their duration
- Turn boundaries (start/end markers)
- Clickable entries: opens file/diff in editor

### Acceptance Criteria

- Timeline panel accessible by clicking agent or via context menu
- Chronological list of events with timestamps
- Event types: file_edit, file_read, bash_command, permission_wait, turn_start, turn_end
- Click file event → opens file in editor at relevant line
- Click bash event → shows command + output summary
- Auto-scroll to latest event
- Filter by event type
- Timeline persists across webview reloads (stored in agent state)

### Technical Notes

- Parse JSONL `tool_use` blocks: extract tool name, input params (file path, command)
- Store timeline events in new `AgentState.timeline: TimelineEvent[]`
- Render as scrollable React component overlaying the office
- Use `vscode.commands.executeCommand('vscode.open', uri)` for file navigation
- Limit stored events to last 500 per agent to avoid memory issues

### Files to modify

- `src/types.ts` — `TimelineEvent` interface
- `src/transcriptParser.ts` — emit timeline events
- `src/AgentCraftViewProvider.ts` — forward timeline events to webview
- New: `webview-ui/src/components/ActivityTimeline.tsx`
- `webview-ui/src/hooks/useExtensionMessages.ts` — timeline state
- `webview-ui/src/office/components/ToolOverlay.tsx` — timeline trigger

### Implementation Notes

*To be filled during/after implementation*

---

## F05 — Agent Dashboard (Metrics)

**Epic:** Analytics
**Complexity:** M
**Status:** `backlog`
**Branch:** `feat/agent-dashboard`

### Description

Dashboard panel showing per-agent metrics:

- Session duration
- Tool usage breakdown (pie chart: how many edits, reads, bash, etc.)
- Token consumption estimate (based on JSONL content size)
- Permission wait count and total wait time
- Files touched (unique count)
- Cost estimate in USD (configurable rate per token)

### Acceptance Criteria

- Dashboard accessible via Settings or dedicated button
- Per-agent cards with key metrics
- Aggregate view across all agents
- Tool usage breakdown visualization (canvas-based, pixel art style)
- Session cost estimate with configurable token price
- Export metrics as JSON/CSV
- Metrics reset on session clear

### Technical Notes

- Accumulate metrics in `AgentState` extensions (tool counts, byte counts)
- Token estimation: rough heuristic based on JSONL record sizes
- Cost: `estimated_tokens * price_per_token` (user-configurable, default Claude pricing)
- Render dashboard in webview as overlay panel
- Pixel art styled charts (bar chart using sprite-like blocks)

### Files to modify

- `src/types.ts` — `AgentMetrics` interface
- `src/transcriptParser.ts` — accumulate metrics on each record
- `src/agentManager.ts` — metrics in agent state
- New: `webview-ui/src/components/AgentDashboard.tsx`
- `webview-ui/src/hooks/useExtensionMessages.ts` — metrics state
- `webview-ui/src/components/SettingsModal.tsx` — dashboard toggle

### Implementation Notes

*To be filled during/after implementation*

---

## F06 — Cost Budget & Guardrails

**Epic:** Analytics
**Complexity:** M
**Status:** `backlog`
**Branch:** `feat/cost-guardrails`

### Description

Budget controls to prevent runaway spending:

- Set max budget per agent, per session, or per day
- Auto-pause agent when limit reached
- Visual alert on character (red tint, warning bubble)
- Budget dashboard showing spend vs limit
- Configurable token price per model

### Acceptance Criteria

- Budget configuration in Settings: per-agent and global daily limit
- Real-time cost tracking based on JSONL token estimates
- Auto-pause: send interrupt to terminal when budget exceeded
- Warning at 80% budget (yellow indicator on character)
- Hard stop at 100% (red indicator, terminal paused)
- Budget resets daily (configurable reset time)
- Override option: "Continue anyway" button
- Persistent budget tracking across sessions

### Technical Notes

- Depends on F05 (Agent Dashboard metrics) for token counting
- Budget stored in `globalState`: `{ daily: number, perAgent: number, pricePerMToken: number }`
- Terminal pause: `terminal.sendText('\x03')` (Ctrl+C) or custom signal
- Warning/stop thresholds configurable
- Daily reset via timestamp comparison

### Files to modify

- Builds on F05 files
- `src/constants.ts` — budget defaults
- `src/agentManager.ts` — budget checking on each transcript update
- New: `webview-ui/src/components/BudgetIndicator.tsx`

### Implementation Notes

*To be filled during/after implementation*

---

## F07 — File Heatmap

**Epic:** Visualization
**Complexity:** M
**Status:** `done`
**Branch:** `feat/file-heatmap`

### Description

Visual overlay showing which files are being touched and by whom:

- Heatmap panel listing files colored by activity intensity
- Conflict detection: highlight when 2+ agents edit the same file
- Per-agent file list (what each agent has read/written)
- Click file → open in editor

### Acceptance Criteria

- [x] Heatmap panel accessible via "Files" button in bottom toolbar
- [x] Files sorted by touch frequency (most active first)
- [x] Color coding: green (read), yellow (edited once), red (edited many times)
- [x] Conflict indicator: "!" icon when 2+ agents touched same file
- [x] Per-agent filter: buttons to show files for selected agent only
- [x] Click to open file in editor (via `openFile` message)
- [x] Real-time updates as agents work (via `agentFileAccess` messages)

### Technical Notes

- Track file paths from `tool_use` blocks: Read, Edit, Write, Glob results
- Store in shared `Map<filePath, { agents: Set<agentId>, readCount, writeCount }>`
- Conflict = `agents.size > 1 && writeCount > 0`
- Render as scrollable list with pixel art styled bars

### Files to modify

- `src/types.ts` — `FileActivity` tracking
- `src/transcriptParser.ts` — extract file paths from tool_use
- `src/AgentCraftViewProvider.ts` — forward file activity to webview
- New: `webview-ui/src/components/FileHeatmap.tsx`
- `webview-ui/src/hooks/useExtensionMessages.ts` — file activity state

### Implementation Notes

- File tracking integrated into `transcriptParser.ts`: `trackToolMetrics()` extracts file paths from Read/Edit/Write/Glob/Grep/NotebookEdit tools
- `FileAccessEvent` records stored per agent in `AgentState.fileAccesses[]` (capped at 500)
- Real-time `agentFileAccess` messages sent to webview on each file tool_use
- `FileHeatmap.tsx` panel: sorted file list, color legend, per-agent filter buttons, conflict indicators
- Click file opens it in editor via `openFile` message → `vscode.window.showTextDocument()`
- `AgentMetrics.filesTouched` (Set) tracks unique files, `filesEdited` (array) tracks write operations
- Premium-gated: free users see "requires Premium" message

---

## F08 — Git Awareness

**Epic:** Integration
**Complexity:** L
**Status:** `backlog`
**Branch:** `feat/git-awareness`

### Description

Each agent shows git context visually:

- Current branch name displayed near character
- Uncommitted changes count badge
- Conflict indicator when agent's branch diverges
- "View diff" action on character context menu
- Mini branch indicator on agent's desk

### Acceptance Criteria

- Branch name label below agent name
- Badge showing number of uncommitted files
- Periodic git status polling (every 5s when agent is active)
- Visual conflict warning when same file modified by multiple agents on different branches
- Context menu: "View Diff", "Open Branch"
- Worktree-aware: detect if agent is working in a git worktree

### Technical Notes

- Use `child_process.exec('git status --porcelain')` per agent's cwd
- Branch name: `git branch --show-current`
- Worktree detection: `git worktree list`
- Poll only for active agents (have had tool activity in last 30s)
- Send git state to webview as `agentGitStatus` message

### Files to modify

- New: `src/gitTracker.ts` — git status polling per agent
- `src/types.ts` — `GitStatus` interface
- `src/agentManager.ts` — start/stop git tracking per agent
- `src/AgentCraftViewProvider.ts` — forward git status messages
- `webview-ui/src/office/components/ToolOverlay.tsx` — branch label, badge
- `webview-ui/src/hooks/useExtensionMessages.ts` — git state

### Implementation Notes

*To be filled during/after implementation*

---

## F09 — Agent Orchestration / Teams

**Epic:** Orchestration
**Complexity:** L
**Status:** `done`
**Branch:** `feat/agent-orchestration`

### Description

Visual interface for multi-agent coordination:

- Assign agents to "desks" representing tasks/directories
- Define task dependencies (agent B waits for agent A)
- Sub-agent tree visualization (from Task tool)
- "Standup view" — summary of all agent activities

### Acceptance Criteria

- [ ] Desk assignment: drag agent to desk or click desk → assign dialog (deferred)
- [ ] Task dependency graph (deferred)
- [x] Sub-agent tree view showing parent → child relationships
- [x] Standup summary: per-agent one-liner of current/last activity
- [ ] Dependency enforcement: auto-launch agent B when A completes (deferred)
- [ ] Visual connection lines between dependent agents (deferred)

### Technical Notes

- Desk-to-directory mapping stored in layout persistence
- Dependencies: `Map<agentId, { blockedBy: agentId[], blocks: agentId[] }>`
- Sub-agent tree: already tracked via `subagentMeta` in `OfficeState`
- Standup: aggregate last tool_use description per agent
- Auto-launch: watch for `agentStatus: waiting` + all tools cleared

### Files to modify

- `webview-ui/src/office/engine/officeState.ts` — desk assignments
- New: `webview-ui/src/components/OrchestrationPanel.tsx`
- New: `webview-ui/src/components/StandupView.tsx`
- `src/agentManager.ts` — dependency-aware launch
- `src/types.ts` — orchestration types
- `webview-ui/src/office/components/OfficeCanvas.tsx` — desk click handling

### Implementation Notes

- `OrchestrationPanel.tsx` with two tabs: "Standup" and "Sub-agents"
- **Standup tab**: all agents listed with status dot (green=active, idle, inactive), current/last activity text, sub-agent count badge. Click agent to focus its terminal
- **Sub-agents tab**: tree view grouped by parent agent, shows sub-agent ID + task label. Uses existing `subagentCharacters` state
- `agentLastActivity` state in `useExtensionMessages` tracks latest tool status per agent
- Accessible via "Team" button in bottom toolbar (toggle)
- Premium-gated

---

## F10 — Agent Performance Scoring

**Epic:** Analytics
**Complexity:** L
**Status:** `done`
**Branch:** `feat/performance-scoring`

### Description

Analyze agent session history to provide efficiency scores:

- Efficiency score: tasks completed vs tokens/time spent
- Pattern detection: loops, reverted edits, repeated errors
- Suggestions: "This agent works better with smaller tasks"
- Historical comparison across sessions

### Acceptance Criteria

- [x] Per-session efficiency score (0-100)
- [x] Loop detection: flag when agent repeats same action 5+ times (penalty applied)
- [x] Revert detection: flag when consecutive edits to same file (penalty applied)
- [x] Score breakdown: loop penalty, revert penalty, idle/wait penalty
- [ ] Historical trend chart (deferred — scores stored in globalState)
- [x] Score visible in Performance panel with color-coded bar
- [ ] Score visible on agent hover tooltip (deferred)

### Technical Notes

- Depends on F04 (Activity Timeline) and F05 (Dashboard) for data
- Score algorithm: `100 - (loop_penalty + revert_penalty + idle_penalty)`
- Revert detection: compare consecutive Edit operations on same file
- Store session scores in `globalState` keyed by project
- Trend chart: simple pixel art line chart

### Files to modify

- New: `src/performanceScorer.ts` — scoring algorithm
- `src/transcriptParser.ts` — feed data to scorer
- New: `webview-ui/src/components/PerformanceCard.tsx`
- Integrates with F01 tooltip and F05 dashboard

### Implementation Notes

- New `src/performanceScorer.ts` module: `calculateScore()` returns 0-100 score with breakdown
- Score formula: `100 - loopPenalty - revertPenalty - idlePenalty`
  - Loop penalty: `loopCount * 10` (capped at 40)
  - Revert penalty: consecutive same-file edits * 15 (capped at 30)
  - Idle penalty: `permissionWaitCount * 2` (capped at 20)
- `AgentMetrics` accumulated per agent: toolCounts, filesTouched (Set), filesEdited (array), permissionWaitCount, turnCount, loopCount, totalToolDuration
- Score calculated on terminal close via `calculateScore()` → `storeScore()` → saved to `globalState`
- `PerformanceCard.tsx` panel: shows scored agents with color-coded score (green≥80, yellow≥60, orange≥40, red<40), score bar, breakdown penalties, tool/turn/file counts
- Active agents shown as "Running..." with note that score is calculated on session end
- Up to 20 scores stored in globalState for future trend chart implementation
- Accessible via "Score" button in bottom toolbar
- Premium-gated

---

## F11 — Project Map View

**Epic:** Visualization
**Complexity:** XL
**Status:** `backlog`
**Branch:** `feat/project-map`

### Description

Alternative view: project structure as a pixel art city:

- Directories = buildings, files = floors/rooms
- Agents move through "buildings" they're editing
- Semantic zoom: project overview → directory → file level
- Color coding by file type or activity intensity

### Acceptance Criteria

- Toggle between Office View and Map View
- Directory tree rendered as pixel art buildings
- File activity shown as lit windows in buildings
- Agent sprites move to the building they're currently editing
- Zoom levels: project → directory → file
- Building size proportional to directory contents
- Color coding: file type (ts=blue, css=purple, etc.)
- Click building → opens directory in explorer

### Technical Notes

- New rendering mode in `renderer.ts` — separate from office layout
- Directory scanning: `vscode.workspace.findFiles('**/*')` at startup
- Building sprites: procedurally generated based on directory depth/file count
- Agent position: map file path from current tool_use to building coordinates
- Heavy feature — consider as v2.0 milestone

### Files to modify

- New: `webview-ui/src/map/` — entire new rendering subsystem
- New: `webview-ui/src/map/mapState.ts`
- New: `webview-ui/src/map/mapRenderer.ts`
- New: `webview-ui/src/map/buildingSprites.ts`
- `webview-ui/src/App.tsx` — view toggle
- `src/AgentCraftViewProvider.ts` — file tree scanning

### Implementation Notes

*To be filled during/after implementation*

---

## F12 — Sub-agent Recreation Room

**Epic:** Agent UX
**Complexity:** M
**Status:** `done`
**Branch:** `feat/recreation-room`

### Description

When sub-agents complete their Task, instead of despawning they walk to a dedicated "recreation room" in the office where they remain visible. This preserves their history and lets users review what each sub-agent did during the session.

### Acceptance Criteria

- [x] Completed sub-agents walk to recreation room instead of despawning
- [x] Recreation room is a distinct area in the default layout with its own floor color
- [x] Retired sub-agents wander only within the recreation room bounds
- [x] Tooltip shows "Done: <task label>" with muted purple status dot
- [x] Clicking a retired sub-agent shows their tool history (last 5 actions)
- [x] Retired sub-agents are cleared when parent agent terminal closes

### Implementation Notes

- `Character.isRetired` flag added to Character type
- `OfficeState.retireSubagent()` frees seat, marks as retired, pathfinds to recreation room
- `OfficeState.retireAllSubagents()` retires all active sub-agents of a parent (on turn end)
- Recreation room bounds defined as constants: `RECREATION_ROOM_COL/ROW_MIN/MAX` (cols 26-30, rows 1-16)
- `characters.ts` `updateCharacter()` filters walkable tiles for retired characters to recreation room only
- `useExtensionMessages.ts` on `subagentClear`: calls `retireSubagent` instead of `removeSubagent`, preserves `retiredHistory` (tool status strings)
- `ToolOverlay.tsx`: retired sub-agents show "Done:" prefix, purple dot, and expandable history on click
- Default layout expanded to 32x18 with 4 rooms: dev area, meeting room, lounge, recreation room

---

## F13 — Session History Board

**Epic:** Analytics
**Complexity:** M
**Status:** `backlog`

### Description

A visual board/panel showing a persistent history of all agent and sub-agent activity during the session. Like a kanban board where completed tasks accumulate.

---

## Sprint Log

### Sprint 1 — Agent UX Foundations

**Goal:** Implement F01 (Tooltip) and F02 (Notifications)
**Status:** `done`
**Start date:** 2026-03-15
**End date:** 2026-03-15


| Task                                | Feature | Status | Notes                                             |
| ----------------------------------- | ------- | ------ | ------------------------------------------------- |
| Hover detection + tooltip component | F01     | `done` | Enhanced existing ToolOverlay                     |
| Extract current task from JSONL     | F01     | `done` | Uses existing agentTools status                   |
| Progress estimation logic           | F01     | `done` | Logarithmic curve on turnToolCount                |
| Sub-agent tooltip support           | F01     | `done` | Shows sub label, no progress bar                  |
| OS notification for permission wait | F02     | `done` | vscode.window.showWarningMessage + Focus Terminal |
| Long-task completion notification   | F02     | `done` | turnStartTime tracking, 2min threshold            |
| Loop detection alert                | F02     | `done` | recentToolNames streak of 5+                      |
| Notification settings UI            | F02     | `done` | 3 toggles in SettingsModal, premium-gated         |


### Sprint 2 — Agent Config

**Goal:** Implement F03 (Templates)
**Status:** `done`
**Start date:** 2026-03-15
**End date:** 2026-03-15

### Sprint 3 — Analytics Core

**Goal:** Implement F04 (Timeline) and F05 (Dashboard)
**Status:** `not_started`

### Sprint 4 — Cost Control & Visualization

**Goal:** Implement F07 (Heatmap)
**Status:** `done`
**Start date:** 2026-03-15
**End date:** 2026-03-15

### Sprint 5 — Integration

**Goal:** Implement F08 (Git Awareness)
**Status:** `not_started`

### Sprint 6 — Orchestration & Scoring

**Goal:** Implement F09 (Teams) and F10 (Scoring)
**Status:** `done`
**Start date:** 2026-03-15
**End date:** 2026-03-15

### Sprint 7 — Vision

**Goal:** Implement F11 (Project Map)
**Status:** `not_started`

### Sprint 8 — Sub-agent Memory

**Goal:** Implement F12 (Recreation Room)
**Status:** `done`
**Start date:** 2026-03-15
**End date:** 2026-03-15

---

## Changelog


| Date       | Change                                                                           | By                |
| ---------- | -------------------------------------------------------------------------------- | ----------------- |
| 2026-03-15 | Initial roadmap created with 11 features across 7 sprints                        | Claude + Fernando |
| 2026-03-15 | Cursor IDE support + auto-adopt terminals (v1.1.0) shipped                       | Claude + Fernando |
| 2026-03-15 | F01 Agent Hover Tooltip implemented (Sprint 1 started)                           | Claude + Fernando |
| 2026-03-15 | F02 Smart Notifications implemented (Sprint 1 complete)                          | Claude + Fernando |
| 2026-03-15 | F03 Agent Templates implemented with built-in Agile Workflow (Sprint 2 complete) | Claude + Fernando |
| 2026-03-15 | F07 File Heatmap implemented (Sprint 4 complete) | Claude + Fernando |
| 2026-03-15 | F09 Agent Orchestration (standup + sub-agent tree) implemented | Claude + Fernando |
| 2026-03-15 | F10 Performance Scoring implemented (Sprint 6 complete) | Claude + Fernando |
| 2026-03-15 | F12 Sub-agent Recreation Room implemented (Sprint 8) | Claude + Fernando |
| 2026-03-15 | Visual overhaul: new color theme, character palettes, 4-room office layout | Claude + Fernando |
| 2026-03-15 | Full rename from pixel-agents to AgentCraft (agent-craft) | Claude + Fernando |


