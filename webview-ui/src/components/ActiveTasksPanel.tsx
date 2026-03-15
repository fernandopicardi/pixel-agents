import { useState } from 'react'
import type { ToolActivity } from '../office/types.js'
import type { SubagentCharacter } from '../hooks/useExtensionMessages.js'

interface ActiveTasksPanelProps {
  isOpen: boolean
  onClose: () => void
  agents: number[]
  agentTools: Record<number, ToolActivity[]>
  agentStatuses: Record<number, string>
  agentLastActivity: Record<number, string>
  subagentTools: Record<number, Record<string, ToolActivity[]>>
  subagentCharacters: SubagentCharacter[]
  isPremium: boolean
  onFocusAgent: (id: number) => void
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 60,
  bottom: 40,
  width: 360,
  zIndex: 48,
  background: 'var(--pixel-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  boxShadow: 'var(--pixel-shadow)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

function StatusBadge({ done, permissionWait }: { done: boolean; permissionWait?: boolean }) {
  if (permissionWait) {
    return <span style={{ fontSize: '12px', color: 'var(--pixel-status-permission)' }}>!</span>
  }
  if (done) {
    return <span style={{ fontSize: '12px', color: 'rgba(0, 206, 201, 0.8)' }}>ok</span>
  }
  return <span className="agent-craft-pulse" style={{ fontSize: '12px', color: 'var(--pixel-status-active)' }}>...</span>
}

function ToolItem({ tool }: { tool: ToolActivity }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '1px 0', fontSize: '16px',
      color: tool.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
    }}>
      <StatusBadge done={tool.done} permissionWait={tool.permissionWait} />
      <span style={{
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        textDecoration: tool.done ? 'line-through' : 'none',
        opacity: tool.done ? 0.6 : 1,
      }}>
        {tool.status}
      </span>
    </div>
  )
}

export function ActiveTasksPanel({
  isOpen, onClose, agents, agentTools, agentStatuses, agentLastActivity,
  subagentTools, subagentCharacters, isPremium, onFocusAgent,
}: ActiveTasksPanelProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  if (!isPremium) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: 12, fontSize: '20px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Active Tasks requires Premium
        </div>
      </div>
    )
  }

  const toggleTask = (key: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 10px', borderBottom: '1px solid var(--pixel-border)',
      }}>
        <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.9)' }}>Active Tasks</span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: '22px', cursor: 'pointer', padding: '0 4px',
        }}>X</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {agents.length === 0 && (
          <div style={{ padding: 12, fontSize: '18px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            No agents running
          </div>
        )}

        {agents.map(agentId => {
          const tools = agentTools[agentId] || []
          const status = agentStatuses[agentId]
          const lastActivity = agentLastActivity[agentId]
          const isIdle = status === 'waiting'
          const activeTasks = tools.filter(t => t.status.startsWith('Subtask:'))
          const directTools = tools.filter(t => !t.status.startsWith('Subtask:'))
          const subs = subagentCharacters.filter(s => s.parentAgentId === agentId)
          const subToolsMap = subagentTools[agentId] || {}

          return (
            <div key={agentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Agent header */}
              <button
                onClick={() => onFocusAgent(agentId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                  padding: '6px 10px', border: 'none', borderRadius: 0, cursor: 'pointer',
                  background: 'transparent', textAlign: 'left',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isIdle ? 'rgba(255,255,255,0.3)' : 'rgba(0, 206, 201, 0.8)',
                }} />
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                  Agent #{agentId}
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                  {tools.filter(t => !t.done).length} active
                </span>
              </button>

              {/* Last activity summary */}
              {lastActivity && (
                <div style={{
                  padding: '0 10px 2px 24px', fontSize: '16px',
                  color: 'rgba(255,255,255,0.45)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {lastActivity}
                </div>
              )}

              {/* Direct tools (non-Task) */}
              {directTools.length > 0 && (
                <div style={{ padding: '2px 10px 2px 24px' }}>
                  {directTools.map(tool => (
                    <ToolItem key={tool.toolId} tool={tool} />
                  ))}
                </div>
              )}

              {/* Task subtasks (expandable) */}
              {subs.map(sub => {
                const taskKey = `${agentId}:${sub.parentToolId}`
                const isExpanded = expandedTasks.has(taskKey)
                const subTools = subToolsMap[sub.parentToolId] || []
                const parentTask = activeTasks.find(t => t.toolId === sub.parentToolId)
                const taskDone = sub.retired || (parentTask?.done ?? false)

                return (
                  <div key={sub.id} style={{ padding: '0 10px 0 20px' }}>
                    {/* Task row */}
                    <button
                      onClick={() => toggleTask(taskKey)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, width: '100%',
                        padding: '3px 4px', border: 'none', borderRadius: 0, cursor: 'pointer',
                        background: 'transparent', textAlign: 'left',
                      }}
                    >
                      <span style={{
                        fontSize: '14px', color: 'rgba(108, 92, 231, 0.7)',
                        width: 12, textAlign: 'center', flexShrink: 0,
                      }}>
                        {isExpanded ? 'v' : '>'}
                      </span>
                      <span style={{
                        fontSize: '14px', flexShrink: 0,
                        color: taskDone ? 'rgba(0, 206, 201, 0.6)' : 'rgba(108, 92, 231, 0.8)',
                      }}>
                        {taskDone ? 'done' : 'task'}
                      </span>
                      <span style={{
                        fontSize: '18px', flex: 1,
                        color: taskDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {sub.label}
                      </span>
                      {subTools.length > 0 && (
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                          {subTools.filter(t => t.done).length}/{subTools.length}
                        </span>
                      )}
                    </button>

                    {/* Expanded sub-tools */}
                    {isExpanded && subTools.length > 0 && (
                      <div style={{ padding: '0 0 2px 20px' }}>
                        {subTools.map(tool => (
                          <ToolItem key={tool.toolId} tool={tool} />
                        ))}
                      </div>
                    )}

                    {/* Retired history */}
                    {isExpanded && taskDone && sub.retiredHistory && sub.retiredHistory.length > 0 && subTools.length === 0 && (
                      <div style={{ padding: '0 0 2px 20px' }}>
                        {sub.retiredHistory.map((item, i) => (
                          <div key={i} style={{
                            fontSize: '16px', color: 'rgba(255,255,255,0.35)',
                            padding: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            <span style={{ fontSize: '12px', color: 'rgba(0, 206, 201, 0.5)', marginRight: 4 }}>ok</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
