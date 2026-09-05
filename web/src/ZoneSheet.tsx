import { useEffect } from 'react'
import { ZONE_META } from './lib/sim'

type Props = {
  zones: string[]
  value: string
  onSelect: (zone: string) => void
  onClose: () => void
}

export default function ZoneSheet({ zones, value, onSelect, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    // ponytail: 오버레이 클릭 닫기는 시트에서 stopPropagation — 포커스 트랩까지는 안 감.
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="집중 분석 권역"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-title">집중 분석 권역</div>
        <div className="sheet-list">
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              className={`sheet-item${z === value ? ' on' : ''}`}
              onClick={() => onSelect(z)}
            >
              <span className="sheet-item-text">
                <b>{z}</b>
                <em>{ZONE_META[z]?.label} &middot; {ZONE_META[z]?.issue}</em>
              </span>
              {z === value && <span className="sheet-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
