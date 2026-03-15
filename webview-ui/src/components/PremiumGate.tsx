interface PremiumGateProps {
  featureLabel: string
  isPremium: boolean
  children: React.ReactNode
  /** 'overlay' = teaser with blur, 'replace' = full upgrade prompt, 'hide' = simply hidden */
  mode?: 'overlay' | 'replace' | 'hide'
}

export function PremiumGate({ featureLabel, isPremium, children, mode = 'hide' }: PremiumGateProps) {
  if (isPremium) {
    return <>{children}</>
  }

  if (mode === 'hide') {
    return null
  }

  if (mode === 'replace') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          gap: 8,
          background: 'var(--pixel-bg)',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
        }}
      >
        <span style={{ fontSize: '24px', color: 'var(--pixel-text)' }}>{featureLabel}</span>
        <span style={{ fontSize: '20px', color: 'var(--pixel-text-dim)' }}>Premium Feature</span>
        <span style={{ fontSize: '18px', color: 'var(--pixel-accent)' }}>
          Enter a license key in Settings to unlock
        </span>
      </div>
    )
  }

  // overlay mode
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(2px)', opacity: 0.4, pointerEvents: 'none' }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        <span style={{ fontSize: '18px', color: 'var(--pixel-accent)' }}>Premium</span>
      </div>
    </div>
  )
}
