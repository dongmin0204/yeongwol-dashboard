// npm run check — dashboard.py(pandas/numpy) 계산과 대조한 회귀 확인.
// 기대값은 data.json + dashboard.py 공식으로 python에서 산출한 것.
import assert from 'node:assert/strict'
import { simulate, zoneAnalysis, GJ_H } from './sim'

const close = (a: number, b: number, eps = 1e-5) =>
  assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`)

const r = simulate('무릉도원면', 62, 30, 30)
close(r.beforeH, 1.64545)
close(r.afterH, 2.261382)
assert.equal(r.beforeN, 16)
assert.equal(r.afterN, 18)
assert.equal(r.beforeCount, 167)
assert.equal(r.afterCount, 286)
close(r.sales억, 112.9392, 1e-4)
assert.equal(r.popOff, 786)
close(GJ_H, 3.0464)

const rows = zoneAnalysis(62, 30, 30)
assert.equal(rows.length, 9) // 업소 5개 미만 권역 없음
assert.equal(rows[0].zone, '무릉도원면') // H' 오름차순
assert.equal(rows[rows.length - 1].zone, '영월읍')
const mrd = rows[0]
assert.deepEqual(mrd.needs, ['음식', '레저']) // 음식33 < 숙박130, 숙박130>=10, 레저4<5
assert.equal(mrd.priority, 'high')
assert.equal(rows.find((x) => x.zone === '영월읍')!.priority, 'low')

console.log('sim.ts OK')
