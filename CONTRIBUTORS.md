# Contributing to AgentCraft

Thanks for your interest in contributing! All contributions are welcome.

This project is licensed under the [MIT License](LICENSE).

## Getting Started

```bash
git clone https://github.com/fernandopicardi/agent-craft.git
cd agent-craft
npm install
cd webview-ui && npm install && cd ..
npm run build
```

Press **F5** in VS Code to launch the Extension Development Host.

## Development Workflow

```bash
npm run watch
```

> The webview (Vite) is not included in `watch` — after changing webview code, run `npm run build:webview`.

## Code Guidelines

- **Constants centralized:** `src/constants.ts` (backend), `webview-ui/src/constants.ts` (frontend)
- **No enums** — use `as const` objects
- **`import type`** required for type-only imports
- **Pixel art aesthetic** — sharp corners, solid borders, no blur, FS Pixel Sans font

## Submitting a Pull Request

1. Fork and create a feature branch from `main`
2. Run `npm run build` to verify
3. Open a PR with description, test steps, and screenshots for UI changes

## Reporting Issues

[Open an issue](https://github.com/fernandopicardi/agent-craft/issues) with reproduction steps, VS Code/Cursor version, and OS.
