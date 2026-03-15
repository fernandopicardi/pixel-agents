import { useState } from 'react'
import type { PerformanceScoreState } from '../hooks/useExtensionMessages.js'

interface PerformanceCardProps {
  isOpen: boolean
  onClose: () => void
  agentScores: Record<number, PerformanceScoreState>
  agents: number[]
  isPremium: boolean
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 60,
  bottom: 40,
  width: 300,
  zIndex: 48,
  background: 'var(--pixel-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  boxShadow: 'var(--pixel-shadow)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'rgba(80, 200, 80, 0.9)'
  if (score >= 60) return 'rgba(220, 180, 50, 0.9)'
  if (score >= 40) return 'rgba(220, 130, 50, 0.9)'
  return 'rgba(220, 80, 60, 0.9)'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 35) return 'Needs Improvement'
  return 'Poor'
}

export function PerformanceCard({ isOpen, onClose, agentScores, agents, isPremium }: PerformanceCardProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (!isOpen) return null

  if (!isPremium) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: 12, fontSize: '20px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Performance Scoring requires Premium
        </div>
      </div>
    )
  }

  const scoredAgents = agents.filter(id => agentScores[id])
  const unscoredAgents = agents.filter(id => !agentScores[id])

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 10px', borderBottom: '1px solid var(--pixel-border)',
      }}>
        <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.9)' }}>Performance</span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: '22px', cursor: 'pointer', padding: '0 4px',
        }}>X</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {scoredAgents.length === 0 && unscoredAgents.length === 0 && (
          <div style={{ padding: 12, fontSize: '18px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            No agents to score
          </div>
        )}

        {/* Active (unscored) agents */}
        {unscoredAgents.map(id => (
          <div
            key={id}
            style={{
              padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)' }}>Agent #{id}</span>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                Running...
              </span>
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              Score calculated when session ends
            </div>
          </div>
        ))}

        {/* Scored agents */}
        {scoredAgents.map(id => {
          const s = agentScores[id]
          const color = getScoreColor(s.score)
          return (
            <div
              key={id}
              onMouseEnter={() => setHovered(`score-${id}`)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: hovered === `score-${id}` ? 'rgba(255,255,255,0.04)' : 'transparent',
              }}
            >
              {/* Score header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)' }}>Agent #{id}</span>
                <span style={{
                  fontSize: '28px', color, fontWeight: 'bold', marginLeft: 'auto',
                }}>{s.score}</span>
              </div>
              <div style={{ fontSize: '16px', color, marginTop: 2 }}>
                {getScoreLabel(s.score)}
              </div>

              {/* Score bar */}
              <div style={{
                marginTop: 4, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 0,
              }}>
                <div style={{
                  height: '100%', width: `${s.score}%`, background: color, borderRadius: 0,
                }} />
              </div>

              {/* Breakdown */}
              <div style={{ marginTop: 6, display: 'flex', gap: 8, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                <span>{s.toolCount} tools</span>
                <span>{s.turnCount} turns</span>
                <span>{s.filesEdited} files</span>
              </div>
              {(s.breakdown.loopPenalty > 0 || s.breakdown.revertPenalty > 0 || s.breakdown.idlePenalty > 0) && (
                <div style={{ marginTop: 2, fontSize: '14px', color: 'rgba(255,80,80,0.6)' }}>
                  Penalties:
                  {s.breakdown.loopPenalty > 0 && ` loops(-${s.breakdown.loopPenalty})`}
                  {s.breakdown.revertPenalty > 0 && ` reverts(-${s.breakdown.revertPenalty})`}
                  {s.breakdown.idlePenalty > 0 && ` waits(-${s.breakdown.idlePenalty})`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
