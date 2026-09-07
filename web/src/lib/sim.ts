// dashboard.py 포팅 — 순수 계산 로직
import data from '../data/data.json'

export type Counts = Record<string, number>
export type Zone = { subcat: Counts; cat: Counts }
export type Point = [number, number, number, string, string]

export const ZONES = data.zones as Record<string, Zone>
export const POINTS = data.points as Point[]
export const GJ_H = data.gjH as number

export const CAFE_Y = 633 * 12
export const FOOD_Y = 1134 * 12
export const STAY_Y = 695 * 12
export const LOCAL_RATE = 0.6
export const TAX_RATE = 0.0289
export const OWN_BM = 462
export const TOTAL_BM = 3342
export const POP_EQ = 862

export const CAFE_MIX: Counts = { '카페': 0.55, '빵/도넛': 0.15, '요리 주점': 0.15, '기타 한식 음식점': 0.15 }
export const FOOD_MIX: Counts = {
  '백반/한정식': 0.4, '돼지고기 구이/찜': 0.15, '치킨': 0.1,
  '김밥/만두/분식': 0.1, '횟집': 0.1, '중국집': 0.1, '해산물 구이/찜': 0.05,
}
export const STAY_MIX: Counts = {
  '펜션': 0.3, '여관/모텔': 0.25, '호텔/리조트': 0.2,
  '캠핑/글램핑': 0.15, '그 외 기타 숙박업': 0.1,
}

// 인구비례 방식 100% = (62, 9, 30) → 연간 자연감소 587명분 소비를 정확히 상쇄.
// 25%/50%는 업종별 수량을 비율 반올림한 값.
export const PRESETS: Record<string, [number, number, number]> = {
  '보수 25%': [16, 2, 8],
  '중간 50%': [31, 5, 15],
  '적극 100%': [62, 9, 30],
}

export type ZoneMeta = { label: string; lat: number; lon: number; color: string; issue: string }
export const ZONE_META: Record<string, ZoneMeta> = {
  '무릉도원면': { label: '펜션촌', lat: 37.28, lon: 128.53, color: '#f44336', issue: '숙박 편중, 음식/레저 극소' },
  '영월읍': { label: '시내 중심', lat: 37.18, lon: 128.46, color: '#3182f6', issue: '상권 밀집, 다양성 양호' },
  '주천면': { label: '동강권', lat: 37.24, lon: 128.34, color: '#00a661', issue: '음식 중심, 숙박/레저 부족' },
  '김삿갓면': { label: '숙박 특화', lat: 37.13, lon: 128.7, color: '#fb8c00', issue: '숙박 과다, 음식 극소' },
  '한반도면': { label: '한반도지형', lat: 37.23, lon: 128.38, color: '#ab47bc', issue: '소규모 혼합' },
  '북면': { label: '북부', lat: 37.33, lon: 128.52, color: '#6b7684', issue: '소규모' },
  '산솔면': { label: '산간', lat: 37.16, lon: 128.57, color: '#6b7684', issue: '소규모' },
  '남면': { label: '남부', lat: 37.12, lon: 128.47, color: '#6b7684', issue: '소규모' },
  '상동읍': { label: '상동', lat: 37.12, lon: 128.83, color: '#6b7684', issue: '소규모' },
}

export const CAT_NAMES = ['음식', '숙박', '예술·스포츠'] as const
export const CAT_COLORS = ['#3182f6', '#fb8c00', '#ab47bc']

export function shannonH(counts: Counts): number {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total <= 0) return 0
  let h = 0
  for (const c of Object.values(counts)) {
    if (c <= 0) continue
    const p = c / total
    h -= p * Math.log(p)
  }
  return h
}

export function evenness(h: number, n: number): number {
  return n > 1 ? h / Math.log(n) : 0
}

