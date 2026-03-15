# AgentCraft

Your AI agents, visualized. A VS Code / Cursor IDE extension that brings your Claude Code sessions to life in a virtual pixel art office — with real-time activity tracking, team orchestration, smart notifications, and performance analytics.

![AgentCraft screenshot](webview-ui/public/Screenshot.jpg)

## Why AgentCraft?

When running multiple Claude Code agents, it's hard to know what each one is doing, whether they're stuck, or when they finish. AgentCraft gives you a **visual command center**: each agent becomes an animated character in a customizable office, with live status, progress tracking, and smart alerts.

## Key Features

### Core
- **Live agent visualization** — each Claude Code terminal gets an animated character that reflects real-time activity (writing, reading, running commands)
- **Sub-agent tracking** — Task tool sub-agents spawn as separate characters, and retire to a recreation room when done (preserving their history)
- **Smart notifications** — OS-level alerts for permission waits, long tasks (2min+), and loop detection
- **Agent templates** — launch agents with preset configurations (Agile Workflow, Code Review, Quick Task, or custom)

### Analytics & Monitoring
- **File Heatmap** — see which files are being touched, by whom, and detect conflicts
- **Performance Scoring** — 0-100 efficiency score per session with penalty breakdown
- **Active Tasks Panel** — real-time tree view of all running tasks and sub-tasks per agent
- **Team Overview** — standup summary of all agents with status and activity

### Office
- **Customizable office** — design your workspace with floors, walls, and 50+ furniture items
- **4-room default layout** — dev area, meeting room, lounge, and recreation room
- **Diverse characters** — 6 unique character styles with hue shifting for unlimited variety
- **Spawn effects** — purple digital rain animation when agents appear/disappear

<p align="center">
  <img src="webview-ui/public/characters.png" alt="AgentCraft characters" width="320" height="72" style="image-rendering: pixelated;">
</p>

## Requirements

- **VS Code 1.85.0+** or **Cursor IDE**
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and configured

## Getting Started

### Install from VSIX

Download the latest `.vsix` from [Releases](https://github.com/fernandopicardi/agent-craft/releases), then:

```bash
# VS Code
code --install-extension agent-craft-2.0.0.vsix

# Cursor
cursor --install-extension agent-craft-2.0.0.vsix
```

Or use the Command Palette: `Extensions: Install from VSIX...`

### Build from source

```bash
git clone https://github.com/fernandopicardi/agent-craft.git
cd agent-craft
npm install
cd webview-ui && npm install && cd ..
npm run build
```

Press **F5** for the Extension Development Host. To generate a `.vsix`:

```bash
npx @vscode/vsce package --allow-missing-repository
```

### Usage

1. Open the **AgentCraft** panel (bottom panel area)
2. Click **+ Agent** and choose a template
3. Start coding — watch your agents come alive
4. Use **Files**, **Team**, **Score**, and **Tasks** buttons for monitoring panels

## Premium Features

AgentCraft offers a freemium model. Free features include all core visualization, office editor, and sound notifications. Premium unlocks:

- Smart OS Notifications (permission, long-task, loop detection)
- File Heatmap with conflict detection
- Agent Orchestration (standup + sub-agent tree)
- Performance Scoring
- Active Tasks Panel
- Custom agent templates

## Office Assets

The furniture tileset is **[Office Interior Tileset (16x16)](https://donarg.itch.io/officetileset)** by **Donarg** ($2 USD on itch.io). The extension works without it — you get characters and basic layout.

```bash
npm run import-tileset
```

## How It Works

AgentCraft watches Claude Code's JSONL transcript files to track agent activity in real-time. No modifications to Claude Code are needed — it's purely observational. The webview runs a lightweight game loop with canvas rendering, BFS pathfinding, and character state machines.

## Tech Stack

- **Extension**: TypeScript, VS Code/Cursor Webview API, esbuild
- **Webview**: React 19, TypeScript, Vite, Canvas 2D
- **Compatibility**: VS Code 1.85.0+, Cursor IDE

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full feature roadmap with 14 features.

## License

[MIT License](LICENSE)
