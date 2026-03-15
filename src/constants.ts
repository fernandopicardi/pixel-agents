// ── Timing (ms) ──────────────────────────────────────────────
export const JSONL_POLL_INTERVAL_MS = 1000;
export const FILE_WATCHER_POLL_INTERVAL_MS = 1000;
export const PROJECT_SCAN_INTERVAL_MS = 1000;
export const TOOL_DONE_DELAY_MS = 300;
export const PERMISSION_TIMER_DELAY_MS = 7000;
export const TEXT_IDLE_DELAY_MS = 5000;

// ── Display Truncation ──────────────────────────────────────
export const BASH_COMMAND_DISPLAY_MAX_LENGTH = 30;
export const TASK_DESCRIPTION_DISPLAY_MAX_LENGTH = 40;

// ── PNG / Asset Parsing ─────────────────────────────────────
export const PNG_ALPHA_THRESHOLD = 128;
export const WALL_PIECE_WIDTH = 16;
export const WALL_PIECE_HEIGHT = 32;
export const WALL_GRID_COLS = 4;
export const WALL_BITMASK_COUNT = 16;
export const FLOOR_PATTERN_COUNT = 7;
export const FLOOR_TILE_SIZE = 16;
export const CHARACTER_DIRECTIONS = ['down', 'up', 'right'] as const;
export const CHAR_FRAME_W = 16;
export const CHAR_FRAME_H = 32;
export const CHAR_FRAMES_PER_ROW = 7;
export const CHAR_COUNT = 6;

// ── User-Level Layout Persistence ─────────────────────────────
export const LAYOUT_FILE_DIR = '.agent-craft';
export const LAYOUT_FILE_NAME = 'layout.json';
export const LAYOUT_FILE_POLL_INTERVAL_MS = 2000;

// ── Smart Notifications ─────────────────────────────────────
export const LONG_TASK_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
export const LOOP_DETECTION_COUNT = 5;
export const GLOBAL_KEY_NOTIFICATION_PREFS = 'agent-craft.notificationPrefs';

// ── Analytics & Scoring ─────────────────────────────────────
export const MAX_FILE_EVENTS_PER_AGENT = 500;
export const MAX_TIMELINE_EVENTS = 200;
export const GLOBAL_KEY_PERFORMANCE_SCORES = 'agent-craft.performanceScores';
export const PERF_LOOP_PENALTY = 10;
export const PERF_REVERT_PENALTY = 15;
export const PERF_IDLE_PENALTY_PER_MIN = 2;
export const PERF_MAX_SCORES_STORED = 20;

// ── Agent Templates ─────────────────────────────────────────
export const WORKSPACE_KEY_TEMPLATES = 'agent-craft.templates';

// ── Settings Persistence ────────────────────────────────────
export const GLOBAL_KEY_SOUND_ENABLED = 'agent-craft.soundEnabled';

// ── License ─────────────────────────────────────────────────
export const GLOBAL_KEY_LICENSE = 'agent-craft.licenseKey';
export const COMMAND_ENTER_LICENSE = 'agent-craft.enterLicenseKey';
export const LICENSE_KEY_REGEX = /^PA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// ── IDE Identifiers ─────────────────────────────────────────
export const VIEW_ID = 'agent-craft.panelView';
export const COMMAND_SHOW_PANEL = 'agent-craft.showPanel';
export const COMMAND_EXPORT_DEFAULT_LAYOUT = 'agent-craft.exportDefaultLayout';
export const WORKSPACE_KEY_AGENTS = 'agent-craft.agents';
export const WORKSPACE_KEY_AGENT_SEATS = 'agent-craft.agentSeats';
export const WORKSPACE_KEY_LAYOUT = 'agent-craft.layout';
export const TERMINAL_NAME_PREFIX = 'Claude Code';
