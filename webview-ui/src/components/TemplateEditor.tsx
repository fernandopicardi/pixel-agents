import { useState } from 'react'
import type { AgentTemplateState } from '../hooks/useExtensionMessages.js'

interface TemplateEditorProps {
  /** Template to edit, or undefined for new template */
  template?: AgentTemplateState
  onSave: (template: AgentTemplateState) => void
  onCancel: () => void
}

const labelStyle: React.CSSProperties = {
  fontSize: '20px',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: 2,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: '20px',
  padding: '4px 6px',
  background: 'rgba(255, 255, 255, 0.05)',
  color: 'rgba(255, 255, 255, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 0,
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 60,
  fontFamily: 'inherit',
}

const btnStyle: React.CSSProperties = {
  fontSize: '20px',
  padding: '4px 12px',
  borderRadius: 0,
  cursor: 'pointer',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'rgba(255, 255, 255, 0.8)',
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [cliFlags, setCliFlags] = useState(template?.cliFlags || '')
  const [appendSystemPrompt, setAppendSystemPrompt] = useState(template?.appendSystemPrompt || '')
  const [palette, setPalette] = useState<number | undefined>(template?.palette)

  const isEdit = !!template
  const canSave = name.trim().length > 0

  const handleSave = () => {
    if (!canSave) return
    const id = template?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    onSave({
      id,
      name: name.trim(),
      description: description.trim(),
      cliFlags: cliFlags.trim() || undefined,
      appendSystemPrompt: appendSystemPrompt.trim() || undefined,
      palette,
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 60,
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 61,
          background: 'var(--pixel-bg)',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
          padding: '8px 12px',
          boxShadow: 'var(--pixel-shadow)',
          minWidth: 300,
          maxWidth: 400,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            borderBottom: '1px solid var(--pixel-border)',
            paddingBottom: 4,
          }}
        >
          <span style={{ fontSize: '22px', color: 'rgba(255, 255, 255, 0.9)' }}>
            {isEdit ? 'Edit Template' : 'New Template'}
          </span>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            X
          </button>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 6 }}>
          <div style={labelStyle}>Name *</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Custom Workflow"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 6 }}>
          <div style={labelStyle}>Description</div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            style={inputStyle}
          />
        </div>

        {/* System Prompt */}
        <div style={{ marginBottom: 6 }}>
          <div style={labelStyle}>System Prompt (appended)</div>
          <textarea
            value={appendSystemPrompt}
            onChange={(e) => setAppendSystemPrompt(e.target.value)}
            placeholder="Extra instructions for the agent..."
            style={textareaStyle}
          />
        </div>

        {/* CLI Flags */}
        <div style={{ marginBottom: 6 }}>
          <div style={labelStyle}>Extra CLI Flags</div>
          <input
            type="text"
            value={cliFlags}
            onChange={(e) => setCliFlags(e.target.value)}
            placeholder="e.g. --model claude-sonnet-4-5-20250514"
            style={inputStyle}
          />
        </div>

        {/* Palette */}
        <div style={{ marginBottom: 8 }}>
          <div style={labelStyle}>Preferred Palette</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setPalette(undefined)}
              style={{
                ...btnStyle,
                fontSize: '18px',
                padding: '2px 8px',
                background: palette === undefined ? 'rgba(90, 140, 255, 0.3)' : 'transparent',
                border: palette === undefined ? '1px solid rgba(90, 140, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              Auto
            </button>
            {[0, 1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                onClick={() => setPalette(p)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 0,
                  cursor: 'pointer',
                  background: [
                    '#c8a078', // 0 - warm
                    '#a07858', // 1 - tan
                    '#785838', // 2 - brown
                    '#d8b8a0', // 3 - light
                    '#90c890', // 4 - green tint
                    '#a0a0d8', // 5 - blue tint
                  ][p],
                  border: palette === p ? '2px solid #fff' : '2px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnStyle}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              ...btnStyle,
              background: canSave ? 'rgba(90, 140, 255, 0.3)' : 'rgba(255, 255, 255, 0.04)',
              color: canSave ? 'rgba(90, 140, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
              border: canSave ? '1px solid rgba(90, 140, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: canSave ? 'pointer' : 'default',
            }}
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </>
  )
}
