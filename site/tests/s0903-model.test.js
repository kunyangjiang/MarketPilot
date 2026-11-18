/* S09-03 流动性模型测试：期望值是手算的分数（见 lessons/S09-03/S09-03-交互方案-v2.2-候选.md 4.3 节与 Phase 1C 汇总），
 * 不从模型输出回填。另与 lessons/S09-03/preflight/m-model.test.js（独立的 BigInt 实现）互为对照。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../lessons/S09-03/liquidity.js');
const s = M.str;

function identities(r, label) {
  // 期末恒等式：剩余资产（按真实值）= 剩余存款 + 紧急借款 + 净资产
  const v = r.truth;
  assert.equal(s(v.assets), s(M.add(M.add(r.depositsLeft, r.borrow), v.nw)), label + ' 期末恒等式');
  // 净资产分解：资本 − 减值 − 甩卖损失
  assert.equal(s(v.nw), s(v.decomposition), label + ' 净资产分解');
  // 现金守恒
  assert.equal(s(r.paid), s(M.sub(r.W, r.short)), label + ' 现金守恒');
  assert.equal(s(M.sub(M.DEPOSITS, r.depositsLeft)), s(r.paid), label + ' 存款减少 = 付出');
  // 每一步的现金之和 = 付出
  assert.equal(s(r.steps.reduce((a, x) => M.add(a, x.cash), M.F(0))), s(r.paid), label + ' 分步现金合计');
}

test('期初资产负债表：资产 110 = 存款 100 + 资本 10', () => {
  const t = Object.values(M.BOOK).reduce((a, x) => M.add(a, x), M.F(0));
  assert.equal(s(t), '110'); assert.equal(s(M.add(M.DEPOSITS, M.CAPITAL)), '110');
});

test('M1 平常日：付清 8，无损失，净资产 10', () => {
  const r = M.runDay(M.SCENARIOS.M1.day); identities(r, 'M1');
  assert.equal(r.survived, true); assert.equal(s(r.fire), '0'); assert.equal(s(r.truth.nw), '10');
  assert.deepEqual(r.steps.map(x => x.kind), ['C', 'B']);
});

test('M2 挤兑无保护：当日可付 51、差 9、停业；损失 4；净资产 6；标签为"净资产仍为正，但当日可支付现金不足"', () => {
  const r = M.runDay(M.SCENARIOS.M2.day); identities(r, 'M2');
  assert.equal(s(r.maxCash), '51'); assert.equal(s(r.paid), '51'); assert.equal(s(r.short), '9');
  assert.equal(r.survived, false); assert.equal(s(r.loss.L), '1'); assert.equal(s(r.loss.S), '3'); assert.equal(s(r.truth.nw), '6');
  assert.equal(M.label(r).text, '按当前资产价值假设，净资产仍为正，但当日可支付现金不足。');
});

test('M3 挤兑有保护：借 30，叫回面值 125/8（15.625）得 15；损失 5/8；净资产 75/8', () => {
  const r = M.runDay(M.SCENARIOS.M3.day); identities(r, 'M3');
  assert.equal(r.survived, true); assert.equal(s(r.borrow), '30');
  const L = r.steps.find(x => x.kind === 'L'); assert.equal(s(L.face), '125/8'); assert.equal(s(L.cash), '15');
  assert.equal(s(r.fire), '5/8'); assert.equal(s(r.truth.nw), '75/8');
});

test('M4 资产真的坏了：撑过；损失 25/16；净资产 −105/16（−6.5625）；原因分解与交互方案一致', () => {
  const r = M.runDay(M.SCENARIOS.M4.day); identities(r, 'M4');
  assert.equal(r.survived, true); assert.equal(s(r.borrow), '75/4'); assert.equal(s(r.fire), '25/16');
  assert.equal(s(r.truth.nw), '-105/16'); assert.equal(s(r.truth.assets), '835/16'); assert.equal(s(r.depositsLeft), '40');
  const l = M.label(r);
  assert.equal(l.text, '按当前资产价值假设，净资产为负。');
  assert.equal(l.why, '抵押贷款减值 15（40 → 25）＋ 甩卖损失 1.5625（通知贷款 1、证券 0.5625），超过了原有资本 10，差额为 6.5625。');
});

const M5 = (appraisal, trueK) => M.runDay(Object.assign({}, M.SCENARIOS.M5.day, { appraisal, trueK }));
test('M5 分支①：按 25 放款、真实值 40 → 停业（付 279/4、差 21/4）；净资产 +6；覆盖缺口 0', () => {
  const r = M5(25, 40); identities(r, 'M5①');
  assert.equal(r.survived, false); assert.equal(s(r.paid), '279/4'); assert.equal(s(r.short), '21/4');
  assert.equal(s(r.truth.nw), '6'); assert.equal(s(r.truth.gap), '0');
});
test('M5 分支②：按 25 放款、真实值 25 → 停业；净资产 −9；覆盖缺口 0', () => {
  const r = M5(25, 25); identities(r, 'M5②');
  assert.equal(r.survived, false); assert.equal(s(r.truth.nw), '-9'); assert.equal(s(r.truth.gap), '0');
  assert.equal(M.label(r).why, '抵押贷款减值 15（40 → 25）＋ 甩卖损失 4（通知贷款 1、证券 3），超过了原有资本 10，差额为 9。');
});
test('M5 分支③：按 40 放款、真实值 40 → 撑过；卖 S 面值 15/2；损失 5/2；净资产 +15/2', () => {
  const r = M5(40, 40); identities(r, 'M5③');
  assert.equal(r.survived, true); assert.equal(s(r.steps.find(x => x.kind === 'S').face), '15/2');
  assert.equal(s(r.fire), '5/2'); assert.equal(s(r.truth.nw), '15/2'); assert.equal(s(r.truth.gap), '0');
});
test('M5 分支④：按 40 放款、真实值 25 → 撑过；净资产 −15/2；抵押品覆盖缺口 5', () => {
  const r = M5(40, 25); identities(r, 'M5④');
  assert.equal(r.survived, true); assert.equal(s(r.truth.nw), '-15/2'); assert.equal(s(r.truth.gap), '5');
});

test('M6 三条路径：①乙也停业（损失 11/2，净资产 9/2）；②乙撑过（损失 5/8）；③乙无借款渠道，损失 5/24、净资产 235/24', () => {
  const p1 = M.runM6(1);
  assert.equal(p1.a.survived, false); assert.equal(p1.a.soldS, true); assert.equal(s(p1.b.W), '60');
  assert.equal(s(p1.b.paid), '99/2'); assert.equal(p1.b.survived, false); assert.equal(s(p1.b.fire), '11/2'); assert.equal(s(p1.b.truth.nw), '9/2');
  const p2 = M.runM6(2);
  assert.equal(p2.b.survived, true); assert.equal(s(p2.b.fire), '5/8'); assert.equal(s(p2.b.truth.nw), '75/8');
  const p3 = M.runM6(3);
  assert.equal(p3.a.survived, true); assert.equal(p3.a.soldS, true); assert.equal(p3.bProtected, false);
  assert.equal(s(p3.b.W), '20'); assert.equal(s(p3.b.borrow), '0'); assert.equal(s(p3.b.fire), '5/24'); assert.equal(s(p3.b.truth.nw), '235/24');
  for (const [k, r] of [['①甲', p1.a], ['①乙', p1.b], ['②乙', p2.b], ['③甲', p3.a], ['③乙', p3.b]]) identities(r, 'M6' + k);
});

test('显示格式：有限小数原样显示，循环小数显示约数；负号用 −', () => {
  assert.equal(M.fmt(M.F(-105, 16)), '−6.5625');
  assert.equal(M.fmt(M.F(5, 24)), '≈0.208');
  assert.equal(M.fmt(M.F(235, 24)), '≈9.792');
  assert.equal(M.fmt(M.F(279, 4)), '69.75');
});
