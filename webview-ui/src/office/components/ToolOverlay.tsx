import { useState, useEffect } from 'react'
import type { ToolActivity } from '../types.js'
import type { OfficeState } from '../engine/officeState.js'
import type { SubagentCharacter, AgentProgress } from '../../hooks/useExtensionMessages.js'
import { TILE_SIZE, CharacterState } from '../types.js'
import { TOOL_OVERLAY_VERTICAL_OFFSET, CHARACTER_SITTING_OFFSET_PX } from '../../constants.js'

/** Rough average tools per turn for progress estimation */
const AVG_TOOLS_PER_TURN = 8

interface ToolOverlayProps {
  officeState: OfficeState
  agents: number[]
  agentTools: Record<number, ToolActivity[]>
  agentProgress: Record<number, AgentProgress>
  isPremium: boolean
  subagentCharacters: SubagentCharacter[]
  containerRef: React.RefObject<HTMLDivElement | null>
  zoom: number
  panRef: React.RefObject<{ x: number; y: number }>
  onCloseAgent: (id: number) => void
}

/** Derive a short human-readable activity string from tools/status */
function getActivityText(
  agentId: number,
  agentTools: Record<number, ToolActivity[]>,
  isActive: boolean,
): string {
  const tools = agentTools[agentId]
  if (tools && tools.length > 0) {
    // Find the latest non-done tool
    const activeTool = [...tools].reverse().find((t) => !t.done)
    if (activeTool) {
      if (activeTool.permissionWait) return 'Needs approval'
      return activeTool.status
    }
    // All tools done but agent still active (mid-turn) — keep showing last tool status
    if (isActive) {
      const lastTool = tools[tools.length - 1]
      if (lastTool) return lastTool.status
    }
  }

  return 'Idle'
}

/** Estimate turn progress as 0–100 based on completed tool count */
function estimateProgress(agentId: number, agentProgress: Record<number, AgentProgress>, isActive: boolean): number | null {
  if (!isActive) return null
  const progress = agentProgress[agentId]
  if (!progress || progress.toolCount === 0) return null
  // Logarithmic curve: fast early progress, slows down approaching 100%
  // Never reaches 100% (completion is signaled by turn_duration / waiting status)
  const pct = Math.min(95, Math.round((1 - Math.exp(-progress.toolCount / AVG_TOOLS_PER_TURN)) * 100))
  return pct
}

