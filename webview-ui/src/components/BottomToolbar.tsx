import { useState, useEffect, useRef } from 'react'
import { SettingsModal } from './SettingsModal.js'
import type { WorkspaceFolder, IdeType, LicenseState, NotificationPrefsState, AgentTemplateState } from '../hooks/useExtensionMessages.js'
import { vscode } from '../vscodeApi.js'

interface BottomToolbarProps {
  isEditMode: boolean
  onOpenClaude: () => void
  onToggleEditMode: () => void
  isDebugMode: boolean
  onToggleDebugMode: () => void
  workspaceFolders: WorkspaceFolder[]
  ideType: IdeType
  license: LicenseState
  onSubmitLicense: (key: string) => void
  onClearLicense: () => void
  notificationPrefs: NotificationPrefsState
  onNotificationPrefsChange: (prefs: NotificationPrefsState) => void
  templates: AgentTemplateState[]
  onSaveTemplate: (template: AgentTemplateState) => void
  onDeleteTemplate: (id: string) => void
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 10,
  left: 10,
  zIndex: 'var(--pixel-controls-z)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--pixel-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  padding: '4px 6px',
  boxShadow: 'var(--pixel-shadow)',
}

const btnBase: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '24px',
  color: 'var(--pixel-text)',
  background: 'var(--pixel-btn-bg)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

const btnActive: React.CSSProperties = {
  ...btnBase,
  background: 'var(--pixel-active-bg)',
  border: '2px solid var(--pixel-accent)',
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '6px 10px',
  fontSize: '22px',
  color: 'var(--pixel-text)',
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
}


export function BottomToolbar({
  isEditMode,
  onOpenClaude,
  onToggleEditMode,
  isDebugMode,
  onToggleDebugMode,
  workspaceFolders,
  ideType,
  license,
  onSubmitLicense,
  onClearLicense,
  notificationPrefs,
  onNotificationPrefsChange,
  templates,
  onSaveTemplate,
  onDeleteTemplate,
}: BottomToolbarProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  // For multi-root: after picking a template, show folder sub-picker
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click
  useEffect(() => {
    if (!isPickerOpen) return
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false)
        setPendingTemplateId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isPickerOpen])

  const hasMultipleFolders = workspaceFolders.length > 1

  const launchWithTemplate = (templateId?: string, folderPath?: string) => {
    setIsPickerOpen(false)
    setPendingTemplateId(null)
    vscode.postMessage({ type: 'openClaude', templateId, folderPath })
  }

  const handleAgentClick = () => {
    if (templates.length > 0) {
      setIsPickerOpen((v) => !v)
      setPendingTemplateId(null)
    } else if (hasMultipleFolders) {
      setIsPickerOpen((v) => !v)
      setPendingTemplateId(null)
    } else {
      onOpenClaude()
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    if (hasMultipleFolders) {
      setPendingTemplateId(templateId)
    } else {
      launchWithTemplate(templateId)
    }
  }

  // Show folder sub-picker when pendingTemplateId is set
  const showFolderPicker = pendingTemplateId !== null && hasMultipleFolders

  return (
    <div style={panelStyle}>
      <div ref={pickerRef} style={{ position: 'relative' }}>
        <button
          onClick={handleAgentClick}
          onMouseEnter={() => setHovered('agent')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...btnBase,
            padding: '5px 12px',
            background:
              hovered === 'agent' || isPickerOpen
                ? 'var(--pixel-agent-hover-bg)'
                : 'var(--pixel-agent-bg)',
            border: '2px solid var(--pixel-agent-border)',
            color: 'var(--pixel-agent-text)',
          }}
        >
          + Agent
        </button>
        {isPickerOpen && !showFolderPicker && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 4,
              background: 'var(--pixel-bg)',
              border: '2px solid var(--pixel-border)',
              borderRadius: 0,
              boxShadow: 'var(--pixel-shadow)',
              minWidth: 220,
              maxWidth: 300,
              zIndex: 'var(--pixel-controls-z)',
            }}
          >
            {templates.map((tmpl) => {
              const isCustom = !tmpl.builtIn
              const locked = isCustom && !license.isPremium
              return (
                <button
                  key={tmpl.id}
                  onClick={() => !locked && handleTemplateSelect(tmpl.id)}
                  onMouseEnter={() => setHoveredItem(tmpl.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    ...dropdownItemStyle,
                    background: hoveredItem === tmpl.id ? 'var(--pixel-btn-hover-bg)' : 'transparent',
                    opacity: locked ? 0.4 : 1,
                    cursor: locked ? 'default' : 'pointer',
                  }}
                >
                  <div style={{ fontSize: '22px' }}>
                    {tmpl.name}
                    {isCustom && (
                      <span style={{ fontSize: '16px', color: 'rgba(90, 140, 255, 0.6)', marginLeft: 6 }}>
                        {locked ? '(Premium)' : 'custom'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.4)', marginTop: 1 }}>
                    {tmpl.description}
                  </div>
                </button>
              )
            })}
          </div>
        )}
        {isPickerOpen && showFolderPicker && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 4,
              background: 'var(--pixel-bg)',
              border: '2px solid var(--pixel-border)',
              borderRadius: 0,
              boxShadow: 'var(--pixel-shadow)',
              minWidth: 180,
              zIndex: 'var(--pixel-controls-z)',
            }}
          >
            <div
              style={{
                padding: '4px 10px',
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.4)',
                borderBottom: '1px solid var(--pixel-border)',
              }}
            >
              Select workspace folder:
            </div>
            {workspaceFolders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => launchWithTemplate(pendingTemplateId ?? undefined, folder.path)}
                onMouseEnter={() => setHoveredItem(`folder-${folder.path}`)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  ...dropdownItemStyle,
                  background: hoveredItem === `folder-${folder.path}` ? 'var(--pixel-btn-hover-bg)' : 'transparent',
                }}
              >
                {folder.name}
              </button>
            ))}
            <button
              onClick={() => setPendingTemplateId(null)}
              onMouseEnter={() => setHoveredItem('back')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                ...dropdownItemStyle,
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.5)',
                borderTop: '1px solid var(--pixel-border)',
                background: hoveredItem === 'back' ? 'var(--pixel-btn-hover-bg)' : 'transparent',
              }}
            >
              Back
            </button>
          </div>
        )}
      </div>
      <button
        onClick={onToggleEditMode}
        onMouseEnter={() => setHovered('edit')}
        onMouseLeave={() => setHovered(null)}
        style={
          isEditMode
            ? { ...btnActive }
            : {
                ...btnBase,
                background: hovered === 'edit' ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
              }
        }
        title="Edit office layout"
      >
        Layout
      </button>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsSettingsOpen((v) => !v)}
          onMouseEnter={() => setHovered('settings')}
          onMouseLeave={() => setHovered(null)}
          style={
            isSettingsOpen
              ? { ...btnActive }
              : {
                  ...btnBase,
                  background: hovered === 'settings' ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
                }
          }
          title="Settings"
        >
          Settings
        </button>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDebugMode={isDebugMode}
          onToggleDebugMode={onToggleDebugMode}
          ideType={ideType}
          license={license}
          onSubmitLicense={onSubmitLicense}
          onClearLicense={onClearLicense}
          notificationPrefs={notificationPrefs}
          onNotificationPrefsChange={onNotificationPrefsChange}
          templates={templates}
          onSaveTemplate={onSaveTemplate}
          onDeleteTemplate={onDeleteTemplate}
        />
      </div>
    </div>
  )
}
