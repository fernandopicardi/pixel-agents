import { useState, useMemo } from 'react'
import { vscode } from '../vscodeApi.js'
import type { FileAccessRecord } from '../hooks/useExtensionMessages.js'

interface FileHeatmapProps {
  isOpen: boolean
  onClose: () => void
  fileAccesses: FileAccessRecord[]
  agents: number[]
  isPremium: boolean
}

interface FileEntry {
  filePath: string
  shortName: string
  readCount: number
  writeCount: number
  agents: Set<number>
  lastAccess: number
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 60,
  bottom: 40,
  width: 320,
  zIndex: 48,
  background: 'var(--pixel-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  boxShadow: 'var(--pixel-shadow)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

function getHeatColor(writeCount: number): string {
  if (writeCount === 0) return 'rgba(80, 200, 80, 0.7)' // green — read only
  if (writeCount === 1) return 'rgba(220, 180, 50, 0.7)' // yellow — edited once
  return 'rgba(220, 80, 60, 0.7)' // red — edited many times
}

export function FileHeatmap({ isOpen, onClose, fileAccesses, agents, isPremium }: FileHeatmapProps) {
  const [filterAgent, setFilterAgent] = useState<number | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const fileMap = useMemo(() => {
    const map = new Map<string, FileEntry>()
    for (const access of fileAccesses) {
      if (filterAgent !== null && access.agentId !== filterAgent) continue
      let entry = map.get(access.filePath)
      if (!entry) {
        const parts = access.filePath.replace(/\\/g, '/').split('/')
        entry = {
          filePath: access.filePath,
          shortName: parts.slice(-2).join('/'),
          readCount: 0,
          writeCount: 0,
          agents: new Set(),
          lastAccess: 0,
        }
        map.set(access.filePath, entry)
      }
      if (access.toolName === 'Edit' || access.toolName === 'Write') {
        entry.writeCount++
      } else {
        entry.readCount++
      }
      entry.agents.add(access.agentId)
      entry.lastAccess = Math.max(entry.lastAccess, access.timestamp)
    }
    // Sort by total touches descending
    return [...map.values()].sort((a, b) => (b.readCount + b.writeCount) - (a.readCount + a.writeCount))
  }, [fileAccesses, filterAgent])

  if (!isOpen) return null

  if (!isPremium) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: 12, fontSize: '20px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          File Heatmap requires Premium
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
        <span style={{ fontSize: '22px', color: 'rgba(255,255,255,0.9)' }}>File Heatmap</span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: '22px', cursor: 'pointer', padding: '0 4px',
        }}>X</button>
      </div>

      {/* Agent filter */}
      {agents.length > 1 && (
        <div style={{ padding: '4px 10px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--pixel-border)' }}>
          <button
            onClick={() => setFilterAgent(null)}
            style={{
              fontSize: '16px', padding: '1px 6px', borderRadius: 0, cursor: 'pointer',
              background: filterAgent === null ? 'rgba(90,140,255,0.3)' : 'transparent',
              color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)',
            }}
          >All</button>
          {agents.map(id => (
            <button key={id} onClick={() => setFilterAgent(id)} style={{
              fontSize: '16px', padding: '1px 6px', borderRadius: 0, cursor: 'pointer',
              background: filterAgent === id ? 'rgba(90,140,255,0.3)' : 'transparent',
              color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)',
            }}>#{id}</button>
          ))}
        </div>
      )}

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {fileMap.length === 0 && (
          <div style={{ padding: '12px 10px', fontSize: '18px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            No file activity yet
          </div>
        )}
        {fileMap.map(entry => {
          const total = entry.readCount + entry.writeCount
          const isConflict = entry.agents.size > 1 && entry.writeCount > 0
          return (
            <button
              key={entry.filePath}
              onClick={() => vscode.postMessage({ type: 'openFile', filePath: entry.filePath })}
              onMouseEnter={() => setHovered(entry.filePath)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '3px 10px', fontSize: '18px', textAlign: 'left',
                background: hovered === entry.filePath ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 0, cursor: 'pointer',
              }}
            >
              {/* Heat indicator */}
              <span style={{
                width: 8, height: 8, flexShrink: 0, borderRadius: 0,
                background: getHeatColor(entry.writeCount),
              }} />
              {/* Conflict indicator */}
              {isConflict && (
                <span style={{ fontSize: '14px', color: 'rgba(255,80,80,0.9)', flexShrink: 0 }}>!</span>
              )}
              {/* File name */}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.shortName}
              </span>
              {/* Count */}
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                {total}x
              </span>
              {/* Agent count */}
              {entry.agents.size > 1 && (
                <span style={{ fontSize: '14px', color: 'rgba(90,140,255,0.6)', flexShrink: 0 }}>
                  {entry.agents.size}ag
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        padding: '4px 10px', borderTop: '1px solid var(--pixel-border)',
        display: 'flex', gap: 8, fontSize: '14px', color: 'rgba(255,255,255,0.4)',
      }}>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, background: 'rgba(80,200,80,0.7)', marginRight: 2 }} /> read</span>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, background: 'rgba(220,180,50,0.7)', marginRight: 2 }} /> edit</span>
        <span><span style={{ display: 'inline-block', width: 6, height: 6, background: 'rgba(220,80,60,0.7)', marginRight: 2 }} /> many</span>
        <span><span style={{ fontSize: '12px', color: 'rgba(255,80,80,0.9)', marginRight: 2 }}>!</span> conflict</span>
      </div>
    </div>
  )
}
