import * as vscode from 'vscode';
import { PixelAgentsViewProvider } from './PixelAgentsViewProvider.js';
import { VIEW_ID, COMMAND_SHOW_PANEL, COMMAND_EXPORT_DEFAULT_LAYOUT } from './constants.js';
import { detectIde, getIdeDisplayName } from './ideDetector.js';

let providerInstance: PixelAgentsViewProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
	const ide = detectIde();
	const ideName = getIdeDisplayName(ide);
	console.log(`[Pixel Agents] Activating in ${ideName} (appName: "${vscode.env.appName}")`);

	const provider = new PixelAgentsViewProvider(context, ide);
	providerInstance = provider;

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(VIEW_ID, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_SHOW_PANEL, () => {
			vscode.commands.executeCommand(`${VIEW_ID}.focus`);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMAND_EXPORT_DEFAULT_LAYOUT, () => {
			provider.exportDefaultLayout();
		})
	);
}

export function deactivate() {
	providerInstance?.dispose();
}
