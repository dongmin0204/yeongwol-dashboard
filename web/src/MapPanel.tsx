import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { CAT_COLORS, CAT_NAMES, POINTS, ZONE_META, type ZoneRow } from './lib/sim'

const PRIORITY_LABEL: Record<string, string> = { high: '긴급', mid: '보통', low: '양호' }
const PRIORITY_COLOR: Record<string, string> = { high: '#f44336', mid: '#fb8c00', low: '#00a661' }

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

export default function MapPanel({ rows, selectedZone }: { rows: ZoneRow[]; selectedZone: string }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const recRef = useRef<L.LayerGroup | null>(null)

  // 지도 + 1399개 업소 마커는 한 번만 만든다 (슬라이더가 바뀌어도 재생성 없음)
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const mobile = window.matchMedia('(max-width: 1023px)').matches
    const map = L.map(elRef.current, { center: [37.21, 128.46], zoom: mobile ? 10 : 11, scrollWheelZoom: false })
    // CARTO 무료 타일은 API 키 요구로 워터마크가 떠서 OSM 표준 타일 사용
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // ponytail: 1399개를 그대로 그리면 탭이 죽는다 — 클러스터로 묶고 z14부터 풀어준다.
    const clusters = CAT_NAMES.map((_, i) => {
      const cluster = L.markerClusterGroup({ disableClusteringAtZoom: 14, chunkedLoading: true })
      const color = CAT_COLORS[i]
      for (const [lat, lon, cat, name, sub] of POINTS) {
        if (cat !== i) continue
        L.circleMarker([lat, lon], {
          radius: 3, color, fillColor: color, fillOpacity: 0.5, weight: 0.5, opacity: 0.6,
        })
          .bindPopup(`<b>${esc(name)}</b><br>${esc(sub)}`)
          .addTo(cluster)
      }
      cluster.addTo(map)
      return cluster
    })

    const rec = L.layerGroup().addTo(map)
    recRef.current = rec
    mapRef.current = map

    const overlays: Record<string, L.Layer> = { '업종 추천 지역': rec }
    CAT_NAMES.forEach((n, i) => { overlays[n] = clusters[i] })
    L.control.layers(undefined, overlays, { collapsed: true }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      recRef.current = null
    }
  }, [])

  // 추천 레이어만 갱신
  useEffect(() => {
    const rec = recRef.current
    if (!rec) return
    rec.clearLayers()

    for (const zd of rows) {
      const meta = ZONE_META[zd.zone]
      if (!meta || zd.needs.length === 0) continue

      const isSel = zd.zone === selectedZone
      const color = meta.color
      const needsStr = zd.needs.join(', ')
      const pLabel = PRIORITY_LABEL[zd.priority] ?? ''
      const pColor = PRIORITY_COLOR[zd.priority] ?? '#8b95a1'

      const popup = `
        <div class="map-popup">
          <div class="mp-title">${esc(zd.zone)}</div>
          <div class="mp-issue">${esc(meta.issue)}</div>
          <div class="mp-chips">
            <span class="badge badge-blue">음식 ${zd.food}</span>
            <span class="badge badge-orange">숙박 ${zd.stay}</span>
            <span class="badge badge-purple">레저 ${zd.leisure}</span>
          </div>
          <div class="mp-row"><b>H'</b> ${zd.beforeH.toFixed(2)} &rarr; ${zd.afterH.toFixed(2)}
            <span style="color:#00a661;font-weight:600"> (+${zd.deltaH.toFixed(2)})</span></div>
          <div class="mp-row"><b>추천:</b> <span style="color:${pColor};font-weight:600">${esc(needsStr)} 이식 (${pLabel})</span></div>
        </div>`

      const icon = L.divIcon({
        className: '',
        iconSize: [120, 40],
        iconAnchor: [60, 20],
        html: `<div class="zone-pin" style="background:${color};border-color:${isSel ? '#191f28' : '#fff'};transform:scale(${isSel ? 1.15 : 1})">${esc(zd.zone)}<br><span>${esc(needsStr)} 필요</span></div>`,
      })

      L.marker([meta.lat, meta.lon], { icon }).bindPopup(popup, { maxWidth: 280 }).addTo(rec)
      L.circle([meta.lat, meta.lon], {
        radius: zd.priority === 'high' ? 2500 : 1800,
        color, fillColor: color,
        fillOpacity: isSel ? 0.15 : 0.08,
        weight: isSel ? 2 : 1,
        opacity: 0.4,
        dashArray: isSel ? undefined : '6',
      }).addTo(rec)
    }
  }, [rows, selectedZone])

  return <div className="map" ref={elRef} />
}
