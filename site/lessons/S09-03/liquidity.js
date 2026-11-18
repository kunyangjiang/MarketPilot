/* S09-03 流动性模型（M1–M6）：纯函数，精确分数。
 * 规则来自《交互方案》v2.2 候选第 3.1、4.2、4.3 节：
 *   资产 C 5（金库现金）、B 10（存放同业）、L 25（通知贷款）、S 15（证券）、K 40（抵押贷款与长期贷款）、O 15（房地产及其他）；
 *   负债：存款 100；资本 10。付款顺序 C → B → 紧急借款 → 叫回 L → 卖出 S；每步只取所需。
 *   L：平静 100%、恐慌 96%。S：平静 95%、恐慌 80%、前一天市场上已有甩卖时 70%。
 *   紧急借款：以 K 为抵押，按出借人评估值的 75% 放款，只借当日所需。
 * 本文件不含任何真实机构的名字。浏览器中挂到 window.S0903Model，Node 中 module.exports。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.S0903Model = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---- 分数（分子、分母都是安全整数；本模型的数值很小） ----
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  function F(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return Object.freeze({ n: n / g, d: d / g });
  }
  const fr = x => (typeof x === 'object' ? x : decimal(x));
  function decimal(x) { // 只用于有限小数常量，如 0.96、0.75
    const s = String(x); const k = s.includes('.') ? s.split('.')[1].length : 0; const d = Math.pow(10, k);
    return F(Math.round(x * d), d);
  }
  const add = (a, b) => (a = fr(a), b = fr(b), F(a.n * b.d + b.n * a.d, a.d * b.d));
  const sub = (a, b) => (a = fr(a), b = fr(b), F(a.n * b.d - b.n * a.d, a.d * b.d));
  const mul = (a, b) => (a = fr(a), b = fr(b), F(a.n * b.n, a.d * b.d));
  const div = (a, b) => (a = fr(a), b = fr(b), F(a.n * b.d, a.d * b.n));
  const cmp = (a, b) => { const x = sub(a, b); return Math.sign(x.n); };
  const min = (a, b) => (cmp(a, b) <= 0 ? fr(a) : fr(b));
  const max = (a, b) => (cmp(a, b) >= 0 ? fr(a) : fr(b));
  const ZERO = F(0);
  const isZero = a => fr(a).n === 0;
  const val = a => fr(a).n / fr(a).d;
  const str = a => (a = fr(a), a.d === 1 ? String(a.n) : a.n + '/' + a.d);

  /** 显示用：有限小数原样显示（最多 4 位），否则显示约数 */
  function fmt(a, opts) {
    a = fr(a);
    let d = a.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
    const v = a.n / a.d;
    let s;
    if (d === 1) { s = String(+v.toFixed(4)); }
    else s = '≈' + v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    if (opts && opts.sign && v > 0) s = '＋' + s.replace('≈', '≈');
    if (v < 0) s = s.replace('-', '−');
    return s;
  }

  const BOOK = Object.freeze({ C: F(5), B: F(10), L: F(25), S: F(15), K: F(40), O: F(15) });
  const DEPOSITS = F(100), CAPITAL = F(10);
  const NAMES = { C: '金库现金', B: '存放同业', L: '通知贷款', S: '证券', K: '抵押贷款与长期贷款', O: '房地产及其他' };

  function rates(panic, priorFireSale) {
    return {
      L: panic ? F(96, 100) : F(1),
      S: !panic ? F(95, 100) : priorFireSale ? F(70, 100) : F(80, 100)
    };
  }

  /**
   * 一天的模型运行。
   * @param {object} o  W 提款需求；panic 是否恐慌；priorFireSale 前一天是否有甩卖；
   *                    channel 是否有紧急借款渠道；appraisal 出借人对 K 的评估值；trueK K 的真实价值（揭晓用）。
   */
  function runDay(o) {
    const W = fr(o.W), panic = !!o.panic, channel = !!o.channel;
    const appraisal = fr(o.appraisal === undefined ? 40 : o.appraisal);
    const trueK = fr(o.trueK === undefined ? 40 : o.trueK);
    const r = rates(panic, !!o.priorFireSale);
    const left = Object.assign({}, BOOK);
    const steps = [];
    let need = W, paid = ZERO, borrow = ZERO;
    const loss = { L: ZERO, S: ZERO };
    const cap = channel ? mul(appraisal, F(3, 4)) : ZERO;

    // 当日最多能凑出的现金（读数"当日可付现金"）
    const maxCash = add(add(add(BOOK.C, BOOK.B), cap), add(mul(BOOK.L, r.L), mul(BOOK.S, r.S)));

    function takeFull(k) { // 现金类：按面值付出
      if (isZero(need)) return;
      const x = min(left[k], need); if (isZero(x)) return;
      left[k] = sub(left[k], x); need = sub(need, x); paid = add(paid, x);
      steps.push({ kind: k, face: x, cash: x, loss: ZERO, needAfter: need });
    }
    takeFull('C'); takeFull('B');
    if (channel && !isZero(need)) {
      const x = min(cap, need);
      if (!isZero(x)) { borrow = x; need = sub(need, x); paid = add(paid, x); steps.push({ kind: 'borrow', face: x, cash: x, loss: ZERO, cap, needAfter: need }); }
    }
    for (const k of ['L', 'S']) {
      if (isZero(need)) break;
      const cash = min(mul(left[k], r[k]), need); if (isZero(cash)) continue;
      const face = div(cash, r[k]);
      left[k] = sub(left[k], face); loss[k] = sub(face, cash); need = sub(need, cash); paid = add(paid, cash);
      steps.push({ kind: k, face, cash, loss: loss[k], rate: r[k], needAfter: need });
    }
    const survived = isZero(need);
    const depositsLeft = sub(DEPOSITS, paid);
    const fire = add(loss.L, loss.S);
    const soldS = cmp(left.S, BOOK.S) < 0;

    function valuation(kValue) {
      const assets = add(add(add(left.C, left.B), add(left.L, left.S)), add(fr(kValue), left.O));
      const nw = sub(sub(assets, depositsLeft), borrow);
      const impair = sub(BOOK.K, fr(kValue));
      return { kValue: fr(kValue), assets, nw, impair, gap: max(sub(borrow, fr(kValue)), ZERO),
        decomposition: sub(sub(CAPITAL, impair), fire) };
    }
    return { input: o, W, rates: r, steps, paid, short: need, survived, borrow, cap, loss, fire, left,
      depositsLeft, maxCash, soldS, at: valuation, truth: valuation(trueK) };
  }

  /** 固定措辞的状态标签（交互方案 3.2） */
  function label(run, v) {
    v = v || run.truth;
    const s = Math.sign(v.nw.n);
    if (s < 0) {
      const parts = [];
      if (!isZero(v.impair)) parts.push('抵押贷款减值 ' + fmt(v.impair) + '（40 → ' + fmt(v.kValue) + '）');
      if (!isZero(run.fire)) parts.push('甩卖损失 ' + fmt(run.fire) + '（通知贷款 ' + fmt(run.loss.L) + '、证券 ' + fmt(run.loss.S) + '）');
      return { tone: 'neg', text: '按当前资产价值假设，净资产为负。',
        why: parts.join('＋ ') + '，超过了原有资本 10，差额为 ' + fmt(sub(ZERO, v.nw)) + '。' };
    }
    if (!run.survived) return { tone: 'short', text: '按当前资产价值假设，净资产仍为正，但当日可支付现金不足。', why: '' };
    return { tone: 'ok', text: '按当前资产价值假设，净资产为正，当日可支付全部提款。', why: '' };
  }

  /** 预设场景 */
  const SCENARIOS = {
    M1: { id: 'M1', title: 'M1 平常日', day: { W: 8, panic: false, channel: false } },
    M2: { id: 'M2', title: 'M2 挤兑，无保护', day: { W: 60, panic: true, channel: false } },
    M3: { id: 'M3', title: 'M3 挤兑，有保护', day: { W: 60, panic: true, channel: true, appraisal: 40, trueK: 40 } },
    M4: { id: 'M4', title: 'M4 资产真的坏了', day: { W: 60, panic: true, channel: true, appraisal: 25, trueK: 25 } },
    M5: { id: 'M5', title: 'M5 一夜之间看不清', day: { W: 75, panic: true, channel: true } }, // 评估值由读者选 25 或 40，真实值揭晓
    M6: { id: 'M6', title: 'M6 传染', two: true }
  };

  /** M6：两家机构、两天。path 为 1、2、3（交互方案 4.3）。③ 中乙没有借款渠道。 */
  function runM6(path) {
    const aProtected = path === 3;
    const a = runDay({ W: 75, panic: true, channel: aProtected, appraisal: 40, trueK: 40 });
    const extra = a.survived ? 0 : 40;
    const bProtected = path === 2;
    const b = runDay({ W: 20 + extra, panic: true, priorFireSale: a.soldS, channel: bProtected, appraisal: 40, trueK: 40 });
    return { path, a, b, extra, aProtected, bProtected };
  }

  return { F, add, sub, mul, div, cmp, val, str, fmt, isZero, BOOK, DEPOSITS, CAPITAL, NAMES, runDay, runM6, label, SCENARIOS };
}));
