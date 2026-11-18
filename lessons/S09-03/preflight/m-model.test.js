// S09-03 预检：M1–M6 示意模型的会计核对（独立实现 + 手算期望值）
// 运行：node --test lessons/S09-03/preflight/
// 说明：这不是网站代码。模型按《交互方案》v2.1 第 3.1、4.2、4.3 节的规则独立实现；
// 期望值是在预检报告中逐步手算的分数，不是从本实现输出回填的。
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// ---- 精确分数（BigInt）----
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
class Q {
  constructor(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  static of(x) { if (x instanceof Q) return x; const s = String(x); if (s.includes('/')) { const [a, b] = s.split('/'); return new Q(a, b); }
    if (s.includes('.')) { const [i, f] = s.split('.'); const d = 10n ** BigInt(f.length); return new Q(BigInt(i.replace('-', '')) * d + BigInt(f), d * (s.startsWith('-') ? -1n : 1n)); }
    return new Q(s); }
  add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = Q.of(o); return new Q(this.n * o.d, this.d * o.n); }
  cmp(o) { o = Q.of(o); const x = this.n * o.d - o.n * this.d; return x > 0n ? 1 : x < 0n ? -1 : 0; }
  min(o) { return this.cmp(o) <= 0 ? this : Q.of(o); }
  max(o) { return this.cmp(o) >= 0 ? this : Q.of(o); }
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
}
const q = Q.of;
const eq = (actual, expected, msg) => assert.equal(actual.toString(), q(expected).toString(), msg);

// ---- 模型（按交互方案 3.1：付款顺序 C → B → 紧急借款 → 叫回 L → 卖出 S）----
function runDay({ W, panic = true, priorFireSale = false, channel = false, appraisal = 40, trueK = 40, assets }) {
  const a = assets ? { ...assets } : { C: q(5), B: q(10), L: q(25), S: q(15), K: q(40), O: q(15) };
  const D0 = q(100), E0 = q(10);
  const rateL = panic ? q('0.96') : q(1);
  const rateS = !panic ? q('0.95') : priorFireSale ? q('0.7') : q('0.8');
  let need = q(W), paid = q(0), borrow = q(0), loss = { L: q(0), S: q(0) }, soldS = false;
  const take = k => { const x = a[k].min(need); a[k] = a[k].sub(x); need = need.sub(x); paid = paid.add(x); };
  take('C'); take('B');
  if (channel && need.cmp(0) > 0) { const cap = q(appraisal).mul('0.75'); const x = cap.min(need); borrow = x; need = need.sub(x); paid = paid.add(x); }
  // 若借款额度大于当日所需，模型只借所需（交互方案未规定多借；见报告 A-3）
  for (const [k, r] of [['L', rateL], ['S', rateS]]) {
    if (need.cmp(0) <= 0) break;
    const proceeds = a[k].mul(r).min(need); const face = proceeds.div(r);
    a[k] = a[k].sub(face); loss[k] = face.sub(proceeds); need = need.sub(proceeds); paid = paid.add(proceeds); if (k === 'S' && face.cmp(0) > 0) soldS = true;
  }
  const survived = need.cmp(0) === 0;
  const Dleft = D0.sub(paid);   // 存款减少额 = 当日付给存款人的现金（含借来的现金）
  const impair = q(40).sub(trueK);
  const assetsLeft = a.C.add(a.B).add(a.L).add(a.S).add(trueK).add(a.O);
  const nw = assetsLeft.sub(Dleft).sub(borrow);
  const fire = loss.L.add(loss.S);
  return { left: a, paid, short: need, survived, borrow, loss, fire, impair, assetsLeft, Dleft, nw, soldS,
    gap: borrow.sub(trueK).max(0), decomposition: E0.sub(impair).sub(fire), E0 };
}
// 每次运行都检查的会计恒等式（交互方案 4.7 第 3b 条 + 核验记录 5.1）
function checkIdentities(r, W, label) {
  // 期初：5+10+25+15+40+15 = 110 = 100 + 10
  eq(q(5).add(10).add(25).add(15).add(40).add(15), 110, label + ' 期初资产');
  // 期末：剩余资产（按真实价值）= 剩余存款 + 紧急借款 + 净资产
  eq(r.assetsLeft, r.Dleft.add(r.borrow).add(r.nw), label + ' 期末恒等式');
  // 净资产分解：资本 − 减值 − 甩卖损失
  eq(r.nw, r.decomposition, label + ' 净资产分解');
  // 现金守恒：付出 = 需求 − 未付；存款减少额 = 付出
  eq(r.paid, q(W).sub(r.short), label + ' 现金守恒');
  eq(q(100).sub(r.Dleft), r.paid, label + ' 存款减少 = 付出');
  // 停业 ⇔ 有未付缺口
  assert.equal(r.survived, r.short.cmp(0) === 0, label + ' 停业判定');
}

// ---- 手算期望值（推导见预检报告 B 节表 A-1）----
test('M1 平常日：W=8，平静，无借款 → 付清、无损失、净资产 10', () => {
  const r = runDay({ W: 8, panic: false }); checkIdentities(r, 8, 'M1');
  assert.equal(r.survived, true); eq(r.fire, 0); eq(r.nw, 10);
});

test('M2 挤兑无保护：W=60 → 付 51、差 9、停业；损失 4（L1、S3）；净资产 6', () => {
  const r = runDay({ W: 60 }); checkIdentities(r, 60, 'M2');
  eq(r.paid, 51); eq(r.short, 9); assert.equal(r.survived, false);
  eq(r.loss.L, 1); eq(r.loss.S, 3); eq(r.nw, 6);
});

