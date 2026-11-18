/* S02-02 撮合引擎与场景测试。运行：node --test site/tests/
 * 预期值逐项抄自 lessons/S02-02/S02-02-交互方案.md 第 6.2 节（"以下结果即该交互的验收测试用例"），
 * 没有用被测代码计算预期值。金额单位：美分（整数）。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const OB = require('../engine/orderbook.js');
const M = require('../lessons/S02-02/model.js');

const fillsOf = rep => rep.fills.map(f => [f.makerId, f.qty, f.price]);
const top = b => ({ ask: OB.bestAsk(b), bid: OB.bestBid(b), spread: OB.spread(b), last: b.last && b.last.price });
function allIntegers(rep) {
  for (const f of rep.fills) { assert.ok(Number.isSafeInteger(f.price) && Number.isSafeInteger(f.qty) && Number.isSafeInteger(f.amount)); }
  assert.ok(Number.isSafeInteger(rep.totalCents));
}

test('初始订单簿与课文图 1 一致', () => {
  const s = M.createSession(), b = s.state().book;
  assert.deepEqual(OB.levels(b, 'sell').map(L => [L.price, L.qty, L.orders.map(o => o.id)]),
    [[5002, 200, ['B']], [5003, 300, ['C', 'G']], [5004, 400, ['D']], [5006, 600, ['E']]]);
  assert.deepEqual(OB.levels(b, 'buy').map(L => [L.price, L.qty, L.orders.map(o => o.id)]),
    [[5000, 300, ['H', 'J']], [4999, 500, ['K']], [4997, 400, ['L']], [4995, 800, ['M']]]);
  assert.deepEqual(top(b), { ask: { price: 5002, qty: 200 }, bid: { price: 5000, qty: 300 }, spread: 2, last: 5001 });
  assert.equal(OB.fmt.clock(b.last.time), '09:59:58');
  assert.equal(b.last.qty, 100);
  assert.equal(OB.depth(b, 'sell', 5), 1500);
});

test('场景 1：小林的市价单', () => {
  const s = M.createSession(); s.loadScenario('S1');
  const r = s.submit({ side: 'buy', type: 'market', qty: 600 });
  assert.ok(r.ok);
  assert.deepEqual(fillsOf(r.report), [['B', 200, 5002], ['C', 100, 5003], ['G', 200, 5003], ['D', 100, 5004]]);
  assert.deepEqual(r.report.fills.map(f => f.amount), [1000400, 500300, 1000600, 500400]); // $10,004 / $5,003 / $10,006 / $5,004
  assert.equal(r.report.totalCents, 3001700);
  assert.equal(OB.fmt.money(r.report.totalCents), '$30,017');
  const a = OB.fmt.avg(r.report.totalCents, r.report.filledQty);
  assert.equal(a.text, '$50.0283'); assert.equal(a.exact, false);
  assert.equal(r.report.totalCents - 600 * 5001, 1100); // 比按 $50.01 计算的 $30,006 多 $11
  const b = s.state().book;
  assert.deepEqual(top(b), { ask: { price: 5004, qty: 300 }, bid: { price: 5000, qty: 300 }, spread: 4, last: 5004 });
  assert.equal(r.report.unfilledCancelled, 0); assert.equal(r.report.rested, null);
  allIntegers(r.report);
  assert.equal(r.trace.length, 4); // 动画逐笔回放，与成交笔数一致
  assert.deepEqual(r.trace[1].book.asks.map(o => [o.id, o.qty]), [['G', 200], ['D', 400], ['E', 600]]);
});

test('场景 2：不交易，报价也会变；读者撤销自己的剩余订单', () => {
  const s = M.createSession(); s.loadScenario('S2');
  assert.deepEqual(top(s.state().book), { ask: { price: 5004, qty: 300 }, bid: { price: 5000, qty: 300 }, spread: 4, last: 5004 });
  const r1 = s.submit({ side: 'sell', type: 'limit', qty: 200, price: 5001 });
  assert.equal(r1.report.fills.length, 0);
  assert.deepEqual(r1.report.rested, { id: 'Y2', price: 5001, qty: 200 });
  let b = s.state().book;
  assert.deepEqual(top(b), { ask: { price: 5001, qty: 200 }, bid: { price: 5000, qty: 300 }, spread: 1, last: 5004 });
  assert.equal(OB.levels(b, 'sell')[0].orders[0].owner, 'you');
  assert.equal(s.pendingStep().kind, 'scripted');
  const r2 = s.runScripted();
  assert.equal(r2.report.owner, 'buyer2'); // 由脚本代为提交，不是读者
  assert.deepEqual(r2.report.fills.map(f => [f.makerOwner, f.qty, f.price]), [['you', 100, 5001]]);
  b = s.state().book;
  assert.equal(b.last.price, 5001); assert.equal(5004 - b.last.price, 3); // 下降 $0.03
  assert.deepEqual(OB.bestAsk(b), { price: 5001, qty: 100 });
  assert.equal(OB.fmt.clock(s.state().reports[0].fills[0].time), '10:00:00'); // 场景 1 的市价单
  assert.equal(OB.fmt.clock(r2.report.fills[0].time), '10:00:10'); // 小周挂单后又过了五秒
  // 补充：撤销自己剩余的 100 股，卖一退回 $50.04 × 300
  const c = s.cancel('Y2');
  assert.ok(c.ok); assert.equal(c.cancelled.qty, 100);
  assert.deepEqual(OB.bestAsk(s.state().book), { price: 5004, qty: 300 });
});

test('场景 3：报价被收回（顶部不变、深度改变）', () => {
  const s = M.createSession(); s.loadScenario('S3');
  assert.equal(s.state().mode, 'experiment');
  const blocked = s.submit({ side: 'buy', type: 'market', qty: 600 });
  assert.equal(blocked.ok, false); assert.equal(blocked.reason, 'mode'); // 实验模式下不能下单
  const e = s.trigger('X1');
  assert.ok(e.ok);
  assert.deepEqual(e.withdrawn.map(w => [w.id, w.qty, w.price]), [['C', 100, 5003], ['G', 200, 5003], ['D', 400, 5004]]);
  const b0 = s.state().book;
  assert.deepEqual(top(b0), { ask: { price: 5002, qty: 200 }, bid: { price: 5000, qty: 300 }, spread: 2, last: 5001 });
  assert.equal(OB.depth(b0, 'sell', 5), 800); // 1,500 → 800
  const j = s.state().journal.find(x => x.kind === 'event');
  assert.equal(OB.fmt.clock(j.time, true), '10:00:00.000');
  assert.equal(s.state().mode, 'trader'); // 自动切回交易者模式
  const r = s.submit({ side: 'buy', type: 'market', qty: 600 });
  assert.ok(r.report.fills[0].time > j.time); // 撤单先于小林的订单处理
  assert.deepEqual(fillsOf(r.report), [['B', 200, 5002], ['E', 400, 5006]]);
  assert.deepEqual(r.report.fills.map(f => f.amount), [1000400, 2002400]);
  assert.equal(r.report.totalCents, 3002800);
  assert.equal(OB.fmt.avg(r.report.totalCents, 600).text, '$50.0467');
  assert.equal(r.report.totalCents - 3001700, 1100); // 比场景 1 多 $11
  assert.deepEqual(top(s.state().book), { ask: { price: 5006, qty: 200 }, bid: { price: 5000, qty: 300 }, spread: 6, last: 5006 });
  allIntegers(r.report);
});

test('场景 4：限价单是上限，不是成交价', () => {
  const s = M.createSession(); s.loadScenario('S4');
  const r = s.submit({ side: 'buy', type: 'limit', qty: 600, price: 5003 });
  assert.deepEqual(fillsOf(r.report), [['B', 200, 5002], ['C', 100, 5003], ['G', 200, 5003]]);
  assert.equal(r.report.filledQty, 500);
  assert.equal(r.report.totalCents, 2501300);
  assert.equal(OB.fmt.avg(r.report.totalCents, 500).text, '$50.026');
  assert.equal(OB.fmt.avg(r.report.totalCents, 500).exact, true);
  assert.deepEqual(r.report.rested, { id: 'Y1', price: 5003, qty: 100 });
  const b = s.state().book;
  assert.deepEqual(top(b), { ask: { price: 5004, qty: 400 }, bid: { price: 5003, qty: 100 }, spread: 1, last: 5003 });
  assert.equal(OB.levels(b, 'buy')[0].orders[0].owner, 'you');
});

test('场景 5：先到先得（同价按时间）', () => {
  const s = M.createSession(); s.loadScenario('S5');
  const r = s.submit({ side: 'sell', type: 'market', qty: 200 });
  assert.deepEqual(fillsOf(r.report), [['H', 100, 5000], ['J', 100, 5000]]);
  assert.equal(OB.fmt.clock(r.report.fills[0].makerTime), '09:58:10');
  assert.equal(OB.fmt.clock(r.report.fills[1].makerTime), '09:59:40');
  assert.equal(r.report.fills[1].makerRemaining, 100);
  const b = s.state().book;
  assert.deepEqual(OB.bestBid(b), { price: 5000, qty: 100 });
  assert.deepEqual(OB.levels(b, 'buy')[0].orders.map(o => [o.id, o.qty]), [['J', 100]]);
  assert.equal(b.last.price, 5000);
  assert.equal(r.report.totalCents, 1000000);
});

test('场景 6：同样的股价，不同的深度', () => {
  const s = M.createSession(); s.loadScenario('S6');
  assert.equal(s.trigger('X3').ok, true);
  assert.equal(s.state().view, 'compare');
  assert.equal(s.state().compare.A.last.price, 5000); assert.equal(s.state().compare.B.last.price, 5000);
  const a = s.submit({ side: 'buy', type: 'market', qty: 1000 }, 'A');
  const b = s.submit({ side: 'buy', type: 'market', qty: 1000 }, 'B');
  assert.deepEqual(fillsOf(a.report), [['A1', 1000, 5001]]);
  assert.equal(a.report.totalCents, 5001000); assert.equal(OB.fmt.avg(5001000, 1000).text, '$50.010');
  assert.equal(s.state().compare.A.last.price, 5001);
  assert.deepEqual(b.report.fills.map(f => [f.qty, f.price]), [[100, 5005], [200, 5020], [300, 5040], [400, 5080]]);
  assert.equal(b.report.totalCents, 5048500); assert.equal(OB.fmt.avg(5048500, 1000).text, '$50.485');
  assert.equal(s.state().compare.B.last.price, 5080);
  // B 比 A 平均每股贵 $0.475；1,000 股合计多付 $475
  assert.equal(b.report.totalCents - a.report.totalCents, 47500);
  assert.equal(OB.fmt.avg(b.report.totalCents - a.report.totalCents, 1000).text, '$0.475');
});

test('场景 7：对手方不够了', () => {
  const s = M.createSession(); s.loadScenario('S7');
  const r = s.submit({ side: 'buy', type: 'market', qty: 2500 });
  assert.deepEqual(r.report.fills.map(f => [f.qty, f.price]), [[200, 5002], [100, 5003], [200, 5003], [400, 5004], [600, 5006]]);
  assert.equal(r.report.filledQty, 1500);
  assert.equal(r.report.totalCents, 7506500); // $75,065
  assert.equal(OB.fmt.avg(7506500, 1500).text, '$50.0433');
  assert.equal(r.report.unfilledCancelled, 1000);
  assert.equal(r.report.rested, null);
  const b = s.state().book;
  assert.equal(OB.bestAsk(b), null); assert.equal(b.asks.length, 0);
  assert.equal(b.last.price, 5006);
  // 按价位汇总：200 × 50.02 + 300 × 50.03 + 400 × 50.04 + 600 × 50.06
  const byLevel = {}; r.report.fills.forEach(f => { byLevel[f.price] = (byLevel[f.price] || 0) + f.amount; });
  assert.deepEqual(byLevel, { 5002: 1000400, 5003: 1500900, 5004: 2001600, 5006: 3003600 });
});

test('撤单权限：交易者不能撤销他人订单，也不能撤销已成交部分', () => {
  const s = M.createSession();
  for (const id of ['B', 'C', 'G', 'D', 'E', 'H', 'J', 'K', 'L', 'M']) {
    const r = s.cancel(id);
    assert.equal(r.ok, false); assert.equal(r.reason, 'not-owner');
  }
  assert.deepEqual(s.state().book.asks.map(o => o.id), ['B', 'C', 'G', 'D', 'E']); // 订单簿未被改动
  // 读者自己的订单：部分成交后只能撤销剩余部分
  s.submit({ side: 'sell', type: 'limit', qty: 300, price: 5001 }); // Y1 挂在 $50.01
  s.setMode('experiment'); s.setMode('trader');
  const buyer = OB.submit(s.state().book, { id: 'X', owner: 'other', side: 'buy', type: 'market', qty: 100, time: 0 });
  assert.equal(buyer.report.fills[0].makerId, 'Y1');
  const c = OB.cancel(buyer.state, { orderId: 'Y1', requester: 'you' });
  assert.ok(c.ok); assert.equal(c.cancelled.qty, 200); // 已成交的 100 股不在订单簿上
  const again = OB.cancel(c.state, { orderId: 'Y1', requester: 'you' });
  assert.equal(again.ok, false); assert.equal(again.reason, 'not-resting');
  // 全部成交后无法撤销
  const s2 = M.createSession(); s2.submit({ side: 'sell', type: 'limit', qty: 100, price: 5001 });
  const eat = OB.submit(s2.state().book, { id: 'X2', owner: 'other', side: 'buy', type: 'market', qty: 100, time: 0 });
  assert.equal(OB.cancel(eat.state, { orderId: 'Y1', requester: 'you' }).reason, 'not-resting');
});

test('外部事件只能在市场实验模式中触发；读者在实验模式中不能下单', () => {
  const s = M.createSession();
  assert.equal(s.trigger('X1').reason, 'mode');
  s.setMode('experiment');
  assert.equal(s.submit({ side: 'buy', type: 'market', qty: 100 }).reason, 'mode');
  assert.equal(s.cancel('B').reason, 'mode');
  assert.ok(s.trigger('X2').ok);
  assert.deepEqual(OB.bestAsk(s.state().book), { price: 5001, qty: 200 });
  assert.equal(s.state().book.last.price, 5001); // 不成交；最新成交价未变（初始也是 $50.01）
  assert.equal(OB.levels(s.state().book, 'sell')[0].orders[0].owner, 'zhou');
});

test('重置回到初始订单簿；场景可重复、结果确定', () => {
  const s = M.createSession();
  const initial = JSON.stringify(s.state().book);
  s.submit({ side: 'buy', type: 'market', qty: 2500 });
  s.reset();
  assert.equal(JSON.stringify(s.state().book), initial);
  assert.equal(s.state().clock, M.START_CLOCK);
  assert.equal(s.state().mode, 'trader'); assert.equal(s.state().journal.length, 0);
  const runs = [1, 2, 3].map(() => { const x = M.createSession(); x.loadScenario('S1'); return JSON.stringify(x.submit({ side: 'buy', type: 'market', qty: 600 }).report); });
  assert.equal(runs[0], runs[1]); assert.equal(runs[1], runs[2]);
  s.loadScenario('S3'); s.trigger('X1'); s.restartScenario();
  assert.equal(OB.depth(s.state().book, 'sell', 5), 1500);
});

test('引擎是纯函数：不修改传入状态', () => {
  const b = OB.create(M.INITIAL); const before = JSON.stringify(b);
  OB.submit(b, { id: 'q', owner: 'you', side: 'buy', type: 'market', qty: 600, time: 0 });
  OB.cancel(b, { orderId: 'B', requester: 'B' });
  OB.applyMarketEvent(b, { id: 'X', withdraw: ['C'] });
  assert.equal(JSON.stringify(b), before);
});

test('输入校验：数量与限价范围、非整数', () => {
  const s = M.createSession();
  for (const q of [0, 50, 150, 3100, 100.5]) assert.equal(s.submit({ side: 'buy', type: 'market', qty: q }).reason, 'invalid');
  for (const p of [4979, 5031, 5001.5]) assert.equal(s.submit({ side: 'buy', type: 'limit', qty: 100, price: p }).reason, 'invalid');
  assert.throws(() => OB.submit(s.state().book, { id: 'z', owner: 'you', side: 'buy', type: 'limit', qty: 100, price: 50.01, time: 0 }));
  assert.ok(s.submit({ side: 'buy', type: 'limit', qty: 100, price: 4980 }).ok);
});

test('格式化：整数运算，不出现浮点误差', () => {
  assert.equal(OB.fmt.price(5002), '$50.02'); assert.equal(OB.fmt.price(5000), '$50.00');
  assert.equal(OB.fmt.money(3001700), '$30,017'); assert.equal(OB.fmt.money(1000400), '$10,004');
  assert.equal(OB.fmt.money(123), '$1.23');
  assert.equal(OB.fmt.avg(3001700, 600).text, '$50.0283');
  assert.equal(OB.fmt.avg(3002800, 600).text, '$50.0467');
  assert.equal(OB.fmt.clock(OB.T(10, 0, 5)), '10:00:05');
});
