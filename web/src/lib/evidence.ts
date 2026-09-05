// TURN:STAY 보고서 고정 수치·카피 — 근거(§5)·제언(§6) 섹션 전용.
// 시뮬레이터 계산값(sim.ts)과 달리 전부 정적 상수. 출처: 결과물 PDF.

export type EvBar = { name: string; value: number; display: string; tone?: 'red' | 'grey' }

export const HERO = {
  eyebrow: '01 진단 · TURN:STAY — 인구소멸지역의 체류형 전환 모델',
  headline: '손님은 늘었는데, 머물지 않는다',
  desc: '영화 흥행으로 방문객은 늘었지만 숙박 비율은 오히려 하락 — 체류를 유도할 업종 생태계의 공백이 원인입니다.',
  stats: [
    { label: '방문객 증가', value: '+24.7%', sub: '전년 동기 대비 (2026 1~5월)', tone: 'blue' },
    { label: '숙박 비율', value: '16.2% → 15.0%', sub: '흥행에도 −1.2%p 하락', tone: 'red' },
  ],
}

export const EVIDENCE_TITLE = { eyebrow: '02 근거', title: '왜 업종 이식인가', sub: '핵심 근거 4가지 — 상세 분석은 보고서 참조' }

export const EVIDENCE: { value: string; label: string; desc: string; bars: EvBar[] }[] = [
  {
    value: '2.8배',
    label: '숙박객 1인당 지출',
    desc: '하루를 더 머물게 하는 것이 곧 소비다 (t=44.7, p<0.001).',
    bars: [
      { name: '숙박 여행', value: 212073, display: '21.2만원' },
      { name: '당일 여행', value: 75456, display: '7.5만원', tone: 'grey' },
    ],
  },
  {
    value: '2.3배',
    label: '숙박 전환을 이끄는 활동',
    desc: '야간·체류형 활동이 숙박 확률을 2배 이상 높인다 (오즈비).',
    bars: [
      { name: '자연·풍경 감상', value: 2.32, display: '2.32배' },
      { name: '문화예술·공연', value: 2.27, display: '2.27배' },
      { name: '유흥·오락', value: 2.23, display: '2.23배' },
    ],
  },
  {
    value: '11배',
    label: '경주 대비 부족 1위: 카페',
    desc: '벤치마크 경주와 격차가 가장 큰 업종 — 이식 1순위.',
    bars: [
      { name: '경주', value: 11, display: '11' },
      { name: '영월', value: 1, display: '1', tone: 'grey' },
    ],
  },
  {
    value: "H' 1.65",
    label: '병목 권역: 무릉도원면',
    desc: '숙박 96곳에 음식점 23곳 — 투숙객이 식사할 곳이 없다.',
    bars: [
      { name: '무릉도원면', value: 1.65, display: '1.65', tone: 'red' },
      { name: '경주 벤치마크', value: 3.05, display: '3.05' },
    ],
  },
]

export const SIM_TITLE = {
  eyebrow: '03 시뮬레이션',
  title: '업종 이식 시뮬레이터',
  sub: '그래서 어디에, 무엇을, 몇 개 이식하면 되는가 — 권역·업종·수량을 조정해 효과를 직접 확인해 보세요.',
}

export const CONCLUSION = {
  eyebrow: '04 제언',
  title: '정책 활용 방안',
  insights: [
    { title: "'방문객 유치'에서 '소비 전환'으로", desc: '흥행으로 방문객이 24.7% 늘어도 숙박률은 하락했다. 콘텐츠 흥행만으로 지역 소비 확대는 보장되지 않는다.' },
    { title: '진짜 문제는 업종의 공백', desc: '영월 숙박 비율(16.2%)은 경주(16.7%)와 이미 비슷했다. 업종 다양성과 숙박 전환율은 양의 상관 — 업종 이식이 유효한 수단이다.' },
    { title: '관광권 단위의 정책 설계', desc: "무릉도원면(H' 1.65)·김삿갓면(1.97) 등 핵심 관광 권역의 업종 편중이 체류형 소비의 병목이다." },
  ],
  uses: [
    { title: '숙박률 회복 효과', desc: '숙박률이 영화 전 수준(16.2%)으로 회복되면 연간 약 6억 원의 추가 지역 소비가 예상된다 (경주 수준 회복 시 약 8.6억 원).' },
    { title: 'GAP 지수 기반 예산 배분', desc: '업종 우선순위(카페·기념품·요리주점)와 권역별 개입 순서를 수치로 제시해 관광 진흥 예산 집행 효율을 높인다.' },
    { title: '전국 89개 인구감소지역으로 확장', desc: "Shannon H'·GAP 산출 파이프라인은 소상공인 상권 API와 관광 빅데이터 API만 있으면 어느 지역에나 적용 가능하다." },
  ],
  limits: [
    '관광빅데이터 방문자 수는 이동통신 기반 추정치로 실제와 차이가 있을 수 있음',
    '업종 구성과 숙박률의 관계는 정량 비교이며 직접적 인과관계 검증은 아님',
    '업종별 매출은 소상공인365 업종 평균값 적용 — 개별 업소 편차·신규 업소 생존율 미반영',
    "이식 후 H'는 본 대시보드의 직접 재계산치로, 보고서 본문의 비례 보정 추정치와 수치가 다를 수 있음 (실제 입점 후 재측정 필요)",
  ],
}
