# Changelog

## v2.0.0

**Independent fork** — project now maintained by [@fernandopicardi](https://github.com/fernandopicardi).

### New Features

- **Cursor IDE support** — lowered engine requirement to `^1.85.0`, runtime IDE detection, full Cursor compatibility
- **Auto-adopt existing terminals** — Claude Code terminals already running are automatically detected and adopted on extension startup (scoped per project)
- **Agent hover tooltip with progress** — hover over any character to see agent name, current task description, and estimated completion progress bar
- **IDE detection** — Settings modal shows whether running in VS Code or Cursor

### Infrastructure

- **ROADMAP.md** — comprehensive feature roadmap with 11 planned features across 7 sprints
- Version bump to 2.0.0, new publisher (`fernandopicardi`), repository updated

---

## v1.0.2 (upstream)

### Bug Fixes

- macOS path sanitization and file watching reliability
- Workspace folder picker for multi-root workspaces
- Lower VS Code engine requirement to ^1.107.0

## v1.0.1 (upstream)

Initial public release by [@pablodelucca](https://github.com/pablodelucca).