export function ToolOverlay({
  officeState,
  agents,
  agentTools,
  agentProgress,
  isPremium,
  subagentCharacters,
  containerRef,
  zoom,
  panRef,
  onCloseAgent,
}: ToolOverlayProps) {
  const [, setTick] = useState(0)
  useEffect(() => {
    let rafId = 0
    const tick = () => {
      setTick((n) => n + 1)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const el = containerRef.current
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const canvasW = Math.round(rect.width * dpr)
  const canvasH = Math.round(rect.height * dpr)
  const layout = officeState.getLayout()
  const mapW = layout.cols * TILE_SIZE * zoom
  const mapH = layout.rows * TILE_SIZE * zoom
  const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(panRef.current.x)
  const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(panRef.current.y)

  const selectedId = officeState.selectedAgentId
  const hoveredId = officeState.hoveredAgentId

  // All character IDs
  const allIds = [...agents, ...subagentCharacters.map((s) => s.id)]

  return (
    <>
      {allIds.map((id) => {
        const ch = officeState.characters.get(id)
        if (!ch) return null

        const isSelected = selectedId === id
        const isHovered = hoveredId === id
        const isSub = ch.isSubagent

        // Only show for hovered or selected agents
        if (!isSelected && !isHovered) return null

        // Position above character
        const sittingOffset = ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0
        const screenX = (deviceOffsetX + ch.x * zoom) / dpr
        const screenY = (deviceOffsetY + (ch.y + sittingOffset - TOOL_OVERLAY_VERTICAL_OFFSET) * zoom) / dpr

        // Get activity text
        const subHasPermission = isSub && ch.bubbleType === 'permission'
        const sub = isSub ? subagentCharacters.find((s) => s.id === id) : null
        const isRetired = ch.isRetired
        let activityText: string
        if (isRetired && sub) {
          activityText = `Done: ${sub.label}`
        } else if (isSub) {
          if (subHasPermission) {
            activityText = 'Needs approval'
          } else {
            activityText = sub ? sub.label : 'Subtask'
          }
        } else {
          activityText = getActivityText(id, agentTools, ch.isActive)
        }

        // Determine dot color
        const tools = agentTools[id]
        const hasPermission = subHasPermission || tools?.some((t) => t.permissionWait && !t.done)
        const hasActiveTools = tools?.some((t) => !t.done)
        const isActive = ch.isActive

        let dotColor: string | null = null
        if (isRetired) {
          dotColor = 'rgba(108, 92, 231, 0.6)' // muted purple for retired
        } else if (hasPermission) {
          dotColor = 'var(--pixel-status-permission)'
        } else if (isActive && hasActiveTools) {
          dotColor = 'var(--pixel-status-active)'
        }

        // Progress estimation
        const progress = isSub ? null : estimateProgress(id, agentProgress, isActive)

        // Agent display name
        const agentLabel = isSub
          ? undefined
          : ch.folderName || `Agent #${id}`

        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY - 24,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: isSelected || isRetired ? 'auto' : 'none',
              zIndex: isSelected ? 'var(--pixel-overlay-selected-z)' : 'var(--pixel-overlay-z)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                background: 'var(--pixel-bg)',
                border: isSelected
                  ? '2px solid var(--pixel-border-light)'
                  : '2px solid var(--pixel-border)',
                borderRadius: 0,
                padding: isSelected ? '3px 6px 3px 8px' : '3px 8px',
                boxShadow: 'var(--pixel-shadow)',
                whiteSpace: 'nowrap',
                maxWidth: 240,
                minWidth: 80,
              }}
            >
              {/* Top row: dot + activity text + close button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {dotColor && (
                  <span
                    className={isActive && !hasPermission ? 'agent-craft-pulse' : undefined}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: dotColor,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  {agentLabel && (
                    <span
                      style={{
                        fontSize: '16px',
                        color: 'var(--pixel-text-dim)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                    >
                      {agentLabel}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: isSub ? '20px' : '22px',
                      fontStyle: isSub ? 'italic' : undefined,
                      color: 'var(--vscode-foreground)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                    }}
                  >
                    {activityText}
                  </span>
                </div>
                {isSelected && !isSub && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseAgent(id)
                    }}
                    title="Close agent"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--pixel-close-text)',
                      cursor: 'pointer',
                      padding: '0 2px',
                      fontSize: '26px',
                      lineHeight: 1,
                      marginLeft: 2,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--pixel-close-hover)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--pixel-close-text)'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              {/* Retired sub-agent history — shown when selected */}
              {isRetired && isSelected && sub?.retiredHistory && sub.retiredHistory.length > 0 && (
                <div style={{ marginTop: 3, maxHeight: 80, overflowY: 'auto' }}>
                  <div style={{ fontSize: '14px', color: 'rgba(108, 92, 231, 0.7)', marginBottom: 2 }}>
                    History ({sub.retiredHistory.length} actions)
                  </div>
                  {sub.retiredHistory.slice(-5).map((item, i) => (
                    <div key={i} style={{
                      fontSize: '14px', color: 'rgba(255,255,255,0.5)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item}
                    </div>
                  ))}
                </div>
              )}
              {/* Progress bar — premium only */}
              {progress !== null && isPremium && (
                <div
                  style={{
                    marginTop: 3,
                    height: 4,
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: hasPermission
                        ? 'var(--pixel-status-permission)'
                        : 'var(--pixel-status-active)',
                      transition: 'width 0.3s ease-out',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
