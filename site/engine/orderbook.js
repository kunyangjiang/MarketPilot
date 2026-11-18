/* MarketPilot · 订单簿撮合引擎（单一交易场所的教学模型）
 *
 * 规则：连续交易；价格优先，同价按到达先后（time，其次 seq）；市价单与限价单；部分成交；
 *       限价单未成交部分挂入订单簿，市价单未成交部分直接取消（模型规则，见 S02-02 交互方案第 7 节）。
 * 数值：价格一律用整数美分，股数用整数，金额 = 美分 × 股数（整数美分）。不出现浮点金额。
 * 权限：cancel() 只允许订单所有者撤单；外部市场事件走 applyMarketEvent()，由场景层调用，交易者界面不能直接调用。
 * 纯函数：每个操作返回新的状态，不修改传入的状态，便于重置和测试。不依赖 DOM。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MPOrderBook = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const isInt = n => Number.isSafeInteger(n);
  function req(cond, msg) { if (!cond) throw new TypeError(msg); }
  const clone = s => JSON.parse(JSON.stringify(s)); // 状态只含纯数据

  function sortBook(s) {
    const t = o => (o.time == null ? -1 : o.time);
    s.asks.sort((a, b) => a.price - b.price || t(a) - t(b) || a.seq - b.seq);
    s.bids.sort((a, b) => b.price - a.price || t(a) - t(b) || a.seq - b.seq);
  }

  function restOrder(s, o) {
    req(o.side === 'buy' || o.side === 'sell', 'side 必须是 buy 或 sell');
    req(isInt(o.price) && o.price > 0, '价格必须是正整数美分');
    req(isInt(o.qty) && o.qty > 0, '股数必须是正整数');
    req(o.time == null || isInt(o.time), 'time 必须是整数毫秒');
    req(typeof o.id === 'string' && o.id, '订单需要 id');
    req(typeof o.owner === 'string' && o.owner, '订单需要 owner');
    req(!find(s, o.id), '订单 id 重复：' + o.id);
    const r = { id: o.id, owner: o.owner, side: o.side, price: o.price, qty: o.qty, orig: o.orig || o.qty, time: o.time == null ? null : o.time, seq: ++s.seq };
    (o.side === 'sell' ? s.asks : s.bids).push(r);
    sortBook(s);
    return r;
  }

  function find(s, id) {
    return s.asks.find(o => o.id === id) || s.bids.find(o => o.id === id) || null;
  }

  /** 建一本订单簿。asks / bids 为挂单数组；last 为最新成交 {price, qty, time}。 */
  function create(init) {
    init = init || {};
    const s = { asks: [], bids: [], last: null, seq: 0, log: [] };
    (init.asks || []).forEach(o => restOrder(s, Object.assign({}, o, { side: 'sell' })));
    (init.bids || []).forEach(o => restOrder(s, Object.assign({}, o, { side: 'buy' })));
    if (init.last) {
      req(isInt(init.last.price) && isInt(init.last.qty), 'last 需要整数价格和股数');
      s.last = { price: init.last.price, qty: init.last.qty, time: init.last.time == null ? null : init.last.time };
    }
    return s;
  }

  function snapshot(s) {
    return { asks: s.asks.map(o => ({ id: o.id, owner: o.owner, price: o.price, qty: o.qty, time: o.time })),
             bids: s.bids.map(o => ({ id: o.id, owner: o.owner, price: o.price, qty: o.qty, time: o.time })),
             last: s.last ? Object.assign({}, s.last) : null };
  }

  /** 提交一张订单。返回 { state, report, trace }。
   *  order: { id, owner, side:'buy'|'sell', type:'market'|'limit', qty, price?(限价), time }
   *  trace：每成交一笔后的订单簿快照，用于动画逐档回放，保证画面与引擎状态一致。 */
  function submit(prev, order) {
    const o = order || {};
    req(o.side === 'buy' || o.side === 'sell', 'side 必须是 buy 或 sell');
    req(o.type === 'market' || o.type === 'limit', 'type 必须是 market 或 limit');
    req(isInt(o.qty) && o.qty > 0, '股数必须是正整数');
    req(o.type === 'market' || (isInt(o.price) && o.price > 0), '限价单需要正整数美分价格');
    req(typeof o.id === 'string' && o.id && typeof o.owner === 'string' && o.owner, '订单需要 id 和 owner');
    req(o.time == null || isInt(o.time), 'time 必须是整数毫秒');

    const s = clone(prev);
    req(!find(s, o.id), '订单 id 重复：' + o.id);
    const lastBefore = s.last ? Object.assign({}, s.last) : null;
    const contra = o.side === 'buy' ? s.asks : s.bids;
    const crosses = m => o.type === 'market' || (o.side === 'buy' ? m.price <= o.price : m.price >= o.price);

    s.log.push({ kind: 'order', id: o.id, owner: o.owner, side: o.side, type: o.type, qty: o.qty, price: o.type === 'limit' ? o.price : null, time: o.time == null ? null : o.time });

    let remaining = o.qty;
    const fills = [], trace = [];
    while (remaining > 0 && contra.length && crosses(contra[0])) {
      const m = contra[0];
      const q = Math.min(remaining, m.qty);
      m.qty -= q; remaining -= q;
      const fill = { price: m.price, qty: q, amount: m.price * q, makerId: m.id, makerOwner: m.owner, makerTime: m.time,
                     makerRemaining: m.qty, takerId: o.id, takerOwner: o.owner, aggressor: o.side, time: o.time == null ? null : o.time };
      fills.push(fill);
      if (m.qty === 0) contra.shift();
      s.last = { price: m.price, qty: q, time: fill.time };
      s.log.push(Object.assign({ kind: 'fill' }, fill));
      trace.push({ fill: fill, book: snapshot(s) });
    }

    let rested = null, unfilledCancelled = 0;
    if (remaining > 0) {
      if (o.type === 'limit') {
        const r = restOrder(s, { id: o.id, owner: o.owner, side: o.side, price: o.price, qty: remaining, orig: o.qty, time: o.time });
        rested = { id: r.id, price: r.price, qty: r.qty };
        s.log.push({ kind: 'rest', id: o.id, owner: o.owner, side: o.side, price: o.price, qty: remaining, time: r.time });
      } else {
        unfilledCancelled = remaining;
        s.log.push({ kind: 'unfilled', id: o.id, owner: o.owner, qty: remaining, time: o.time == null ? null : o.time });
      }
    }

    const filledQty = fills.reduce((a, f) => a + f.qty, 0);
    const totalCents = fills.reduce((a, f) => a + f.amount, 0);
    return {
      state: s,
      trace: trace,
      report: { orderId: o.id, owner: o.owner, side: o.side, type: o.type, qty: o.qty, limit: o.type === 'limit' ? o.price : null,
                fills: fills, filledQty: filledQty, totalCents: totalCents, rested: rested, unfilledCancelled: unfilledCancelled,
                lastBefore: lastBefore, lastAfter: s.last ? Object.assign({}, s.last) : null }
    };
  }

  /** 撤单：只有订单所有者可以撤。已成交的部分不在订单簿上，无法撤回。
   *  返回 { ok, state, reason?, cancelled? }；失败时 state 为原状态（不变）。 */
  function cancel(prev, request) {
    const r = request || {};
    const o = find(prev, r.orderId);
    if (!o) return { ok: false, state: prev, reason: 'not-resting' }; // 不存在，或已全部成交
    if (o.owner !== r.requester) return { ok: false, state: prev, reason: 'not-owner' };
    const s = clone(prev);
    const book = o.side === 'sell' ? s.asks : s.bids;
    const i = book.findIndex(x => x.id === o.id);
    const removed = book.splice(i, 1)[0];
    s.log.push({ kind: 'cancel', id: removed.id, owner: removed.owner, by: r.requester, qty: removed.qty, price: removed.price, side: removed.side, time: r.time == null ? null : r.time });
    return { ok: true, state: s, cancelled: { id: removed.id, qty: removed.qty, price: removed.price, side: removed.side } };
  }

  /** 外部市场事件：模拟其他参与者的整体行为（撤回一组报价、挂入新报价）。
   *  只供场景层的预定义事件使用，不是交易者可以做的操作。 */
  function applyMarketEvent(prev, ev) {
    const e = ev || {};
    req(typeof e.id === 'string' && e.id, '事件需要 id');
    let s = clone(prev);
    const withdrawn = [];
    (e.withdraw || []).forEach(id => {
      const o = find(s, id);
      req(o, '事件 ' + e.id + ' 要撤回的订单不在订单簿上：' + id);
      const book = o.side === 'sell' ? s.asks : s.bids;
      book.splice(book.indexOf(o), 1);
      withdrawn.push({ id: o.id, qty: o.qty, price: o.price, side: o.side });
    });
    s.log.push({ kind: 'event', id: e.id, label: e.label || '', time: e.time == null ? null : e.time, withdrawn: withdrawn });
    const reports = [];
    (e.add || []).forEach(a => {
      const r = submit(s, a);
      s = r.state; reports.push(r.report);
    });
    return { state: s, withdrawn: withdrawn, reports: reports };
  }

  /* ---------- 查询 ---------- */
  function levels(s, side) {
    const out = [];
    (side === 'sell' ? s.asks : s.bids).forEach(o => {
      let L = out[out.length - 1];
      if (!L || L.price !== o.price) { L = { price: o.price, qty: 0, orders: [] }; out.push(L); }
      L.qty += o.qty; L.orders.push({ id: o.id, owner: o.owner, qty: o.qty, time: o.time });
    });
    return out;
  }
  const bestAsk = s => { const L = levels(s, 'sell')[0]; return L ? { price: L.price, qty: L.qty } : null; };
  const bestBid = s => { const L = levels(s, 'buy')[0]; return L ? { price: L.price, qty: L.qty } : null; };
  function spread(s) { const a = bestAsk(s), b = bestBid(s); return a && b ? a.price - b.price : null; }
  /** 深度：卖方为卖一价格起 withinCents 以内（含）的累计股数；买方为买一价格往下 withinCents 以内。 */
  function depth(s, side, withinCents) {
    const best = side === 'sell' ? bestAsk(s) : bestBid(s);
    if (!best) return 0;
    return (side === 'sell' ? s.asks : s.bids)
      .filter(o => side === 'sell' ? o.price <= best.price + withinCents : o.price >= best.price - withinCents)
      .reduce((a, o) => a + o.qty, 0);
  }
  function totalQty(s, side) { return (side === 'sell' ? s.asks : s.bids).reduce((a, o) => a + o.qty, 0); }

  /* ---------- 格式化（全部整数运算） ---------- */
  const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  /** 价格：美分 → "$50.02" */
  function price(c) { req(isInt(c), 'price 需要整数美分'); const sgn = c < 0 ? '-' : ''; c = Math.abs(c); return sgn + '$' + group(Math.floor(c / 100)) + '.' + String(c % 100).padStart(2, '0'); }
  /** 金额：整数美元时不带小数 "$30,017"，否则带两位 */
  function money(c) { req(isInt(c), 'money 需要整数美分'); const sgn = c < 0 ? '-' : ''; c = Math.abs(c); return sgn + '$' + group(Math.floor(c / 100)) + (c % 100 ? '.' + String(c % 100).padStart(2, '0') : ''); }
  /** 平均价：totalCents / qty，四舍五入到 0.0001 美元；末位为 0 时去掉（至少保留 3 位）。 */
  function avg(totalCents, qty) {
    req(isInt(totalCents) && isInt(qty) && qty > 0, 'avg 需要整数');
    const num = totalCents * 100; // 单位：万分之一美元 × qty
    const units = Math.floor((2 * num + qty) / (2 * qty)); // 四舍五入
    const exact = num % qty === 0;
    let s = String(units % 10000).padStart(4, '0');
    if (s.endsWith('0')) s = s.slice(0, 3);
    return { text: '$' + group(Math.floor(units / 10000)) + '.' + s, exact: exact, units: units };
  }
  /** 毫秒 → "10:00:05"，withMs 时 "10:00:05.000" */
  function clock(ms, withMs) {
    if (ms == null) return '—';
    const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
    const p = n => String(n).padStart(2, '0');
    return p(h) + ':' + p(m) + ':' + p(sec) + (withMs ? '.' + String(ms % 1000).padStart(3, '0') : '');
  }
  const T = (h, m, s, ms) => ((h * 60 + m) * 60 + s) * 1000 + (ms || 0);

  return { create, submit, cancel, applyMarketEvent, find, levels, bestAsk, bestBid, spread, depth, totalQty, snapshot,
           fmt: { price, money, avg, clock, group }, T };
});
