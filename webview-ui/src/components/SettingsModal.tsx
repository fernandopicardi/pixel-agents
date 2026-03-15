import { useState } from 'react'
import { vscode } from '../vscodeApi.js'
import { isSoundEnabled, setSoundEnabled } from '../notificationSound.js'
import type { IdeType, LicenseState } from '../hooks/useExtensionMessages.js'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isDebugMode: boolean
  onToggleDebugMode: () => void
  ideType: IdeType
  license: LicenseState
  onSubmitLicense: (key: string) => void
  onClearLicense: () => void
}

const menuItemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '6px 10px',
  fontSize: '24px',
  color: 'rgba(255, 255, 255, 0.8)',
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  textAlign: 'left',
}

const ideDisplayNames: Record<IdeType, string> = {
  vscode: 'VS Code',
  cursor: 'Cursor',
  unknown: 'Unknown IDE',
}

function maskKey(key: string): string {
  // PA-XXXX-****-****-XXXX
  const parts = key.split('-')
  if (parts.length !== 5) return key
  return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`
}

export function SettingsModal({ isOpen, onClose, isDebugMode, onToggleDebugMode, ideType, license, onSubmitLicense, onClearLicense }: SettingsModalProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [soundLocal, setSoundLocal] = useState(isSoundEnabled)
  const [licenseInput, setLicenseInput] = useState('')

  if (!isOpen) return null

  const handleActivate = () => {
    if (licenseInput.trim()) {
      onSubmitLicense(licenseInput.trim())
      setLicenseInput('')
    }
  }

  return (
    <>
      {/* Dark backdrop — click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 49,
        }}
      />
      {/* Centered modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          background: 'var(--pixel-bg)',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
          padding: '4px',
          boxShadow: 'var(--pixel-shadow)',
          minWidth: 260,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header with title and X button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 10px',
            borderBottom: '1px solid var(--pixel-border)',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>Settings</span>
          <button
            onClick={onClose}
            onMouseEnter={() => setHovered('close')}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === 'close' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              borderRadius: 0,
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            X
          </button>
        </div>
        {/* Menu items */}
        <button
          onClick={() => {
            vscode.postMessage({ type: 'openSessionsFolder' })
            onClose()
          }}
          onMouseEnter={() => setHovered('sessions')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'sessions' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          Open Sessions Folder
        </button>
        <button
          onClick={() => {
            vscode.postMessage({ type: 'exportLayout' })
            onClose()
          }}
          onMouseEnter={() => setHovered('export')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'export' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          Export Layout
        </button>
        <button
          onClick={() => {
            vscode.postMessage({ type: 'importLayout' })
            onClose()
          }}
          onMouseEnter={() => setHovered('import')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'import' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          Import Layout
        </button>
        <button
          onClick={() => {
            const newVal = !isSoundEnabled()
            setSoundEnabled(newVal)
            setSoundLocal(newVal)
            vscode.postMessage({ type: 'setSoundEnabled', enabled: newVal })
          }}
          onMouseEnter={() => setHovered('sound')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'sound' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          <span>Sound Notifications</span>
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 0,
              background: soundLocal ? 'rgba(90, 140, 255, 0.8)' : 'transparent',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              lineHeight: 1,
              color: '#fff',
            }}
          >
            {soundLocal ? 'X' : ''}
          </span>
        </button>
        <button
          onClick={onToggleDebugMode}
          onMouseEnter={() => setHovered('debug')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'debug' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          <span>Debug View</span>
          {isDebugMode && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(90, 140, 255, 0.8)',
                flexShrink: 0,
              }}
            />
          )}
        </button>

        {/* License section */}
        <div
          style={{
            borderTop: '1px solid var(--pixel-border)',
            marginTop: '4px',
            padding: '8px 10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: '22px', color: 'rgba(255, 255, 255, 0.9)' }}>License</span>
            <span
              style={{
                fontSize: '16px',
                padding: '1px 6px',
                background: license.isPremium ? 'rgba(90, 200, 90, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                color: license.isPremium ? '#5ac85a' : 'rgba(255, 255, 255, 0.5)',
                border: `1px solid ${license.isPremium ? 'rgba(90, 200, 90, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: 0,
              }}
            >
              {license.isPremium ? 'Premium' : 'Free'}
            </span>
          </div>

          {license.isPremium && license.licenseKey ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', flex: 1 }}>
                {maskKey(license.licenseKey)}
              </span>
              <button
                onClick={onClearLicense}
                onMouseEnter={() => setHovered('removeLicense')}
                onMouseLeave={() => setHovered(null)}
                style={{
                  fontSize: '18px',
                  padding: '2px 8px',
                  background: hovered === 'removeLicense' ? 'rgba(255, 80, 80, 0.2)' : 'transparent',
                  color: 'rgba(255, 80, 80, 0.7)',
                  border: '1px solid rgba(255, 80, 80, 0.3)',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { handleActivate(); } }}
                  placeholder="PA-XXXX-XXXX-XXXX-XXXX"
                  style={{
                    flex: 1,
                    fontSize: '18px',
                    padding: '4px 6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 0,
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <button
                  onClick={handleActivate}
                  onMouseEnter={() => setHovered('activate')}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    fontSize: '18px',
                    padding: '4px 10px',
                    background: hovered === 'activate' ? 'rgba(90, 140, 255, 0.3)' : 'rgba(90, 140, 255, 0.15)',
                    color: 'rgba(90, 140, 255, 0.9)',
                    border: '1px solid rgba(90, 140, 255, 0.4)',
                    borderRadius: 0,
                    cursor: 'pointer',
                  }}
                >
                  Activate
                </button>
              </div>
              {license.validationError && (
                <span style={{ fontSize: '16px', color: 'rgba(255, 80, 80, 0.8)', display: 'block', marginTop: 4 }}>
                  {license.validationError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* IDE info line */}
        <div
          style={{
            padding: '6px 10px',
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.35)',
            borderTop: '1px solid var(--pixel-border)',
          }}
        >
          Running in {ideDisplayNames[ideType]}
        </div>
      </div>
    </>
  )
}
