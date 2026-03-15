import { useState } from 'react'
import type { SubagentCharacter } from '../hooks/useExtensionMessages.js'
import type { ToolActivity } from '../office/types.js'

interface OrchestrationPanelProps {
  isOpen: boolean
  onClose: () => void
  agents: number[]
  agentTools: Record<number, ToolActivity[]>
  agentStatuses: Record<number, string>
  agentLastActivity: Record<number, string>
  subagentCharacters: SubagentCharacter[]
  isPremium: boolean
  onFocusAgent: (id: number) => void
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 60,
  bottom: 40,
  width: 340,
  zIndex: 48,
  background: 'var(--pixel-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  boxShadow: 'var(--pixel-shadow)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

type ViewTab = 'standup' | 'tree'

function getStatusDot(status: string | undefined, hasTools: boolean): { color: string; label: string } {
  if (status === 'waiting') return { color: 'rgba(80, 200, 80, 0.8)', label: 'Idle' }
  if (hasTools) return { color: 'rgba(90, 200, 90, 0.9)', label: 'Active' }
  return { color: 'rgba(255, 255, 255, 0.3)', label: 'Inactive' }
}

export function OrchestrationPanel({
  isOpen, onClose, agents, agentTools, agentStatuses, agentLastActivity,
  subagentCharacters, isPremium, onFocusAgent,
}: OrchestrationPanelProps) {
  const [tab, setTab] = useState<ViewTab>('standup')
  const [hovered, setHovered] = useState<string | null>(null)

  if (!isOpen) return null

  if (!isPremium) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: 12, fontSize: '20px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Agent Orchestration requires Premium
        </div>
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 10px', borderBottom: '1px solid var(--pixel-border)',
      }}>
        <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.9)' }}>Agents</span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: '22px', cursor: 'pointer', padding: '0 4px',
        }}>X</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--pixel-border)' }}>
        {(['standup', 'tree'] as ViewTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '4px 0', fontSize: '20px', cursor: 'pointer',
            background: tab === t ? 'rgba(90,140,255,0.15)' : 'transparent',
            color: tab === t ? 'rgba(90,140,255,0.9)' : 'rgba(255,255,255,0.5)',
            border: 'none', borderBottom: tab === t ? '2px solid rgba(90,140,255,0.6)' : '2px solid transparent',
            borderRadius: 0,
          }}>{t === 'standup' ? 'Standup' : 'Sub-agents'}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {tab === 'standup' && (
          <>
            {agents.length === 0 && (
              <div style={{ padding: 12, fontSize: '18px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                No agents running
              </div>
            )}
            {agents.map(id => {
              const tools = agentTools[id] || []
              const activeTools = tools.filter(t => !t.done)
              const status = agentStatuses[id]
              const lastActivity = agentLastActivity[id]
              const dot = getStatusDot(status, activeTools.length > 0)
              const subs = subagentCharacters.filter(s => s.parentAgentId === id)

              return (
                <button
                  key={id}
                  onClick={() => onFocusAgent(id)}
                  onMouseEnter={() => setHovered(`agent-${id}`)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 10px', border: 'none', borderRadius: 0, cursor: 'pointer',
                    background: hovered === `agent-${id}` ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: dot.color,
                    }} />
                    <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)' }}>
                      Agent #{id}
                    </span>
                    <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                      {dot.label}
                    </span>
                  </div>
                  {lastActivity && (
                    <div style={{
                      fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: 2, marginLeft: 14,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {activeTools.length > 0 ? activeTools[activeTools.length - 1].status : lastActivity}
                    </div>
                  )}
                  {subs.length > 0 && (
                    <div style={{ fontSize: '14px', color: 'rgba(90,140,255,0.6)', marginTop: 2, marginLeft: 14 }}>
                      {subs.length} sub-agent{subs.length > 1 ? 's' : ''} active
                    </div>
                  )}
                </button>
              )
            })}
          </>
        )}

        {tab === 'tree' && (
          <>
            {subagentCharacters.length === 0 && (
              <div style={{ padding: 12, fontSize: '18px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                No sub-agents active
              </div>
            )}
            {/* Group sub-agents by parent */}
            {agents.map(parentId => {
              const subs = subagentCharacters.filter(s => s.parentAgentId === parentId)
              if (subs.length === 0) return null
              return (
                <div key={parentId} style={{ marginBottom: 4 }}>
                  <button
                    onClick={() => onFocusAgent(parentId)}
                    onMouseEnter={() => setHovered(`tree-parent-${parentId}`)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '4px 10px', fontSize: '20px', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 0,
                      background: hovered === `tree-parent-${parentId}` ? 'rgba(255,255,255,0.06)' : 'transparent',
                    }}
                  >
                    Agent #{parentId}
                  </button>
                  {subs.map(sub => (
                    <div
                      key={sub.id}
                      onMouseEnter={() => setHovered(`tree-sub-${sub.id}`)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        padding: '3px 10px 3px 24px', fontSize: '18px',
                        color: 'rgba(255,255,255,0.6)',
                        background: hovered === `tree-sub-${sub.id}` ? 'rgba(255,255,255,0.04)' : 'transparent',
                      }}
                    >
                      <span style={{ color: 'rgba(90,140,255,0.6)', marginRight: 4 }}>|-</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Sub #{Math.abs(sub.id)}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6, fontSize: '16px' }}>
                        {sub.label.length > 40 ? sub.label.slice(0, 40) + '\u2026' : sub.label}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
