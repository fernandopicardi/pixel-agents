/**
 * Registry of premium features. Used by both extension backend and webview
 * to gate features behind license validation.
 */
export const PremiumFeature = {
	TOOLTIP_PROGRESS_BAR: 'tooltip_progress_bar',
	SMART_NOTIFICATIONS: 'smart_notifications',
	AGENT_TEMPLATES: 'agent_templates',
	ACTIVITY_TIMELINE: 'activity_timeline',
	AGENT_DASHBOARD: 'agent_dashboard',
	COST_BUDGET: 'cost_budget',
	FILE_HEATMAP: 'file_heatmap',
	GIT_AWARENESS: 'git_awareness',
	AGENT_ORCHESTRATION: 'agent_orchestration',
	PERFORMANCE_SCORING: 'performance_scoring',
	PROJECT_MAP: 'project_map',
} as const;

export type PremiumFeatureId = typeof PremiumFeature[keyof typeof PremiumFeature];

export const PREMIUM_FEATURE_LABELS: Record<PremiumFeatureId, string> = {
	[PremiumFeature.TOOLTIP_PROGRESS_BAR]: 'Progress Bar',
	[PremiumFeature.SMART_NOTIFICATIONS]: 'Smart Notifications',
	[PremiumFeature.AGENT_TEMPLATES]: 'Agent Templates',
	[PremiumFeature.ACTIVITY_TIMELINE]: 'Activity Timeline',
	[PremiumFeature.AGENT_DASHBOARD]: 'Agent Dashboard',
	[PremiumFeature.COST_BUDGET]: 'Cost Budget & Guardrails',
	[PremiumFeature.FILE_HEATMAP]: 'File Heatmap',
	[PremiumFeature.GIT_AWARENESS]: 'Git Awareness',
	[PremiumFeature.AGENT_ORCHESTRATION]: 'Agent Orchestration',
	[PremiumFeature.PERFORMANCE_SCORING]: 'Performance Scoring',
	[PremiumFeature.PROJECT_MAP]: 'Project Map',
};
