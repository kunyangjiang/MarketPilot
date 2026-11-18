/* 价格阶梯渲染：把引擎状态（或引擎给出的逐笔快照）画成 HTML。
 * 只读数据，不计算成交；所有数字来自 MPOrderBook 的状态。
 * 视觉约定（与统一样稿一致）：卖单在上、紫色；买单在下、墨黑；荧光底 = 买一／卖一；
 * 虚线胶囊 = 最新成交价（记录）；"你"的订单用斜纹并写出"你"；已被吃掉的部分画成虚线框。 */
(function () {
  'use strict';
  const OB = window.MPOrderBook, M = window.S0202;
  const f = OB.fmt;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const who = o => M.ownerName(o);

  function levelMap(list) {
    const m = new Map();
    (list || []).forEach(o => { if (!m.has(o.price)) m.set(o.price, []); m.get(o.price).push(o); });
    return m;
  }

  /** opts: scale（整条代表的股数）、details、ghost（上一刻的快照，用来画被吃掉的部分）、
   *  showBids、showAsks、limit（限价线，美分）、limitSide、order（{id: 序号}，标出撮合顺序）、
   *  prices（固定显示的价位，美分数组，用于同刻度对比）、caption、compact、lastLabel、noLast */
  function render(book, opts) {
    opts = opts || {};
    const scale = opts.scale || 1000;
    const ghost = opts.ghost || null;
    const rows = [];
    const sides = [];
    if (opts.showAsks !== false) sides.push('sell');
    if (opts.showBids !== false) sides.push('buy');

    const bestA = OB.bestAsk(book), bestB = OB.bestBid(book);

    sides.forEach(side => {
      const cur = levelMap(side === 'sell' ? book.asks : book.bids);
      const old = ghost ? levelMap(side === 'sell' ? ghost.asks : ghost.bids) : new Map();
      const priceSet = new Set([...cur.keys(), ...old.keys()]);
      if (opts.prices && side === 'sell') opts.prices.forEach(p => priceSet.add(p));
      const prices = [...priceSet].sort((a, b) => b - a); // 两侧都按价格从高到低排
      const html = prices.map(p => row(side, p, cur.get(p) || [], old.get(p) || [], side === 'sell' ? bestA : bestB, scale, opts));
      rows.push({ side, html });
    });

    const asksHtml = rows.find(r => r.side === 'sell');
    const bidsHtml = rows.find(r => r.side === 'buy');
    let out = '<div class="lad' + (opts.compact ? ' compact' : '') + (opts.details ? ' det' : '') + '">';
    if (asksHtml) out += '<div class="lad-side lad-asks" role="presentation">' + (asksHtml.html.join('') || '<div class="lad-empty">卖方已无挂单</div>') + '</div>';
    out += mid(book, opts, bestA, bestB);
    if (bidsHtml) out += '<div class="lad-side lad-bids" role="presentation">' + (bidsHtml.html.join('') || '<div class="lad-empty">买方没有挂单</div>') + '</div>';
    out += '</div>';
    return out;
  }

  function row(side, price, curOrders, oldOrders, best, scale, opts) {
    const isBest = best && best.price === price && curOrders.length;
    const qty = curOrders.reduce((a, o) => a + o.qty, 0);
    // 以旧快照为基准排列分段：每张旧订单 = 仍在的部分（实心）+ 被吃掉的部分（虚线）
    const segs = [];
    const curById = new Map(curOrders.map(o => [o.id, o]));
    const seen = new Set();
    oldOrders.forEach(o => {
      const c = curById.get(o.id);
      const left = c ? c.qty : 0;
      if (left > 0) segs.push({ o: c, qty: left, kind: 'live' });
      if (o.qty - left > 0) segs.push({ o: o, qty: o.qty - left, kind: 'gone' });
      seen.add(o.id);
    });
    curOrders.forEach(o => { if (!seen.has(o.id)) segs.push({ o: o, qty: o.qty, kind: opts.ghost ? 'new' : 'live' }); });

    const limitHit = opts.limit != null && (opts.limitSide === 'buy' ? price <= opts.limit : price >= opts.limit);
    const bar = segs.map(s => {
      const w = Math.max(0, Math.min(100, s.qty / scale * 100));
      const you = s.o.owner === 'you';
      const n = opts.order && opts.order[s.o.id];
      const lab = opts.details || you || n
        ? (n ? '<i class="ord">' + n + '</i>' : '') + esc(you ? '你' : s.o.id) + ' ' + f.group(s.qty) + (opts.details && s.o.time != null ? '<span class="tm"> · ' + f.clock(s.o.time) + '</span>' : '')
        : '';
      const title = (s.kind === 'gone' ? '已成交：' : '') + who(s.o.owner) + ' ' + f.group(s.qty) + ' 股' + (s.o.time != null ? '，' + f.clock(s.o.time) + ' 提交' : '');
      return '<span class="seg ' + s.kind + (you ? ' you' : '') + '" style="width:' + w.toFixed(3) + '%" title="' + esc(title) + '">' + (lab ? '<em>' + lab + '</em>' : '') + '</span>';
    }).join('');

    const tag = side === 'sell' ? '卖' : '买';
    const bestTag = isBest ? '<b class="bt">' + (side === 'sell' ? '卖一' : '买一') + '</b>' : '';
    return '<div class="lad-row ' + (side === 'sell' ? 'a' : 'b') + (isBest ? ' best' : '') + (qty === 0 ? ' empty' : '') + (opts.limit != null && !limitHit && side !== opts.limitSide ? ' out' : '') + '" data-price="' + price + '">' +
      '<span class="sd">' + tag + '</span>' +
      '<span class="pr">' + f.price(price) + '</span>' +
      '<span class="track">' + bar + '</span>' +
      '<span class="qt">' + (qty ? f.group(qty) : '—') + bestTag + '</span>' +
      (opts.limit != null && side !== opts.limitSide && price === opts.limitEdge ? '<span class="lim" aria-hidden="true">限价 ' + f.price(opts.limit) + '</span>' : '') +
      '</div>';
  }

  function mid(book, opts, a, b) {
    const sp = a && b ? '价差 ' + f.price(a.price - b.price) : (a ? '买方没有挂单' : '卖方已无挂单');
    const last = book.last && !opts.noLast
      ? '<span class="lastpill" title="最新成交价是上一笔已经完成的交易，是记录，不能再接"><small>' + esc(opts.lastLabel || '最新成交价 · 记录') + '</small><b>' + f.price(book.last.price) + '</b>' + (book.last.time != null && !opts.noLastTime ? '<small>' + f.clock(book.last.time) + (opts.lastQty !== false ? ' · ' + f.group(book.last.qty) + ' 股' : '') + '</small>' : '') + '</span>'
      : '';
    return '<div class="lad-mid"><span class="spread">' + (opts.showBids === false ? '' : sp) + '</span>' + last + '</div>';
  }

  /** 纯文字表格视图（与阶梯同一份数据）。 */
  function table(book, caption) {
    const L = side => OB.levels(book, side);
    const a = OB.bestAsk(book), b = OB.bestBid(book);
    const rowsA = L('sell').slice().reverse().map(x => tr('卖', x, a));
    const rowsB = L('buy').map(x => tr('买', x, b));
    function tr(s, x, best) {
      return '<tr><td>' + s + '</td><td>' + f.price(x.price) + (best && best.price === x.price ? '（' + s + '一）' : '') + '</td><td>' + f.group(x.qty) + '</td><td>' +
        x.orders.map(o => (o.owner === 'you' ? '你（' + o.id + '）' : esc(who(o.owner))) + ' ' + f.group(o.qty) + (o.time != null ? '（' + f.clock(o.time) + '）' : '')).join('、') + '</td></tr>';
    }
    const gap = '<tr class="gap"><td colspan="4">' + (a && b ? '价差 ' + f.price(a.price - b.price) : '—') + (book.last ? '；最新成交价 ' + f.price(book.last.price) + (book.last.time != null ? '（' + f.clock(book.last.time) + '）' : '') : '') + '</td></tr>';
    return '<table class="data"><caption class="sr">' + esc(caption || '订单簿') + '</caption><thead><tr><th scope="col">方向</th><th scope="col">价格</th><th scope="col">股数</th><th scope="col">订单（提交时间）</th></tr></thead><tbody>' +
      (rowsA.join('') || '<tr><td colspan="4">卖方已无挂单</td></tr>') + gap + (rowsB.join('') || '') + '</tbody></table>';
  }

  window.MPLadder = { render, table, esc };
})();
