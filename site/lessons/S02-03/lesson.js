/* S02-03 的六张图。所有成交由共享撮合引擎 window.MPOrderBook 当场计算；数据在 data.js。不自动播放。 */
(function () {
  'use strict';
  const OB = window.MPOrderBook, D = window.S0203Data;
  const { stepper, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);
  const money = c => (c < 0 ? '−' : '') + OB.fmt.money(Math.abs(c));
  const price = c => OB.fmt.price(c);
  /** 平均价：至少两位小数，最多四位，去掉末尾多余的 0 */
  function avg(totalCents, qty) {
    const v = Math.round(totalCents / qty * 100) / 10000;
    let s = v.toFixed(4).replace(/0+$/, '');
    if (s.split('.')[1].length < 2) s = v.toFixed(2);
    return '$' + s;
  }
  let seq = 0;
  function book(data, extra) {
    return OB.create({
      asks: data.asks.map((a, i) => ({ id: 'A' + i, owner: 'S' + i, price: a[0], qty: a[1], time: i })),
      bids: (data.bids || []).map((b, i) => ({ id: 'B' + i, owner: 'P' + i, price: b[0], qty: b[1], time: i })),
      last: { price: data.last, qty: 100 }
    });
  }
  const order = (s, side, type, qty, px) => OB.submit(s, Object.assign({ id: 'R' + (++seq), owner: 'reader', side, type, qty }, px != null ? { price: px } : {}));

  /** 一笔订单相对中间价的拆分（美分）：价差的一半 + 价格冲击 = 相对中间价多付（买）或少拿（卖）的金额 */
  function split(side, qty, mid, s0) {
    const r = order(s0 || book(D.book), side, 'market', qty).report;
    const best = side === 'buy' ? D.book.asks[0][0] : D.book.bids[0][0];
    const half = Math.abs(best - mid) * r.filledQty;
    const impact = side === 'buy' ? r.totalCents - best * r.filledQty : best * r.filledQty - r.totalCents;
    return { r, half, impact };
  }
  const sec31 = cents => Math.round(cents * D.sec31PerMillion / 1e6);   // 卖出金额（美分）→ 第 31 条折算（美分）

  /** 画一本订单簿（卖方在上，由高到低；买方在下）。marks: {price: 'gone'|'part'|'hit'|'new'} 及剩余股数 */
  function ladder(el, s, opt) {
    opt = opt || {};
    const asks = OB.levels(s, 'sell').slice().reverse(), bids = OB.levels(s, 'buy');
    const orig = opt.orig || {};
    const max = Math.max(1, ...Object.values(orig).map(o => o.qty), ...asks.map(l => l.qty), ...bids.map(l => l.qty));
    const row = (L, side) => {
      const key = side + L.price, o = orig[key], cls = ['lv', side === 'sell' ? 'ask' : 'bid'];
      if (opt.hit === key) cls.push('hit');
      if (opt.fresh && opt.fresh.includes(L.price) && side === 'sell') cls.push('new');
      const was = o && o.qty !== L.qty ? '<s>' + o.qty.toLocaleString('en-US') + '</s> ' : '';
      return '<div class="' + cls.join(' ') + '"><span class="p">' + price(L.price) + '</span><span class="q">' + was + L.qty.toLocaleString('en-US') + '</span><i style="width:' + (L.qty / max * 100).toFixed(1) + '%"></i></div>';
    };
    // 被吃光的档位：原始订单簿里有、现在没有
    const goneRow = (o, k) => ({ p: o.price, h: '<div class="lv ' + (o.side === 'sell' ? 'ask' : 'bid') + ' gone' + (opt.hit === k ? ' hit' : '') + '"><span class="p">' + price(o.price) + '</span><span class="q"><s>' + o.qty.toLocaleString('en-US') + '</s> 0</span><i style="width:0"></i></div>' });
    const gone = side => Object.entries(orig).filter(([k, o]) => o.side === side && !(side === 'sell' ? asks : bids).some(L => side + L.price === k)).map(([k, o]) => goneRow(o, k));
    const askRows = asks.map(L => ({ p: L.price, h: row(L, 'sell') })).concat(gone('sell')).sort((a, b) => b.p - a.p);
    const bidRows = bids.map(L => ({ p: L.price, h: row(L, 'buy') })).concat(gone('buy')).sort((a, b) => b.p - a.p);
    el.innerHTML = '<div class="lh"><span>卖方要价</span><span>股数</span></div>' + askRows.map(x => x.h).join('') +
      '<div class="lmid">' + (opt.midText || '最新成交 ' + price(s.last.price)) + '</div>' +
      (bidRows.length ? bidRows.map(x => x.h).join('') + '<div class="lh"><span>买方出价</span><span></span></div>' : '');
  }
  const origOf = s => { const o = {}; ['sell', 'buy'].forEach(side => OB.levels(s, side).forEach(L => { o[side + L.price] = { side, price: L.price, qty: L.qty }; })); return o; };

  function segBind(fig, cb) {
    let side = 'buy';
    fig.querySelectorAll('[data-side]').forEach(b => b.addEventListener('click', () => {
      side = b.dataset.side;
      fig.querySelectorAll('[data-side]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      cb();
    }));
    return () => side;
  }

  /* ---------- 图 1：三个价格 ---------- */
  (function () {
    const btn = $('fig1-btn'); if (!btn) return;
    const buy = order(book(D.book), 'buy', 'market', 100).report.totalCents;   // 1000200
    const sell = order(book(D.book), 'sell', 'market', 100).report.totalCents; // 999800
    let k = 0;
    function draw() {
      const s = isStatic() ? 2 : k;
      $('fig1-pay').hidden = s < 1; $('fig1-get').hidden = s < 2;
      $('fig1-pay').textContent = '付 ' + money(buy); $('fig1-get').textContent = '得 ' + money(sell);
      $('fig1-ask').classList.toggle('hit', s === 1); $('fig1-bid').classList.toggle('hit', s === 2);
      btn.textContent = s === 0 ? '买 100 股' : s === 1 ? '再马上卖掉' : '已完成来回一趟';
      btn.disabled = s === 2;
      $('fig1-v').textContent = s === 0 ? '价差 = $100.02 − $99.98 = $0.04；中间价 = ($99.98 + $100.02) ÷ 2 = $100.00' :
        s === 1 ? '在卖一买入 100 股：付 ' + money(buy) + '，比中间价多付半个价差 × 100 股 = $2' :
        '来回一趟：−' + OB.fmt.money(buy - sell) + '.00，正好是一个价差 × 100 股';
    }
    btn.addEventListener('click', () => { k = Math.min(2, k + 1); draw(); });
    $('fig1-reset').addEventListener('click', () => { k = 0; draw(); btn.focus(); });
    onMode(draw); draw();
  })();

  /* ---------- 图 2：订单规模与平均价 ---------- */
  (function () {
    const fig = $('fig2'); if (!fig) return;
    const range = $('fig2-q'), svg = $('fig2-svg');
    const curve = side => { const o = []; for (let q = 100; q <= 1000; q += 100) { const r = order(book(D.book), side, 'market', q).report; o.push([q, r.totalCents / q]); } return o; };
    const C = { buy: curve('buy'), sell: curve('sell') };
    const L = 52, R = 344, T = 14, B = 222, Y0 = 9980, Y1 = 10035;
    const sx = q => L + (q - 100) / 900 * (R - L);
    let side;
    function chart(sd, q) {
      const y0 = sd === 'buy' ? 9995 : 9870, y1 = sd === 'buy' ? 10035 : 10005;
      const sy = v => B - (v - y0) / (y1 - y0) * (B - T);
      const ticks = sd === 'buy' ? [10000, 10010, 10020, 10030] : [9880, 9900, 9920, 9940, 9960, 9980, 10000];
      const pts = C[sd].map(([x, v]) => sx(x).toFixed(1) + ',' + sy(v).toFixed(1)).join(' ');
      const cur = C[sd][q / 100 - 1];
      svg.innerHTML = ticks.map(v => '<line x1="' + L + '" x2="' + R + '" y1="' + sy(v) + '" y2="' + sy(v) + '" class="g"/><text x="' + (L - 6) + '" y="' + (sy(v) + 4) + '" class="ax" text-anchor="end">' + (v / 100).toFixed(2) + '</text>').join('') +
        '<line x1="' + L + '" x2="' + R + '" y1="' + sy(10000) + '" y2="' + sy(10000) + '" class="midl"/><text x="' + R + '" y="' + (sy(10000) + (sd === 'buy' ? 14 : -6)) + '" class="ax" text-anchor="end">中间价 $100.00</text>' +
        [100, 400, 700, 1000].map(x => '<text x="' + sx(x) + '" y="' + (B + 16) + '" class="ax" text-anchor="middle">' + x.toLocaleString('en-US') + '</text>').join('') +
        '<text x="' + R + '" y="' + (B + 32) + '" class="ax" text-anchor="end">订单规模（股）</text>' +
        '<polyline points="' + pts + '" class="cv"/>' + C[sd].map(([x, v]) => '<circle cx="' + sx(x) + '" cy="' + sy(v) + '" r="2.5" class="pt"/>').join('') +
        '<circle cx="' + sx(q) + '" cy="' + sy(cur[1]) + '" r="6" class="now"/>';
    }
    function draw() {
      const q = +range.value, sd = side();
      const s0 = book(D.book), res = order(s0, sd, 'market', q), r = res.report;
      const sp = split(sd, q, D.mid);
      const lastFill = r.fills[r.fills.length - 1];
      ladder($('fig2-book'), res.state, { orig: origOf(s0), hit: (sd === 'buy' ? 'sell' : 'buy') + lastFill.price, midText: '中间价 $100.00' });
      $('fig2-qv').textContent = q.toLocaleString('en-US') + ' 股';
      $('fig2-avg').textContent = avg(r.totalCents, q);
      $('fig2-tot').textContent = money(r.totalCents);
      $('fig2-hs').textContent = money(sp.half);
      $('fig2-im').textContent = money(sp.impact);
      $('fig2-last').textContent = price(r.lastAfter.price);
      chart(sd, q);
      range.setAttribute('aria-valuetext', (sd === 'buy' ? '买 ' : '卖 ') + q + ' 股，平均 ' + avg(r.totalCents, q) + '，合计 ' + money(r.totalCents));
    }
    side = segBind(fig, draw);
    range.addEventListener('input', draw);
    draw();
  })();

  /* ---------- 图 3：两本订单簿 ---------- */
  (function () {
    const btn = $('fig3-btn'); if (!btn) return;
    const A0 = book(D.thick), B0 = book(D.thin);
    const ra = order(A0, 'buy', 'market', 1000), rb = order(B0, 'buy', 'market', 1000);
    let on = false;
    const out = r => '<div><dt>合计</dt><dd>' + money(r.totalCents) + '</dd></div><div><dt>平均</dt><dd>' + avg(r.totalCents, 1000).replace(/(\.\d\d)$/, '$10') + '</dd></div><div><dt>最新价</dt><dd>' + price(r.lastAfter.price) + '</dd></div>';
    function draw() {
      const show = on || isStatic();
      ladder($('fig3-a'), show ? ra.state : A0, { orig: origOf(A0) });
      ladder($('fig3-b'), show ? rb.state : B0, { orig: origOf(B0) });
      $('fig3-ra').innerHTML = show ? out(ra.report) : ''; $('fig3-rb').innerHTML = show ? out(rb.report) : '';
      const d = rb.report.totalCents - ra.report.totalCents;
      $('fig3-v').textContent = show ? 'B 比 A 每股多付 $' + (d / 1000 / 100).toFixed(3) + '，1,000 股合计多付 ' + money(d) : '屏幕上的价格一样。按下按钮，看两边各要付多少';
      btn.setAttribute('aria-pressed', String(show));
      btn.textContent = show ? '回到成交之前' : '各市价买 1,000 股';
    }
    btn.addEventListener('click', () => { on = !on; draw(); });
    onMode(draw); draw();
  })();

  /* ---------- 图 4：先买一半，等一等 ---------- */
  (function () {
    const el = $('fig4'); if (!el) return;
    const s0 = book(D.book), orig = origOf(s0);
    const once = order(s0, 'buy', 'market', 1000).report.totalCents;
    const first = order(s0, 'buy', 'market', 500);
    let sA = first.state;
    D.refill.forEach((n, i) => { sA = OB.submit(sA, { id: 'N' + i, owner: n[2], side: 'sell', type: 'limit', price: n[0], qty: n[1] }).state; });
    const secA = order(sA, 'buy', 'market', 500), secB = order(first.state, 'buy', 'market', 500);
    const P = { A: { mid: sA, sec: secA }, B: { mid: first.state, sec: secB } };
    let pick = null;
    const pickBox = $('fig4-pick'), tots = $('fig4-tots');
    const fresh = D.refill.map(n => n[0]);
    const T = {
      once: '一次买完 1,000 股：' + money(once),
      A: '分两批、有恢复：' + money(first.report.totalCents + secA.report.totalCents) + '（平均 ' + avg(first.report.totalCents + secA.report.totalCents, 1000) + '，少付 ' + money(once - first.report.totalCents - secA.report.totalCents) + '）',
      B: '分两批、无恢复：' + money(first.report.totalCents + secB.report.totalCents)
    };
    const steps = [
      { label: '原始订单簿', what: '卖一 $100.02 × 200，后面每档 200 股。', why: '小林不一次买 1,000 股，先买一半。', learn: '这和开场是同一本订单簿。' },
      { label: '第一批 500 股', what: '吃掉 $100.02、$100.12 两档，再在 $100.28 吃掉 100 股：合计 ' + money(first.report.totalCents) + '。', why: '最新价变成 ' + price(first.report.lastAfter.price) + '。', learn: '卖方只剩 $100.28 × 100、$100.45 × 200、$100.63 × 200。' },
      { label: '等一等', what: '选一种情形：等待期间有没有人补挂卖单？', why: '补挂多少、多快补挂，取决于市场。', learn: '拆单本身不会让卖方变多，只是给了卖方补挂的时间。' },
      { label: '第二批 500 股', what: '', why: '', learn: '' },
      { label: '三个合计', what: T.once + '；' + T.A + '；' + T.B + '。', why: '只有订单簿在间隔里恢复，拆单才更便宜。', learn: '等待也有风险：价格可能朝不利的方向走。' }
    ];
    function step3() {
      const s = steps[3];
      if (pick === 'A') { s.what = '按 $100.06、$100.12、$100.28 依次成交：合计 ' + money(secA.report.totalCents) + '。'; s.why = '新挂出的卖单比原来剩下的档位便宜。'; s.learn = T.A + '。'; }
      else if (pick === 'B') { s.what = '只能吃原来剩下的档位：合计 ' + money(secB.report.totalCents) + '。'; s.why = '没有人补挂新单。'; s.learn = T.B + '，和一次买完一样。'; }
      else { s.what = '第二批 500 股按当时的订单簿成交。'; s.why = '有人补挂时合计 ' + money(secA.report.totalCents) + '；没有人补挂时合计 ' + money(secB.report.totalCents) + '。'; s.learn = '两批加起来分别是 ' + money(first.report.totalCents + secA.report.totalCents) + ' 和 ' + money(first.report.totalCents + secB.report.totalCents) + '。'; }
    }
    let S;
    function render(i, st) {
      const k = st ? 'A' : pick;
      pickBox.querySelectorAll('button').forEach(b => { b.disabled = !st && i < 2; b.setAttribute('aria-pressed', String(b.dataset.k === k)); });
      let s = s0, hit = null, fr = null, mid = null;
      if (i >= 1) { s = first.state; hit = 'sell' + first.report.lastAfter.price; }
      if (i >= 2 && k) { s = P[k].mid; hit = null; if (k === 'A') fr = fresh; }
      if (i >= 3 && k) { s = P[k].sec.state; hit = 'sell' + P[k].sec.report.lastAfter.price; }
      if (st) { s = secA.state; hit = null; fr = fresh; mid = '情形一（有人补挂）第二批之后'; }
      const o = Object.assign({}, orig); if (fr && k === 'A') fr.forEach(p => { if (!o['sell' + p]) o['sell' + p] = { side: 'sell', price: p, qty: 200 }; });
      ladder($('fig4-book'), s, { orig: o, hit, fresh: fr, midText: mid || '最新成交 ' + price(s.last.price) });
      const rows = [];
      if (st || i >= 4) rows.push(['一次买完', money(once)], ['分两批、有恢复', money(first.report.totalCents + secA.report.totalCents)], ['分两批、无恢复', money(first.report.totalCents + secB.report.totalCents)]);
      else if (i >= 1) rows.push(['第一批 500 股', money(first.report.totalCents)]);
      if (!st && i === 3 && k) rows.push(['第二批 500 股', money(P[k].sec.report.totalCents)]);
      tots.innerHTML = rows.map(r => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('');
    }
    step3();
    S = stepper(el, {
      steps,
      render,
      after(i, b) { if (i === 2 && !pick) b.next.disabled = true; },
      reset() { pick = null; step3(); }
    });
    pickBox.addEventListener('click', e => {
      const b = e.target.closest('button[data-k]'); if (!b || b.disabled) return;
      pick = b.dataset.k; step3(); S.show(S.step);
      el.querySelector('[data-a=next]').focus();
    });
  })();

  /* ---------- 图 5：成本拆开来 ---------- */
  (function () {
    const fig = $('fig5'); if (!fig) return;
    const range = $('fig5-q');
    let side;
    function draw() {
      const q = +range.value, sd = side(), sp = split(sd, q, D.mid);
      const fee = sd === 'sell' ? sec31(sp.r.totalCents) : 0;
      const tot = sp.half + sp.impact + fee;
      const scale = Math.max(tot, 1);
      const seg = (cls, v, label) => v > 0 ? '<i class="' + cls + '" style="width:' + (v / scale * 100).toFixed(2) + '%"><span>' + (v / scale > 0.14 ? label + ' ' + money(v) : '') + '</span></i>' : '';
      $('fig5-bar').innerHTML = seg('hs', sp.half, '价差一半') + seg('im', sp.impact, '冲击') + seg('fee', fee, '');
      $('fig5-qv').textContent = q.toLocaleString('en-US') + ' 股';
      $('fig5-hs').textContent = money(sp.half);
      $('fig5-im').textContent = money(sp.impact);
      $('fig5-fee').textContent = sd === 'sell' ? '约 ' + money(fee) : '按收费表另计';
      $('fig5-feenote').textContent = sd === 'sell' ?
        '卖出金额 ' + money(sp.r.totalCents) + '，按 SEC 2026-04-04 起的费率 $20.60 / 百万美元折算约 ' + money(fee) + '，由券商按其收费表收取。' :
        '买入不涉及第 31 条费用；佣金取决于券商，图中不假设。';
      range.setAttribute('aria-valuetext', (sd === 'buy' ? '买 ' : '卖 ') + q + ' 股：价差一半 ' + money(sp.half) + '，冲击 ' + money(sp.impact) + (sd === 'sell' ? '，第 31 条折算约 ' + money(fee) : ''));
    }
    side = segBind(fig, draw);
    range.addEventListener('input', draw);
    draw();
  })();

  /* ---------- 图 6：选哪种订单 ---------- */
  const NAMES = { market: '市价单', limit: '限价单', split: '拆开分批' };
  const WHY = [
    '市价单。订单小、股票活跃，代价约为半个价差。',
    '限价单。你在乎的是价格，愿意接受买不到。',
    '限价单或拆开分批。5,000 股比卖一后面所有挂单加起来还多，市价单会吃穿整本订单簿；用限价控制最高价，或分时执行，同时接受可能成交不全。',
    '限价单。价差宽、深度浅，市价单马上就要多付约 $0.25 / 股（半个价差），还可能吃到更远的档位。'
  ];
  (function () {
    const fig = $('fig6'); if (!fig) return;
    const lim = order(book(D.book), 'buy', 'limit', 1000, 10010).report;
    const demo = $('fig6-demo');
    demo.innerHTML = '<b>演示：限价 $100.10 买 1,000 股远帆科技</b>引擎从卖一开始找：$100.02 × 200 在界限之内，成交；下一档 $100.12 超过界限，停下。成交 ' + lim.filledQty + ' 股，合计 ' + money(lim.totalCents) + '；剩下 ' + lim.rested.qty + ' 股以 ' + price(lim.rested.price) + ' 挂进订单簿，成为新的买一。';
    fig.querySelectorAll('.sc').forEach((c, i) => {
      const ok = c.dataset.ok.split(' '), fb = c.querySelector('.sc-fb'), hint = c.querySelector('.sc-hint'), ans = c.querySelector('.sc-ans');
      ans.innerHTML = '<b>参考答案：</b>' + WHY[i];
      const showAns = () => { hint.hidden = true; ans.hidden = false; c.dataset.state = 'shown'; if (i === 1) demo.hidden = false; };
      c.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'show') { fb.hidden = true; showAns(); return; }
        const sel = c.querySelector('input:checked');
        fb.hidden = false;
        if (!sel) { fb.textContent = '先选一种订单。'; return; }
        if (ok.includes(sel.value)) { fb.innerHTML = '<b>可以。</b>'; showAns(); c.dataset.state = 'right'; }
        else { fb.innerHTML = '<b>' + NAMES[sel.value] + '的代价在这里可能偏大。</b>看看提示，再选一次。'; hint.hidden = false; ans.hidden = true; c.dataset.state = 'wrong'; }
      });
      c.querySelectorAll('input').forEach(x => x.addEventListener('change', () => { if (i === 1 && x.value === 'limit') demo.hidden = false; }));
    });
    const st = s => { if (s) { demo.hidden = false; fig.querySelectorAll('.sc-ans').forEach(a => { a.hidden = false; }); } };
    st(isStatic()); onMode(st);
  })();

  window.S0203 = { avg, split, sec31, book, order };
})();
