import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  CAFE_Y, FOOD_Y, GJ_H, LOCAL_RATE, POP_EQ, PRESETS, STAY_Y, ZONES, ZONE_META,
  simulate, topSubcats, zoneAnalysis,
} from './lib/sim'
import { CONCLUSION, EVIDENCE, EVIDENCE_TITLE, HERO, SIM_TITLE } from './lib/evidence'
import ZoneSheet from './ZoneSheet'
import './App.css'

const MapPanel = lazy(() => import('./MapPanel'))

const CUSTOM = '직접 설정'
const PRESET_NAMES = Object.keys(PRESETS)
const DEFAULT_PRESET = '방식B 적극'
const ZONE_NAMES = Object.keys(ZONES).sort()
const CHART_ZONES = ['무릉도원면', '영월읍', '주천면', '김삿갓면']
const SCENARIO_COLORS = ['#e5e8eb', '#c9e2ff', '#64a8ff', '#3182f6']
const PRIORITY = {
  high: { label: '긴급', badge: 'badge-red' },
  mid: { label: '보통', badge: 'badge-orange' },
  low: { label: '양호', badge: 'badge-green' },
}
const NEED_BADGE: Record<string, string> = { 음식: 'badge-blue', 숙박: 'badge-orange', 레저: 'badge-green' }

/** '방식A (인구비례)' → 'A 인구비례' */
const chipLabel = (name: string) => name.replace('방식', '').replace(/[()]/g, '').trim()

const axis = { tick: { fontSize: 11, fill: '#8b95a1' }, stroke: '#e5e8eb' }
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 },
}