/** 이식 업종 추가분. python: max(1, int(n * ratio)) — n=0이어도 소분류당 1개가 붙는다. */
export function addedCounts(cafeN: number, foodN: number, stayN: number): Counts {
  const added: Counts = {}
  const apply = (mix: Counts, n: number) => {
    for (const [name, ratio] of Object.entries(mix)) {
      added[name] = (added[name] ?? 0) + Math.max(1, Math.floor(n * ratio))
    }
  }
  apply(CAFE_MIX, cafeN)
  apply(FOOD_MIX, foodN)
  apply(STAY_MIX, stayN)
  return added
}

export function mergeCounts(base: Counts, added: Counts): Counts {
  const out: Counts = { ...base }
  for (const [k, v] of Object.entries(added)) out[k] = (out[k] ?? 0) + v
  return out
}

const sum = (c: Counts) => Object.values(c).reduce((a, b) => a + b, 0)

export type SimResult = {
  beforeH: number; afterH: number
  beforeE: number; afterE: number
  beforeN: number; afterN: number
  beforeCount: number; afterCount: number
  sales억: number; addTax억: number; popOff: number
  newFi: number
}

export function simulate(zone: string, cafeN: number, foodN: number, stayN: number): SimResult {
  const base = ZONES[zone]?.subcat ?? {}
  const added = addedCounts(cafeN, foodN, stayN)
  const after = mergeCounts(base, added)

  const beforeH = shannonH(base)
  const beforeN = Object.keys(base).length
  const afterH = shannonH(after)
  const afterN = Object.keys(after).length

  const sales = cafeN * CAFE_Y + foodN * FOOD_Y + stayN * STAY_Y
  const addTax = (sales / 100) * LOCAL_RATE * TAX_RATE

  return {
    beforeH, afterH,
    beforeE: evenness(beforeH, beforeN), afterE: evenness(afterH, afterN),
    beforeN, afterN,
    beforeCount: sum(base), afterCount: sum(base) + sum(added),
    sales억: sales / 10000,
    addTax억: addTax / 10000,
    // 보고서 §9와 동일하게 반올림 (보수 150명·중간 299명)
    popOff: Math.round((sales * LOCAL_RATE) / POP_EQ),
    newFi: ((OWN_BM + addTax / 100) / TOTAL_BM) * 100,
  }
}

export type ZoneRow = {
  zone: string
  total: number; food: number; stay: number; leisure: number
  beforeH: number; afterH: number; deltaH: number
  needs: string[]
  priority: 'high' | 'mid' | 'low'
}

export function zoneAnalysis(cafeN: number, foodN: number, stayN: number): ZoneRow[] {
  const added = addedCounts(cafeN, foodN, stayN)
  const rows: ZoneRow[] = []
  for (const z of Object.keys(ZONES).sort()) {
    const { subcat, cat } = ZONES[z]
    const total = sum(subcat)
    if (total < 5) continue

    const food = cat['음식'] ?? 0
    const stay = cat['숙박'] ?? 0
    const leisure = cat['예술·스포츠'] ?? 0
    const beforeH = shannonH(subcat)
    const afterH = shannonH(mergeCounts(subcat, added))

    const needs: string[] = []
    if (food < stay) needs.push('음식')
    if (stay < 10) needs.push('숙박')
    if (leisure < 5) needs.push('레저')

    rows.push({
      zone: z, total, food, stay, leisure,
      beforeH, afterH, deltaH: afterH - beforeH,
      needs,
      priority: beforeH < 2.0 ? 'high' : beforeH < 2.5 ? 'mid' : 'low',
    })
  }
  return rows.sort((a, b) => a.beforeH - b.beforeH)
}

/** 소분류 TOP 12 (현재/이식 후 합집합). 동점은 이름순으로 고정해 렌더를 결정적으로. */
export function topSubcats(zone: string, cafeN: number, foodN: number, stayN: number) {
  const base = ZONES[zone]?.subcat ?? {}
  const after = mergeCounts(base, addedCounts(cafeN, foodN, stayN))
  const rank = (c: Counts) =>
    Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12).map(([k]) => k)
  const names: string[] = []
  for (const n of [...rank(base), ...rank(after)]) {
    if (!names.includes(n)) names.push(n)
  }
  return names.slice(0, 12).map((name) => ({ name, before: base[name] ?? 0, after: after[name] ?? 0 }))
}
