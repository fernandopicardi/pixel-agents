# AgentCraft

A VS Code / Cursor IDE extension that turns your AI coding agents into animated pixel art characters in a virtual office.

Each Claude Code terminal you open spawns a character that walks around, sits at desks, and visually reflects what the agent is doing — typing when writing code, reading when searching files, waiting when it needs your attention.

![AgentCraft screenshot](webview-ui/public/Screenshot.jpg)

## Features

- **One agent, one character** — every Claude Code terminal gets its own animated character
- **Live activity tracking** — characters animate based on what the agent is actually doing (writing, reading, running commands)
- **Agent hover tooltip** — hover over any character to see its name, current task, and estimated progress bar
- **Auto-detect existing agents** — terminals already running Claude Code are automatically adopted on startup
- **Office layout editor** — design your office with floors, walls, and furniture using a built-in editor
- **Speech bubbles** — visual indicators when an agent is waiting for input or needs permission
- **Sound notifications** — optional chime when an agent finishes its turn
- **Sub-agent visualization** — Task tool sub-agents spawn as separate characters linked to their parent
- **Persistent layouts** — your office design is saved and shared across windows
- **Diverse characters** — 6 diverse characters based on [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack)
- **Multi-IDE support** — works in both VS Code and Cursor IDE

<p align="center">
  <img src="webview-ui/public/characters.png" alt="AgentCraft characters" width="320" height="72" style="image-rendering: pixelated;">
</p>

## Requirements

- **VS Code 1.85.0+** or **Cursor IDE** (any recent version)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and configured

## Getting Started

### Install from VSIX (VS Code or Cursor)

Download the latest `.vsix` from [Releases](https://github.com/fernandopicardi/agent-craft/releases), then:

#### Method A — Command Palette (recommended)

1. Open VS Code or Cursor IDE
2. Open the **Command Palette** with `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. Type **`Extensions: Install from VSIX...`** and select it
4. Navigate to the `.vsix` file and select it

#### Method B — Command Line

```bash
# VS Code
code --install-extension agent-craft-2.0.0.vsix

# Cursor
cursor --install-extension agent-craft-2.0.0.vsix
```

#### Method C — Drag and Drop

1. Open the **Extensions** panel (`Ctrl+Shift+X`)
2. Drag the `.vsix` file from your file explorer and drop it into the Extensions panel

### Build from source

```bash
git clone https://github.com/fernandopicardi/agent-craft.git
cd agent-craft
npm install
cd webview-ui && npm install && cd ..
npm run build
```

**For development:** press **F5** in VS Code to launch the Extension Development Host.

**To generate a `.vsix`:**

```bash
npx @vscode/vsce package --allow-missing-repository
```

### Usage

1. Open the **AgentCraft** panel (bottom panel area alongside your terminal)
2. Click **+ Agent** to spawn a new Claude Code terminal and its character
3. Start coding with Claude — watch the character react in real time
4. **Hover** over a character to see its current task and progress
5. Click a character to select it, then click a seat to reassign it
6. Click **Layout** to open the office editor and customize your space

## Layout Editor

The built-in editor lets you design your office:

- **Floor** — Full HSB color control
- **Walls** — Auto-tiling walls with color customization
- **Tools** — Select, paint, erase, place, eyedropper, pick
- **Undo/Redo** — 50 levels with Ctrl+Z / Ctrl+Y
- **Export/Import** — Share layouts as JSON files via the Settings modal

The grid is expandable up to 64x64 tiles. Click the ghost border outside the current grid to grow it.

### Office Assets

The office tileset is **[Office Interior Tileset (16x16)](https://donarg.itch.io/officetileset)** by **Donarg**, available on itch.io for **$2 USD**.

The tileset is not included in this repository due to its license. To import it:

```bash
npm run import-tileset
```

The extension works without the tileset — you get default characters and basic layout, but the full furniture catalog requires the imported assets.

## How It Works

AgentCraft watches Claude Code's JSONL transcript files to track what each agent is doing. When an agent uses a tool (like writing a file or running a command), the extension detects it and updates the character's animation accordingly. No modifications to Claude Code are needed — it's purely observational.

The webview runs a lightweight game loop with canvas rendering, BFS pathfinding, and a character state machine (idle -> walk -> type/read). Everything is pixel-perfect at integer zoom levels.

## Tech Stack

- **Extension**: TypeScript, VS Code / Cursor Webview API, esbuild
- **Webview**: React 19, TypeScript, Vite, Canvas 2D
- **Compatibility**: VS Code 1.85.0+, Cursor IDE

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full feature roadmap with 11 planned features across 7 sprints.

## Known Limitations

- **Agent-terminal sync** — sometimes desyncs when terminals are rapidly opened/closed or restored across sessions
- **Heuristic-based status detection** — based on idle timers and turn-duration events; may briefly show wrong status
- **Windows-only testing** — may work on macOS/Linux but untested

## Credits

This project is a fork of [Pixel Agents](https://github.com/pablodelucca/pixel-agents) by **Pablo De Lucca** (original project), licensed under MIT. Character sprites based on [JIK-A-4, Metro City](https://jik-a-4.itch.io/metrocity-free-topdown-character-pack).

## License

This project is licensed under the [MIT License](LICENSE).