export default function App() {
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [[cafeN, foodN, stayN], setNums] = useState(PRESETS[DEFAULT_PRESET])
  const [zone, setZone] = useState('무릉도원면')
  const [simVisible, setSimVisible] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const simRef = useRef<HTMLDivElement>(null)
  const tuneRef = useRef<HTMLDetailsElement>(null)
  const controlsRef = useRef<HTMLElement>(null)

  // ponytail: CSS로는 details를 열 수 없다 — 데스크톱이면 마운트 때 한 번만 열어두고 이후엔 사용자 몫.
  useEffect(() => {
    if (tuneRef.current) tuneRef.current.open = window.matchMedia('(min-width: 1024px)').matches
  }, [])

  useEffect(() => {
    const el = simRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setSimVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const pickPreset = (name: string) => {
    setPreset(name)
    if (name !== CUSTOM) setNums(PRESETS[name])
  }
  const setNum = (i: number, v: number) => {
    setPreset(CUSTOM)
    setNums((prev) => prev.map((p, j) => (j === i ? v : p)) as [number, number, number])
  }

  const result = useMemo(() => simulate(zone, cafeN, foodN, stayN), [zone, cafeN, foodN, stayN])
  const rows = useMemo(() => zoneAnalysis(cafeN, foodN, stayN), [cafeN, foodN, stayN])
  const hChart = useMemo(
    () =>
      CHART_ZONES.filter((z) => ZONES[z]).map((z) => {
        const r = simulate(z, cafeN, foodN, stayN)
        return { zone: z, before: +r.beforeH.toFixed(2), after: +r.afterH.toFixed(2) }
      }),
    [cafeN, foodN, stayN],
  )
  const scenarios = useMemo(
    () =>
      PRESET_NAMES.map((name) => {
        const [c, f, s] = PRESETS[name]
        return { name: name.replace('방식', '').trim(), sales: +simulate(zone, c, f, s).sales억.toFixed(1) }
      }),
    [zone],
  )
  const detail = useMemo(() => topSubcats(zone, cafeN, foodN, stayN), [zone, cafeN, foodN, stayN])
  const currentRow = rows.find((r) => r.zone === zone)
  const popPct = (result.popOff / 587) * 100
  const deltaH = result.afterH - result.beforeH

  return (
    <div className="layout">
      <div className="main main-top">
        <section className="hero">
          <div className="eyebrow">{HERO.eyebrow}</div>
          <h2>{HERO.headline}</h2>
          <p>{HERO.desc}</p>
          <div className="hero-stats">
            {HERO.stats.map((s) => (
              <div className="hero-stat" key={s.label}>
                <div className="hero-stat-label">{s.label}</div>
                <div
                  className="hero-stat-value"
                  style={{ color: s.tone === 'red' ? 'var(--red)' : 'var(--blue)' }}
                >
                  {s.value}
                </div>
                <div className="hero-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="sec">
          <header className="sec-head">
            <div className="eyebrow">{EVIDENCE_TITLE.eyebrow}</div>
            <h2 className="sec-title">{EVIDENCE_TITLE.title}</h2>
            <p className="sec-sub">{EVIDENCE_TITLE.sub}</p>
          </header>
          <div className="ev-grid">
            {EVIDENCE.map((e) => (
              <div className="card ev-card" key={e.label}>
                <div className="ev-value">{e.value}</div>
                <div className="ev-label">{e.label}</div>
                <p className="ev-desc">{e.desc}</p>
                {e.bars && (
                  <div className="ev-bars">
                    {e.bars.map((b) => (
                      <div className="ev-bar-row" key={b.name}>
                        <span className="ev-bar-name">{b.name}</span>
                        <span className="ev-bar-track">
                          <span className="ev-bar-fill" style={{ width: `${(b.ratio / 2.5) * 100}%` }} />
                        </span>
                        <span className="ev-bar-val">{b.ratio.toFixed(2)}배</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <header className="sec-head sim-head">
          <div className="eyebrow">{SIM_TITLE.eyebrow}</div>
          <h2 className="sec-title">{SIM_TITLE.title}</h2>
          <p className="sec-sub">{SIM_TITLE.sub}</p>
        </header>
      </div>

      <aside className="controls" ref={controlsRef}>
        <h1 className="controls-title">시뮬레이션 설정</h1>
        <div className="controls-body">
          <div className="chips">
            {PRESET_NAMES.map((n) => (
              <button
                key={n}
                type="button"
                className={`chip${preset === n ? ' on' : ''}`}
                onClick={() => pickPreset(n)}
              >
                {chipLabel(n)}
              </button>
            ))}
          </div>

          <details className="tune" ref={tuneRef}>
            <summary>세부 조정</summary>

            <div className="hr" />
            <div className="group-label">이식 업종 수량</div>
            {[
              { label: '카페/베이커리', max: 100, value: cafeN },
              { label: '음식점', max: 60, value: foodN },
              { label: '숙박업', max: 60, value: stayN },
            ].map((s, i) => (
              <div className="field" key={s.label}>
                <div className="step-row">
                  <span>{s.label}</span>
                  <div className="stepper">
                    <button
                      type="button" aria-label={`${s.label} 1 감소`}
                      disabled={s.value <= 0}
                      onClick={() => setNum(i, s.value - 1)}
                    >
                      −
                    </button>
                    <b>{s.value}</b>
                    <button
                      type="button" aria-label={`${s.label} 1 증가`}
                      disabled={s.value >= s.max}
                      onClick={() => setNum(i, s.value + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="range" min={0} max={s.max} value={s.value} aria-label={s.label}
                  onChange={(e) => setNum(i, Number(e.target.value))}
                />
              </div>
            ))}

            <div className="hr" />
            <div className="field">
              <span>집중 분석 권역</span>
              <button type="button" className="zone-trigger" onClick={() => setSheetOpen(true)}>
                {zone} <span aria-hidden="true">▾</span>
              </button>
            </div>

            <div className="hr" />
            <div className="notes">
              카페 월매출 {(CAFE_Y / 12).toLocaleString()}만원<br />
              음식점 월매출 {(FOOD_Y / 12).toLocaleString()}만원<br />
              숙박 월매출 {(STAY_Y / 12).toLocaleString()}만원<br />
              지역귀속률 {Math.round(LOCAL_RATE * 100)}%<br />
              인구감소 1명 상쇄 소비 {POP_EQ.toLocaleString()}만원/년
            </div>
          </details>
        </div>
      </aside>

      <div className="main main-bottom">
        <div ref={simRef}>
          <section className="kpi-row">
            <div className="kpi kpi-wide">
              <div className="kpi-label">인구 감소 대체 효과</div>
              <div className="kpi-value blue">
                {result.popOff.toLocaleString()}
                <span className="kpi-unit">명분 소비 상쇄</span>
              </div>
              <div className="kpi-sub">
                연간 자연감소 587명 대비 <b style={{ color: '#3182f6' }}>{popPct.toFixed(0)}%</b> 보전
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">추가 관광소비</div>
              <div className="kpi-value green">
                {result.sales억.toFixed(1)}
                <span className="kpi-unit">억/년</span>
              </div>
              <div className="kpi-sub">카페 {cafeN} + 음식 {foodN} + 숙박 {stayN}개</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">{zone} Shannon H'</div>
              <div className="kpi-value orange">
                {result.afterH.toFixed(2)}
                <span className="kpi-delta">+{deltaH.toFixed(2)}</span>
              </div>
              <div className="kpi-sub">
                현재 {result.beforeH.toFixed(2)} &middot; 경주 벤치마크 {GJ_H.toFixed(2)}
              </div>
            </div>
          </section>

          <section className="grid-2">
            <div className="card">
              <div className="card-title">권역별 Shannon H' 변화</div>
              <div className="card-sub">현재 대비 이식 후 업종 다양성</div>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hChart} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="#f2f4f6" vertical={false} />
                    <XAxis dataKey="zone" {...axis} />
                    <YAxis {...axis} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="before" name="현재" fill="#e5e8eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" name="이식 후" fill="#3182f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-title">시나리오별 추가 관광소비</div>
              <div className="card-sub">억원/년</div>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scenarios} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="#f2f4f6" vertical={false} />
                    <XAxis dataKey="name" {...axis} />
                    <YAxis {...axis} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="sales" name="추가 관광소비(억/년)" radius={[4, 4, 0, 0]}>
                      {scenarios.map((s, i) => (
                        <Cell key={s.name} fill={SCENARIO_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-title">업종 추천 지역 지도</div>
            <div className="card-sub">
              H'가 낮고 특정 업종이 부족한 권역을 자동 탐지합니다. 마커를 클릭하면 상세 정보를 확인할 수 있습니다.
            </div>
            <Suspense fallback={<div className="map map-skeleton" />}>
              <MapPanel rows={rows} selectedZone={zone} />
            </Suspense>
            <div className="map-legend">
              <span><i className="leg-dot" style={{ background: '#3182f6' }} /> 음식점</span>
              <span><i className="leg-dot" style={{ background: '#fb8c00' }} /> 숙박</span>
              <span><i className="leg-dot" style={{ background: '#ab47bc' }} /> 레저/스포츠</span>
              <span><i className="leg-dot leg-ring" /> 이식 추천 영역</span>
            </div>
          </section>

          <section className="card">
            <div className="card-title">권역별 업종 다양성 분석</div>
            <div className="card-sub">
              Shannon H' 기준 오름차순. 값이 낮을수록 업종 편중이 심하며 이식 우선 대상입니다.
            </div>
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>권역</th>
                    <th className="num">총 업소</th>
                    <th className="num">음식</th>
                    <th className="num">숙박</th>
                    <th className="num">레저</th>
                    <th className="num">현재 H'</th>
                    <th className="num">이식후</th>
                    <th className="num">변화</th>
                    <th>부족 업종</th>
                    <th>우선순위</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.zone} className={r.zone === zone ? 'hl' : undefined}>
                      <td>
                        <i className="dot" style={{ background: ZONE_META[r.zone]?.color ?? '#6b7684' }} />
                        <b>{r.zone}</b>
                      </td>
                      <td className="num">{r.total}</td>
                      <td className="num">{r.food}</td>
                      <td className="num">{r.stay}</td>
                      <td className="num">{r.leisure}</td>
                      <td className="num">{r.beforeH.toFixed(2)}</td>
                      <td className="num">{r.afterH.toFixed(2)}</td>
                      <td className="num pos">+{r.deltaH.toFixed(2)}</td>
                      <td>
                        {r.needs.length ? (
                          r.needs.map((n) => (
                            <span key={n} className={`badge ${NEED_BADGE[n]}`}>{n}</span>
                          ))
                        ) : (
                          <span className="muted">&mdash;</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${PRIORITY[r.priority].badge}`}>{PRIORITY[r.priority].label}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid-detail">
            <div className="card">
              <div className="card-title">{zone} 업종 소분류 TOP 12</div>
              <div className="card-sub">{ZONE_META[zone]?.issue ?? ''}</div>
              <div className="chart chart-tall">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detail} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="#f2f4f6" horizontal={false} />
                    <XAxis type="number" {...axis} />
                    <YAxis type="category" dataKey="name" width={100} {...axis} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="before" name="현재" fill="#e5e8eb" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="after" name="이식 후" fill="#3182f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-title">{zone} &mdash; 상세 분석</div>
              <div className="card-sub">지표 비교</div>
              <div className="table-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>지표</th>
                      <th className="num">현재</th>
                      <th className="num">이식 후</th>
                      <th className="num">변화</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>Shannon H'</b></td>
                      <td className="num">{result.beforeH.toFixed(2)}</td>
                      <td className="num">{result.afterH.toFixed(2)}</td>
                      <td className="num pos">+{deltaH.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>균등도 J'</td>
                      <td className="num">{result.beforeE.toFixed(2)}</td>
                      <td className="num">{result.afterE.toFixed(2)}</td>
                      <td className="num pos">+{(result.afterE - result.beforeE).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>업종 수</td>
                      <td className="num">{result.beforeN}</td>
                      <td className="num">{result.afterN}</td>
                      <td className="num pos">+{result.afterN - result.beforeN}</td>
                    </tr>
                    <tr>
                      <td>업소 수</td>
                      <td className="num">{result.beforeCount}</td>
                      <td className="num">{result.afterCount}</td>
                      <td className="num pos">+{result.afterCount - result.beforeCount}</td>
                    </tr>
                    <tr>
                      <td>경주 벤치마크</td>
                      <td className="num">{GJ_H.toFixed(2)}</td>
                      <td className="num">-</td>
                      <td className="num">격차 {(result.afterH - GJ_H >= 0 ? '+' : '') + (result.afterH - GJ_H).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {currentRow && currentRow.needs.length > 0 && (
                <div className="recommend">
                  <div className="recommend-title">이식 추천</div>
                  <p>
                    {zone}은 <b>{currentRow.needs.join(', ')}</b> 업종이 부족합니다. 이식 시 H'가{' '}
                    {currentRow.beforeH.toFixed(2)}에서 {currentRow.afterH.toFixed(2)}로 개선되며, 경주 대비 격차가{' '}
                    {(currentRow.afterH - GJ_H >= 0 ? '+' : '') + (currentRow.afterH - GJ_H).toFixed(2)}로 축소됩니다.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="sec">
          <header className="sec-head">
            <div className="eyebrow">{CONCLUSION.eyebrow}</div>
            <h2 className="sec-title">{CONCLUSION.title}</h2>
          </header>

          <ol className="insights">
            {CONCLUSION.insights.map((it, i) => (
              <li className="card insight" key={it.title}>
                <span className="insight-no">{i + 1}</span>
                <div>
                  <div className="insight-title">{it.title}</div>
                  <p className="insight-desc">{it.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="use-grid">
            {CONCLUSION.uses.map((u) => (
              <div className="card use-card" key={u.title}>
                <div className="card-title">{u.title}</div>
                <p className="use-desc">{u.desc}</p>
              </div>
            ))}
          </div>

          <details className="limits">
            <summary>분석의 한계</summary>
            <ul>
              {CONCLUSION.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </details>
        </section>

        <p className="footer">
          데이터: 소상공인 상권정보 API / 소상공인365 매출 / 지방재정365 | 분석 기준: 2024~2026
        </p>
      </div>

      {simVisible && (
        <button
          type="button"
          className="minibar"
          onClick={() => controlsRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <b>{result.popOff.toLocaleString()}</b>명분
          <span className="minibar-dot">&middot;</span>
          <b>{result.sales억.toFixed(1)}</b>억/년
          <span className="minibar-cta">설정 조정 ↑</span>
        </button>
      )}

      {sheetOpen && (
        <ZoneSheet
          zones={ZONE_NAMES}
          value={zone}
          onSelect={(z) => {
            setZone(z)
            setSheetOpen(false)
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  )
}
