import type * as vscode from 'vscode';
import type { AgentTemplate } from './types.js';
import { WORKSPACE_KEY_TEMPLATES } from './constants.js';

/** Built-in templates that ship with the extension */
export const BUILT_IN_TEMPLATES: AgentTemplate[] = [
	{
		id: 'agile-workflow',
		name: 'Agile Workflow',
		description: 'Structured agent with task planning, progress updates, and iterative delivery',
		builtIn: true,
		appendSystemPrompt: [
			'You follow an agile workflow. Before starting any task:',
			'1. Break the work into small, deliverable increments',
			'2. State your plan briefly before coding',
			'3. After each increment, summarize what was done and what remains',
			'4. If blocked, state the blocker clearly and suggest alternatives',
			'5. Prefer working code over perfect code — iterate',
			'6. When done, provide a concise summary of all changes made',
		].join('\n'),
	},
	{
		id: 'code-review',
		name: 'Code Review',
		description: 'Read-focused agent for reviewing code, finding bugs, and suggesting improvements',
		builtIn: true,
		appendSystemPrompt: [
			'You are a code reviewer. Your primary job is to READ and ANALYZE code, not modify it.',
			'Focus on: bugs, security issues, performance problems, code quality, and maintainability.',
			'Structure your review as:',
			'1. Overview — what does this code do?',
			'2. Issues — categorized by severity (critical, warning, suggestion)',
			'3. Positive — what is done well',
			'Only suggest edits when explicitly asked. Prefer explanations over changes.',
		].join('\n'),
	},
	{
		id: 'quick-task',
		name: 'Quick Task',
		description: 'Minimal agent — no extra prompts, just vanilla Claude Code',
		builtIn: true,
	},
];

/** Get all templates: built-in + user-created, sorted with built-in first */
export function getAllTemplates(context: vscode.ExtensionContext): AgentTemplate[] {
	const custom = context.workspaceState.get<AgentTemplate[]>(WORKSPACE_KEY_TEMPLATES, []);
	return [...BUILT_IN_TEMPLATES, ...custom];
}

/** Get a specific template by ID */
export function getTemplateById(context: vscode.ExtensionContext, id: string): AgentTemplate | undefined {
	return getAllTemplates(context).find(t => t.id === id);
}

/** Save a custom template (create or update). Built-in templates cannot be modified. */
export function saveCustomTemplate(context: vscode.ExtensionContext, template: AgentTemplate): void {
	if (BUILT_IN_TEMPLATES.some(t => t.id === template.id)) return;
	const custom = context.workspaceState.get<AgentTemplate[]>(WORKSPACE_KEY_TEMPLATES, []);
	const idx = custom.findIndex(t => t.id === template.id);
	if (idx >= 0) {
		custom[idx] = template;
	} else {
		custom.push(template);
	}
	context.workspaceState.update(WORKSPACE_KEY_TEMPLATES, custom);
}

/** Delete a custom template by ID. Built-in templates cannot be deleted. */
export function deleteCustomTemplate(context: vscode.ExtensionContext, id: string): void {
	if (BUILT_IN_TEMPLATES.some(t => t.id === id)) return;
	const custom = context.workspaceState.get<AgentTemplate[]>(WORKSPACE_KEY_TEMPLATES, []);
	const filtered = custom.filter(t => t.id !== id);
	context.workspaceState.update(WORKSPACE_KEY_TEMPLATES, filtered);
}