test('M3 挤兑有保护：借 30，叫回面值 15.625 得 15；损失 0.625；净资产 9.375', () => {
  const r = runDay({ W: 60, channel: true, appraisal: 40, trueK: 40 }); checkIdentities(r, 60, 'M3');
  assert.equal(r.survived, true); eq(r.borrow, 30); eq(q(25).sub(r.left.L), '15.625');
  eq(r.loss.L, '0.625'); eq(r.loss.S, 0); eq(r.nw, '9.375');
});

test('M4 资产真的坏了：K=25 按 25 借 18.75 → 撑过；损失 1.5625；净资产 −6.5625；剩余资产 52.1875', () => {
  const r = runDay({ W: 60, channel: true, appraisal: 25, trueK: 25 }); checkIdentities(r, 60, 'M4');
  assert.equal(r.survived, true); eq(r.borrow, '18.75'); eq(r.loss.L, 1); eq(r.loss.S, '0.5625');
  eq(r.nw, '-6.5625'); eq(r.assetsLeft, '52.1875'); eq(r.Dleft, 40); eq(r.gap, 0);
});

// Blocker A：M5 的四个会计分支 +6、−9、+7.5、−7.5
test('M5 分支①：按 25 放款，真实值 40 → 付 69.75、差 5.25、停业；损失 4；净资产 +6；覆盖缺口 0', () => {
  const r = runDay({ W: 75, channel: true, appraisal: 25, trueK: 40 }); checkIdentities(r, 75, 'M5①');
  eq(r.paid, '69.75'); eq(r.short, '5.25'); assert.equal(r.survived, false);
  eq(r.borrow, '18.75'); eq(r.loss.L, 1); eq(r.loss.S, 3); eq(r.nw, 6); eq(r.gap, 0);
  eq(r.assetsLeft, 55); eq(r.Dleft, '30.25');
});
test('M5 分支②：按 25 放款，真实值 25 → 停业；净资产 −9（减值 15 + 甩卖 4 − 资本 10）；覆盖缺口 0', () => {
  const r = runDay({ W: 75, channel: true, appraisal: 25, trueK: 25 }); checkIdentities(r, 75, 'M5②');
  assert.equal(r.survived, false); eq(r.nw, -9); eq(r.impair, 15); eq(r.fire, 4); eq(r.gap, 0);
  eq(r.assetsLeft, 40); eq(r.Dleft.add(r.borrow), 49);
});
test('M5 分支③：按 40 放款，真实值 40 → 撑过；叫回全部 L 得 24、卖 S 面值 7.5 得 6；损失 2.5；净资产 +7.5', () => {
  const r = runDay({ W: 75, channel: true, appraisal: 40, trueK: 40 }); checkIdentities(r, 75, 'M5③');
  assert.equal(r.survived, true); eq(r.borrow, 30); eq(r.loss.L, 1); eq(r.loss.S, '1.5'); eq(r.nw, '7.5'); eq(r.gap, 0);
  eq(r.assetsLeft, '62.5'); eq(r.Dleft, 25);
});
test('M5 分支④：按 40 放款，真实值 25 → 撑过；净资产 −7.5；抵押品覆盖缺口 5（不是出借人损失）', () => {
  const r = runDay({ W: 75, channel: true, appraisal: 40, trueK: 25 }); checkIdentities(r, 75, 'M5④');
  assert.equal(r.survived, true); eq(r.nw, '-7.5'); eq(r.impair, 15); eq(r.fire, '2.5'); eq(r.gap, 5);
});

test('M6 传染：三条路径', () => {
  // ① 甲无保护 W=75 → 停业（且卖过证券）；乙 W=20+40=60，证券按 70% → 付 49.5，停业；损失 5.5；净资产 4.5
  const a1 = runDay({ W: 75 }); checkIdentities(a1, 75, 'M6 甲①');
  assert.equal(a1.survived, false); assert.equal(a1.soldS, true); eq(a1.nw, 6);
  const b1 = runDay({ W: 60, priorFireSale: true }); checkIdentities(b1, 60, 'M6 乙①');
  eq(b1.paid, '49.5'); assert.equal(b1.survived, false); eq(b1.fire, '5.5'); eq(b1.nw, '4.5');
  // ② 甲无保护、乙有保护 → 乙借 30、叫回 15.625 → 损失 0.625
  const b2 = runDay({ W: 60, priorFireSale: true, channel: true, appraisal: 40, trueK: 40 }); checkIdentities(b2, 60, 'M6 乙②');
  assert.equal(b2.survived, true); eq(b2.fire, '0.625'); eq(b2.nw, '9.375');
  // ③ 甲有保护 → 撑过（但卖过证券）；乙 W=20，无保护 → 叫回面值 125/24 得 5；损失 5/24
  const a3 = runDay({ W: 75, channel: true, appraisal: 40, trueK: 40 }); checkIdentities(a3, 75, 'M6 甲③');
  assert.equal(a3.survived, true); assert.equal(a3.soldS, true); eq(a3.nw, '7.5');
  const b3 = runDay({ W: 20, priorFireSale: true }); checkIdentities(b3, 20, 'M6 乙③');
  assert.equal(b3.survived, true); eq(b3.fire, '5/24'); eq(b3.nw, '235/24');
});
