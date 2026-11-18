/* S02-02 课文页：五张教学图、九道小题、选读卡片里的集合竞价小图。
 * 图沿用原型 v4（proto-v4/）的组件：
 *   - 网页版分步出现，不自动播放：读者点「播放」或「下一步」才往下走，可暂停、上一步、重来；
 *   - 系统开启「减少动态效果」、打印或导出 PDF 时，显示静态版：所有步骤画在同一张图上，用圈号标出先后。
 * 订单簿数据来自 model.js 的初始订单簿；图 3、图 4 的成交和图 5 的合并报价由撮合引擎实时计算。
 * 原型中的图 5「厚与薄」留给 S02-03，保存在 proto-v4/，本课不再使用。 */
(function () {
  'use strict';
  const OB = window.MPOrderBook, M = window.S0202, f = OB.fmt;
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let MODE = reduceMq.matches ? 'static' : 'anim';
  const figs = [];
  const CIRC = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
  const book = OB.create(M.INITIAL);
  const asks = OB.levels(book, 'sell').slice().sort((a, b) => a.price - b.price); // 低 → 高
  const bids = OB.levels(book, 'buy').slice().sort((a, b) => b.price - a.price);  // 高 → 低
  const last = book.last;

  /* ---------- 通用分步器 ---------- */
  function stepper(el, cfg) {
    const ctrl = el.querySelector('.pf-ctrl'), list = el.querySelector('.pf-steps');
    const title = (el.querySelector('.pf-hd') || el).textContent.replace(/\s+/g, ' ').trim();
    ctrl.setAttribute('role', 'group');
    ctrl.setAttribute('aria-label', title + '：播放控制');
    ctrl.innerHTML = '<button type="button" class="pri" data-a="play">▶ 播放</button><button type="button" data-a="prev">← 上一步</button><button type="button" data-a="next">下一步 →</button><button type="button" data-a="again">↺ 重来</button><span class="cnt" aria-hidden="true"></span>';
    const now = document.createElement('p'); now.className = 'pf-now'; now.setAttribute('aria-live', 'polite');
    ctrl.before(now);
    list.innerHTML = cfg.steps.filter(s => s.badge).map(s => '<li><b>' + s.badge + '</b><span>' + s.text + '</span></li>').join('');
    const n = cfg.steps.length;
    let step = 1, timer = null;
    const btn = a => ctrl.querySelector('[data-a=' + a + ']');

    function show(k) {
      step = Math.max(1, Math.min(n, k));
      cfg.apply(step, false);
      const s = cfg.steps[step - 1];
      now.innerHTML = '<span class="sr">第 ' + step + ' 步，共 ' + n + ' 步。</span>' + (s.badge ? '<b class="nb">' + s.badge + '</b> ' : '') + s.text;
      ctrl.querySelector('.cnt').textContent = '第 ' + step + ' / ' + n + ' 步';
      btn('prev').disabled = step === 1; btn('next').disabled = step === n;
      el.dataset.step = step;
    }
    function stop() { clearInterval(timer); timer = null; btn('play').textContent = '▶ 播放'; btn('play').setAttribute('aria-pressed', 'false'); }
    function play() {
      if (step === n) show(1);
      btn('play').textContent = '⏸ 暂停'; btn('play').setAttribute('aria-pressed', 'true');
      clearInterval(timer);
      timer = setInterval(() => { if (step >= n) return stop(); show(step + 1); }, cfg.delay || 2600);
    }
    ctrl.addEventListener('click', e => {
      const a = e.target.closest('button'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'play') return timer ? stop() : play();
      stop();
      if (act === 'prev') show(step - 1);
      if (act === 'next') show(step + 1);
      if (act === 'again') show(1);
    });
    stop();

    const F = {
      el,
      reset() {
        stop();
        if (MODE === 'static') { cfg.apply(n, true); el.dataset.step = 'static'; }
        else show(1);
      },
      rerender() { cfg.render(); MODE === 'static' ? cfg.apply(n, true) : show(step); }
    };
    cfg.render();
    figs.push(F);
    return F;
  }

  /* ---------- 图 1：两支队伍（买一、卖一、最新成交价） ---------- */
  function queues(el) {
    const stage = el.querySelector('.pf-stage');
    const mq = window.matchMedia('(max-width:620px)');
    const S = [
      { text: '想卖北岭电池的人，各自开出了要价。先别急着看答案，点「下一步」看他们怎么排队。' },
      { badge: '①', text: '他们排成一队：<b>要价越低，越排在前面</b>（靠近中间）。' },
      { badge: '②', text: '排在最前面的要价，就是此刻能买到的最低价格，叫<b>最优卖价</b>（best ask），行情软件标作<b>卖一</b>：$50.02。卖一是一档价格，这一档一共挂着 200 股。' },
      { badge: '③', text: '想买的人也排成一队：<b>出价越高，越排在前面</b>。' },
      { badge: '④', text: '排在最前面的出价，叫<b>最优买价</b>（best bid），行情软件标作<b>买一</b>：$50.00。这一档一共 300 股，其实是两张订单加起来的。' },
      { badge: '⑤', text: '两个队首之间差了 $0.02，这叫<b>买卖价差</b>（bid-ask spread）。' },
      { badge: '⑥', text: '在这本订单簿里，你想<b>马上买</b>，就得接受卖一，付 $50.02；想<b>马上卖</b>，就得接受买一，得 $50.00。' },
      { badge: '⑦', text: '屏幕上的大号数字 $50.01 落在空档里。它是 09:59:58 那笔交易的成交小票，叫<b>最新成交价</b>（last price）：是记录，不是报价，此刻没有人在 $50.01 排队。' }
    ];
    const cfg = { steps: S, delay: 2800 };
    const B = (x, y, k) => '<g class="badge"><circle cx="' + x + '" cy="' + y + '" r="10" fill="#111827"/><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="12" fill="#D4FF3A" class="num">' + CIRC[k] + '</text></g>';
    const arrowDef = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#5F6878"/></marker><marker id="ahv" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#4B33C9"/></marker><marker id="ahk" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#111827"/></marker></defs>';

    cfg.render = function () {
      const V = mq.matches;
      let g = arrowDef;
      if (!V) {
        /* 横向：价格轴左低右高 */
        const W = 760, H = 340, ay = 214;
        const x = p => 70 + (p - 4995) * 56.36;
        g += '<line x1="40" x2="724" y1="' + ay + '" y2="' + ay + '" stroke="#C9CED8" stroke-width="2"/>';
        g += '<text x="40" y="' + (ay + 16) + '" font-size="11" fill="#9AA1AD">← 价格更低</text><text x="724" y="' + (ay + 16) + '" font-size="11" fill="#9AA1AD" text-anchor="end">价格更高 →</text>';
        const perm = [5004, 5006, 5002, 5003];
        asks.forEach((L, i) => {
          const dx = x(perm[i]) - x(L.price);
          g += '<g class="st" data-s="1"><g class="mv" data-m="2" data-from="' + dx + ',-150">' + card(x(L.price) - 25, ay - 54, 50, 48, L, 'sell', false) + '</g></g>';
        });
        bids.forEach(L => { g += '<g class="st" data-s="4">' + card(x(L.price) - 25, ay - 54, 50, 48, L, 'buy', false) + '</g>'; });
        g += '<g class="st" data-s="2"><line x1="704" x2="472" y1="92" y2="92" stroke="#4B33C9" stroke-width="2" marker-end="url(#ahv)"/><text x="588" y="82" font-size="12.5" font-weight="700" fill="#4B33C9" text-anchor="middle">卖方队伍：要价低的排前面</text>' + B(718, 92, 1) + '</g>';
        g += '<g class="st" data-s="3"><rect x="' + (x(5002) - 29) + '" y="' + (ay - 58) + '" width="58" height="56" rx="11" fill="none" stroke="#D4FF3A" stroke-width="5"/><text x="' + (x(5002) - 24) + '" y="' + (ay - 82) + '" font-size="13.5" font-weight="900" fill="#111827">卖一</text><text x="' + (x(5002) - 24) + '" y="' + (ay - 65) + '" font-size="11.5" fill="#5F6878">best ask</text>' + B(x(5002) + 112, ay - 86, 2) + '</g>';
        g += '<g class="st" data-s="4"><line x1="56" x2="372" y1="92" y2="92" stroke="#111827" stroke-width="2" marker-end="url(#ahk)"/><text x="214" y="82" font-size="12.5" font-weight="700" fill="#111827" text-anchor="middle">买方队伍：出价高的排前面</text>' + B(42, 92, 3) + '</g>';
        g += '<g class="st" data-s="5"><rect x="' + (x(5000) - 29) + '" y="' + (ay - 58) + '" width="58" height="56" rx="11" fill="none" stroke="#D4FF3A" stroke-width="5"/><text x="' + (x(5000) + 24) + '" y="' + (ay - 82) + '" font-size="13.5" font-weight="900" fill="#111827" text-anchor="end">买一</text><text x="' + (x(5000) + 24) + '" y="' + (ay - 65) + '" font-size="11.5" fill="#5F6878" text-anchor="end">best bid</text>' + B(x(5000) - 112, ay - 86, 4) + '</g>';
        const sx1 = x(5000) + 27, sx2 = x(5002) - 27, mx = (sx1 + sx2) / 2;
        g += '<g class="st" data-s="6"><path d="M' + sx1 + ' ' + (ay + 8) + ' v8 H' + sx2 + ' v-8" fill="none" stroke="#111827" stroke-width="2"/><text x="' + mx + '" y="' + (ay + 34) + '" font-size="12.5" font-weight="800" text-anchor="middle" fill="#111827">价差 $0.02</text><text x="' + mx + '" y="' + (ay + 49) + '" font-size="11" text-anchor="middle" fill="#5F6878">spread</text>' + B(mx, ay + 64, 5) + '</g>';
        g += '<g class="st" data-s="7"><path d="M' + (mx + 14) + ' ' + (ay + 92) + ' L' + (x(5002) - 2) + ' ' + (ay + 4) + '" stroke="#4B33C9" stroke-width="2.5" marker-end="url(#ahv)"/><path d="M' + (mx - 14) + ' ' + (ay + 92) + ' L' + (x(5000) + 2) + ' ' + (ay + 4) + '" stroke="#111827" stroke-width="2.5" marker-end="url(#ahk)"/>' +
          '<circle cx="' + mx + '" cy="' + (ay + 102) + '" r="16" fill="#D4FF3A" stroke="#111827" stroke-width="2.5"/><text x="' + mx + '" y="' + (ay + 107) + '" font-size="13" font-weight="900" text-anchor="middle">你</text>' +
          '<text x="' + (mx + 26) + '" y="' + (ay + 100) + '" font-size="12.5" font-weight="700" fill="#4B33C9">马上买 → 付 $50.02</text><text x="' + (mx - 26) + '" y="' + (ay + 100) + '" font-size="12.5" font-weight="700" fill="#111827" text-anchor="end">马上卖 → 得 $50.00</text>' + B(mx + 166, ay + 96, 6) + '</g>';
        g += '<g class="st" data-s="8"><line x1="' + x(5001) + '" x2="' + x(5001) + '" y1="54" y2="' + (ay - 2) + '" stroke="#111827" stroke-width="1.5" stroke-dasharray="4 4"/><rect x="' + (x(5001) - 74) + '" y="16" width="148" height="40" rx="20" fill="#fff" stroke="#111827" stroke-width="2" stroke-dasharray="6 4"/><text x="' + x(5001) + '" y="34" text-anchor="middle" font-size="14" class="num">$50.01</text><text x="' + x(5001) + '" y="49" text-anchor="middle" font-size="10.5" fill="#5F6878">09:59:58 已成交 · 记录</text>' + B(x(5001) + 88, 36, 7) + '</g>';
        stage.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + alt() + '">' + g + '</svg>';
      } else {
        /* 竖向（手机）：价格轴下低上高，就是订单簿的样子 */
        const W = 380, H = 610, ax = 150;
        const y = p => 565 - (p - 4995) * 45.45;
        g += '<line x1="' + ax + '" x2="' + ax + '" y1="30" y2="590" stroke="#C9CED8" stroke-width="2"/>';
        g += '<text x="' + (ax + 6) + '" y="24" font-size="10.5" fill="#9AA1AD">↑ 价格更高</text><text x="' + (ax + 6) + '" y="606" font-size="10.5" fill="#9AA1AD">↓ 价格更低</text>';
        const perm = [5004, 5006, 5002, 5003];
        asks.forEach((L, i) => {
          const dy = y(perm[i]) - y(L.price);
          g += '<g class="st" data-s="1"><g class="mv" data-m="2" data-from="120,' + dy + '">' + card(ax + 8, y(L.price) - 19, 96, 38, L, 'sell', true) + '</g></g>';
        });
        bids.forEach(L => { g += '<g class="st" data-s="4">' + card(ax + 8, y(L.price) - 19, 96, 38, L, 'buy', true) + '</g>'; });
        g += '<g class="st" data-s="2"><line x1="132" x2="132" y1="52" y2="234" stroke="#4B33C9" stroke-width="2" marker-end="url(#ahv)"/><text x="122" y="112" font-size="12" font-weight="700" fill="#4B33C9" text-anchor="end">卖方队伍</text><text x="122" y="128" font-size="11.5" fill="#4B33C9" text-anchor="end">要价低的</text><text x="122" y="143" font-size="11.5" fill="#4B33C9" text-anchor="end">排前面</text>' + B(132, 40, 1) + '</g>';
        g += '<g class="st" data-s="3"><rect x="' + (ax + 4) + '" y="' + (y(5002) - 23) + '" width="104" height="46" rx="11" fill="none" stroke="#D4FF3A" stroke-width="5"/><text x="' + (ax + 132) + '" y="' + (y(5002) - 3) + '" font-size="12.5" font-weight="900">卖一</text><text x="' + (ax + 132) + '" y="' + (y(5002) + 13) + '" font-size="11" fill="#5F6878">best ask</text>' + B(ax + 120, y(5002) - 7, 2) + '</g>';
        g += '<g class="st" data-s="4"><line x1="132" x2="132" y1="580" y2="356" stroke="#111827" stroke-width="2" marker-end="url(#ahk)"/><text x="122" y="470" font-size="12" font-weight="700" fill="#111827" text-anchor="end">买方队伍</text><text x="122" y="486" font-size="11.5" fill="#111827" text-anchor="end">出价高的</text><text x="122" y="501" font-size="11.5" fill="#111827" text-anchor="end">排前面</text>' + B(132, 594, 3) + '</g>';
        g += '<g class="st" data-s="5"><rect x="' + (ax + 4) + '" y="' + (y(5000) - 23) + '" width="104" height="46" rx="11" fill="none" stroke="#D4FF3A" stroke-width="5"/><text x="' + (ax + 132) + '" y="' + (y(5000) - 3) + '" font-size="12.5" font-weight="900">买一</text><text x="' + (ax + 132) + '" y="' + (y(5000) + 13) + '" font-size="11" fill="#5F6878">best bid</text>' + B(ax + 120, y(5000) - 7, 4) + '</g>';
        const sy1 = y(5002) + 23, sy2 = y(5000) - 23, my = (sy1 + sy2) / 2;
        g += '<g class="st" data-s="6"><path d="M' + (ax + 112) + ' ' + sy1 + ' h8 V' + sy2 + ' h-8" fill="none" stroke="#111827" stroke-width="2"/><text x="' + (ax + 132) + '" y="' + (my - 2) + '" font-size="12" font-weight="800">价差 $0.02</text><text x="' + (ax + 132) + '" y="' + (my + 13) + '" font-size="10.5" fill="#5F6878">spread</text>' + B(ax + 216, my - 6, 5) + '</g>';
        g += '<g class="st" data-s="7"><circle cx="40" cy="' + my + '" r="16" fill="#D4FF3A" stroke="#111827" stroke-width="2.5"/><text x="40" y="' + (my + 5) + '" font-size="13" font-weight="900" text-anchor="middle">你</text>' +
          '<path d="M56 ' + (my - 8) + ' L' + (ax + 4) + ' ' + (y(5002) + 6) + '" stroke="#4B33C9" stroke-width="2.5" marker-end="url(#ahv)"/><path d="M56 ' + (my + 8) + ' L' + (ax + 4) + ' ' + (y(5000) - 6) + '" stroke="#111827" stroke-width="2.5" marker-end="url(#ahk)"/>' +
          '<text x="8" y="' + (y(5002) - 4) + '" font-size="11.5" font-weight="700" fill="#4B33C9">马上买</text><text x="8" y="' + (y(5002) + 11) + '" font-size="11.5" font-weight="700" fill="#4B33C9">付 $50.02</text>' +
          '<text x="8" y="' + (y(5000) + 2) + '" font-size="11.5" font-weight="700" fill="#111827">马上卖</text><text x="8" y="' + (y(5000) + 17) + '" font-size="11.5" font-weight="700" fill="#111827">得 $50.00</text>' + B(14, my - 24, 6) + '</g>';
        g += '<g class="st" data-s="8"><rect x="' + (ax + 8) + '" y="' + (my - 14) + '" width="96" height="28" rx="14" fill="#fff" stroke="#111827" stroke-width="2" stroke-dasharray="5 4"/><text x="' + (ax + 56) + '" y="' + (my + 5) + '" text-anchor="middle" font-size="12" class="num">$50.01 已成交</text>' + B(ax - 4, my, 7) + '</g>';
        stage.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + alt() + '">' + g + '</svg>';
      }
    };
    function card(x0, y0, w, h, L, side, V) {
      const fill = side === 'sell' ? '#7A5CFF' : '#111827';
      if (!V) {
        return '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="9" fill="' + fill + '"/>' +
          '<text x="' + (x0 + w / 2) + '" y="' + (y0 + 20) + '" text-anchor="middle" font-size="12.5" fill="#fff" class="num">' + f.price(L.price) + '</text>' +
          '<text x="' + (x0 + w / 2) + '" y="' + (y0 + 37) + '" text-anchor="middle" font-size="11" fill="#DADFF0">' + f.group(L.qty) + ' 股</text>';
      }
      return '<rect x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + h + '" rx="8" fill="' + fill + '"/>' +
        '<text x="' + (x0 + 8) + '" y="' + (y0 + 16) + '" font-size="13" fill="#fff" class="num">' + f.price(L.price) + '</text>' +
        '<text x="' + (x0 + 8) + '" y="' + (y0 + 31) + '" font-size="10.5" fill="#DADFF0">' + f.group(L.qty) + ' 股</text>';
    }
    function alt() {
      return '卖方按要价从低到高排队，排在最前面的一档是卖一 $50.02，共 200 股；买方按出价从高到低排队，排在最前面的一档是买一 $50.00，共 300 股；两者相差 $0.02，是买卖价差。马上买付 $50.02，马上卖得 $50.00。最新成交价 $50.01 是 09:59:58 的成交记录，此刻没有人在这个价格报价。';
    }
    cfg.apply = function (step, isStatic) {
      const svg = stage.querySelector('svg'); if (!svg) return;
      svg.querySelectorAll('.st').forEach(e => e.classList.toggle('on', isStatic || +e.dataset.s <= step));
      svg.querySelectorAll('.mv').forEach(e => {
        const done = isStatic || step >= +e.dataset.m;
        const [dx, dy] = e.dataset.from.split(',').map(Number);
        e.style.transform = done ? 'translate(0px,0px)' : 'translate(' + dx + 'px,' + dy + 'px)';
      });
    };
    const F = stepper(el, cfg);
    mq.addEventListener('change', () => F.rerender());
    return F;
  }

  /* ---------- 共用小工具 ---------- */
  const BN = k => '<span class="badge"><b class="bn">' + CIRC[k] + '</b></span>';
  function stOn(stage, step, isStatic) {
    stage.querySelectorAll('.st').forEach(e => e.classList.toggle('on', isStatic || +e.dataset.s <= step));
  }
  function fillsBy(report) { const o = {}; report.fills.forEach(x => { o[x.price] = (o[x.price] || 0) + x.qty; }); return o; }

  /* ---------- 图 2：订单簿（把两支队伍竖起来） ---------- */
  function bookFig(el) {
    const stage = el.querySelector('.pf-stage');
    const S = [
      { text: '把图 1 的两支队伍竖起来：<b>卖方放上面，买方放下面</b>。每一行是一个价格，横条越长，这个价格上挂的股数越多。' },
      { badge: '①', text: '中间两行是两队最前面的一档：上面是<b>卖一</b> $50.02 × 200，下面是<b>买一</b> $50.00 × 300。中间的空档就是价差 $0.02。' },
      { badge: '②', text: '往上看：卖方队伍后面的人，<b>要价一个比一个高</b>。' },
      { badge: '③', text: '往下看：买方队伍后面的人，<b>出价一个比一个低</b>。' },
      { badge: '④', text: '最新成交价 $50.01 落在中间的空档里：它只是 09:59:58 那笔成交的记录，此刻没有人在这个价格排队。' }
    ];
    const cfg = { steps: S, delay: 3000 };
    const max = Math.max(...asks.concat(bids).map(L => L.qty));
    cfg.render = function () {
      const sells = asks.slice().reverse();
      let h = '';
      const row = (L, side, r, best) =>
        '<span class="bk-p st' + (best ? ' best' : '') + '" data-s="1" style="grid-row:' + r + '">' + f.price(L.price) + '</span>' +
        '<span class="bk-bar ' + side + ' st' + (best ? ' best' : '') + '" data-s="1" style="grid-row:' + r + '"><i style="width:' + (L.qty / max * 100).toFixed(1) + '%"></i></span>' +
        '<span class="bk-q st" data-s="1" style="grid-row:' + r + '">' + f.group(L.qty) + ' 股</span>';
      sells.forEach((L, i) => { h += row(L, 'sell', i + 1, i === sells.length - 1); });
      const g = sells.length + 1;
      bids.forEach((L, i) => { h += row(L, 'buy', g + 1 + i, i === 0); });
      h += '<span class="bk-tag st" data-s="2" style="grid-row:' + (g - 1) + '"><b>卖一</b>best ask</span>';
      h += '<span class="bk-tag st" data-s="2" style="grid-row:' + (g + 1) + '"><b>买一</b>best bid</span>';
      h += '<div class="bk-gap" style="grid-row:' + g + '"><span class="st bk-sp" data-s="2">' + BN(1) + '价差 $0.02（spread）</span><span class="st bk-rc" data-s="5">' + BN(4) + '$50.01 · 09:59:58 已成交 · 记录，不是报价</span></div>';
      h += '<div class="bk-ann up st" data-s="3" style="grid-row:1/' + g + '"><i class="arw"></i><span>' + BN(2) + '<span class="lg">往上：<br>卖方后面的人<br>要价更高</span><span class="sm">往上<br>要价<br>更高</span></span></div>';
      h += '<div class="bk-ann dn st" data-s="4" style="grid-row:' + (g + 1) + '/' + (g + 1 + bids.length) + '"><i class="arw"></i><span>' + BN(3) + '<span class="lg">往下：<br>买方后面的人<br>出价更低</span><span class="sm">往下<br>出价<br>更低</span></span></div>';
      stage.innerHTML = '<div class="bk" role="img" aria-label="订单簿：卖方在上，从高到低依次是 $50.06 600 股、$50.04 400 股、$50.03 300 股、$50.02 200 股（卖一）；买方在下，依次是 $50.00 300 股（买一）、$49.99 500 股、$49.97 400 股、$49.95 800 股。卖一和买一之间是价差 $0.02，最新成交价 $50.01 落在空档里。">' + h + '</div>';
    };
    cfg.apply = function (step, isStatic) {
      stOn(stage, step, isStatic);
      stage.querySelector('.bk').classList.toggle('lit', isStatic || step >= 2);
    };
    return stepper(el, cfg);
  }

  /* ---------- 图 3：小林的 600 股 ---------- */
  function climb(el) {
    const stage = el.querySelector('.pf-stage');
    const r = OB.submit(book, { id: 'XL', owner: 'you', side: 'buy', type: 'market', qty: 600, time: OB.T(10, 0, 0) });
    const rep = r.report;
    const byPrice = {}; rep.fills.forEach(x => { byPrice[x.price] = (byPrice[x.price] || 0) + x.amount; });
    const filledBy = {}; rep.fills.forEach(x => { filledBy[x.makerId] = (filledBy[x.makerId] || 0) + x.qty; });
    const avg = f.avg(rep.totalCents, rep.filledQty).text;
    const rows = asks.slice().reverse(); // 高 → 低
    const tOf = id => f.clock(book.asks.find(o => o.id === id).time);
    const S = [
      { text: '小林的市价单要买 <b>600 股</b>。卖一 $50.02 只有 B 的 200 股，不够。点「下一步」，看撮合引擎怎样往上找。' },
      { badge: '①', text: '先买 <b>$50.02</b>：B 的 200 股全部成交，' + f.money(byPrice[5002]) + '。还差 <b>400 股</b>。' },
      { badge: '②', text: '往上一档 <b>$50.03</b>：有 C 和 G 两张订单。同一价格，先来的先成交（时间优先）：C 在 ' + tOf('C') + ' 挂单，G 在 ' + tOf('G') + '，所以先 C 100 股，再 G 200 股，共 ' + f.money(byPrice[5003]) + '。还差 <b>100 股</b>。' },
      { badge: '③', text: '再往上 <b>$50.04</b>：D 有 400 股，小林只买 100 股，' + f.money(byPrice[5004]) + '。D 剩下的 300 股继续挂着，这叫<b>部分成交</b>。' },
      { badge: '④', text: '合计 <b>' + f.money(rep.totalCents) + '</b>，平均每股 <b>' + avg + '</b>。最新成交价只记最后一笔：屏幕上的数字从 $50.01 变成 <b>' + f.price(rep.lastAfter.price) + '</b>。' }
    ];
    const notes = {
      5002: { k: 2, html: '<span class="badge"><b>①</b></span>买 B 200 股 · ' + f.money(byPrice[5002]) + ' <em>还差 400</em>' },
      5003: { k: 3, html: '<span class="badge"><b>②</b></span>先 C 100 股（' + tOf('C') + ' 先到），再 G 200 股（' + tOf('G') + '）· ' + f.money(byPrice[5003]) + ' <em>还差 100</em>' },
      5004: { k: 4, html: '<span class="badge"><b>③</b></span>只买 D 100 股 · ' + f.money(byPrice[5004]) + ' <em>D 剩 300，部分成交</em>' }
    };
    const cfg = { steps: S, delay: 3200 };
    cfg.render = function () {
      const rowHtml = rows.map(L => {
        const segs = L.orders.map(o => {
          const w = (o.qty / 600 * 100).toFixed(2);
          if (o.id === 'D') {
            const cut = filledBy.D || 0;
            return '<span class="cl-dw" style="flex:0 0 calc(' + w + '% - 3px)"><span class="cl-seg cut" data-cut="D" style="flex-basis:' + (cut / o.qty * 100) + '%">D ' + cut + '</span><span class="cl-seg cl-rest" data-rest="D" data-a="D ' + o.qty + '" data-b="D 剩 ' + (o.qty - cut) + '">D ' + o.qty + '</span></span>';
          }
          return '<span class="cl-seg" data-id="' + o.id + '" style="flex:0 0 calc(' + w + '% - 3px)">' + o.id + ' ' + o.qty + '</span>';
        }).join('');
        const n = notes[L.price];
        return '<div class="cl-row' + (L.price === 5002 ? ' best' : '') + '" data-p="' + L.price + '"><span class="cl-p">' + f.price(L.price) + '</span><span class="cl-track">' + segs + '</span>' +
          (n ? '<div class="cl-note" data-k="' + n.k + '">' + n.html + '</div>' : '') + '</div>';
      }).join('');
      stage.innerHTML = '<div class="cl" role="img" aria-label="小林市价买入 600 股：先在 $50.02 买 B 的 200 股，再在 $50.03 先买 C 的 100 股、后买 G 的 200 股，最后在 $50.04 买 D 的 100 股，D 剩 300 股。合计 $30,017，平均 $50.0283，最新成交价变为 $50.04。">' +
        '<div class="cl-order"><div class="cl-up"><i></i>从卖一往上<br>一档一档买</div><div class="cl-box"><small>小林还差</small><b class="need">600</b><small>股</small></div></div>' +
        '<div class="cl-rows">' + rowHtml + '</div></div>' +
        '<div class="cl-sum"><div class="s1"><small>已买到</small><b class="got">0</b> / 600 股</div><div class="s2"><small>一共花了</small><b class="cost">$0</b></div><div class="scr"><small>屏幕上的最新成交价</small><b class="lp">' + f.price(last.price) + '</b></div></div>' +
        '<p class="cl-avg"><span class="badge"><b>④</b></span><span class="avgt"></span></p>';
    };
    cfg.apply = function (step, isStatic) {
      const k = isStatic ? 99 : step;
      const q = s => stage.querySelector(s);
      const gone = { B: k >= 2, C: k >= 3, G: k >= 3 };
      ['B', 'C', 'G'].forEach(id => { const e = q('[data-id=' + id + ']'); if (e) e.classList.toggle('gone', gone[id]); });
      const dw = q('.cl-dw'), rest = q('[data-rest=D]');
      if (dw) { dw.classList.toggle('split', k >= 4); q('[data-cut=D]').classList.toggle('gone', k >= 4); rest.textContent = k >= 4 ? rest.dataset.b : rest.dataset.a; }
      stage.querySelectorAll('.cl-note').forEach(n => { n.hidden = +n.dataset.k > k; });
      const curP = { 1: 5002, 2: 5002, 3: 5003, 4: 5004 }[k];
      stage.querySelectorAll('.cl-row').forEach(r => r.classList.toggle('cur', !isStatic && +r.dataset.p === curP));
      const got = k >= 4 ? 600 : k >= 3 ? 500 : k >= 2 ? 200 : 0;
      const cost = k >= 4 ? rep.totalCents : k >= 3 ? byPrice[5002] + byPrice[5003] : k >= 2 ? byPrice[5002] : 0;
      q('.need').textContent = 600 - got;
      q('.got').textContent = got;
      q('.cost').textContent = f.money(cost);
      const fin = k >= 5;
      q('.lp').textContent = fin ? f.price(rep.lastAfter.price) : f.price(last.price);
      q('.scr').classList.toggle('chg', fin);
      q('.avgt').innerHTML = fin ? '平均每股 = ' + f.money(rep.totalCents).slice(1) + ' ÷ 600 ≈ <b>' + avg + '</b>；屏幕只记最后一笔，所以变成 ' + f.price(rep.lastAfter.price) + '。' : '';
      q('.cl-avg').style.visibility = fin ? 'visible' : 'hidden';
    };
    return stepper(el, cfg);
  }

  /* ---------- 图 4：撤单（最上面一行没变，后面空了） ---------- */
  function cancelFig(el) {
    const stage = el.querySelector('.pf-stage');
    let after = book;
    ['C', 'G', 'D'].forEach(id => { after = OB.cancel(after, { orderId: id, requester: id, time: OB.T(9, 59, 59) }).state; });
    const order = { id: 'XL', owner: 'you', side: 'buy', type: 'market', qty: 600, time: OB.T(10, 0, 0) };
    const r0 = OB.submit(book, order).report, r1 = OB.submit(after, order).report;
    const top = 5006;
    const dep0 = OB.depth(book, 'sell', top), dep1 = OB.depth(after, 'sell', top);
    const buy0 = fillsBy(r0), buy1 = fillsBy(r1);
    const extra = r1.totalCents - r0.totalCents;
    const S = [
      { text: '左边是撤单前，右边是撤单后。只画卖方。先看两边有什么一样、什么不一样。' },
      { badge: '①', text: '两边最下面一行都是卖一 <b>$50.02 × 200</b>。小林屏幕上看到的，撤单前后一模一样。' },
      { badge: '②', text: '区别在后面：C、G、D 把 $50.03 和 $50.04 的卖单<b>撤了</b>，这两档空了。' },
      { badge: '③', text: '$50.06 以内能买到的股数，从 <b>' + f.group(dep0) + ' 股</b>变成 <b>' + f.group(dep1) + ' 股</b>：<b>市场深度</b>变薄了。' },
      { badge: '④', text: '小林买 600 股：撤单前花 ' + f.money(r0.totalCents) + '；撤单后买完 $50.02 的 200 股，就直接跳到 $50.06，花 <b>' + f.money(r1.totalCents) + '</b>，多付 ' + f.money(extra) + '。' }
    ];
    const cfg = { steps: S, delay: 3000 };
    const levelsOf = s => { const m = {}; OB.levels(s, 'sell').forEach(L => { m[L.price] = L.qty; }); return m; };
    const lv0 = levelsOf(book), lv1 = levelsOf(after);
    const prices = asks.map(L => L.price).sort((a, b) => b - a);
    cfg.render = function () {
      const col = (title, lv, buy, rep, dep, k) => {
        const rows = prices.map(p => {
          const q = lv[p], q0 = lv0[p], gone = !q;
          return '<div class="cx-row' + (p === 5002 ? ' best' : '') + '"><span class="cx-p">' + f.price(p) + '</span><span class="cx-track">' +
            '<i class="cx-bar' + (gone ? ' was' : '') + '" style="width:' + (q0 / 600 * 60).toFixed(1) + '%">' + (q || q0) + '</i>' +
            (gone ? '<em class="cx-x st" data-s="3">已撤</em>' : '') +
            (buy[p] ? '<em class="cx-buy st" data-s="5">买 ' + buy[p] + '</em>' : '') + '</span></div>';
        }).join('');
        return '<div class="cx-col"><h4>' + title + '</h4>' + rows +
          '<p class="cx-dep st" data-s="4">' + (k ? BN(3) : '') + '$50.06 以内可买 <b>' + f.group(dep) + '</b> 股</p>' +
          '<p class="cx-res st" data-s="5">' + (k ? BN(4) : '') + '买 600 股共 <b>' + f.money(rep.totalCents) + '</b><br>平均 ' + f.avg(rep.totalCents, 600).text + '</p></div>';
      };
      stage.innerHTML = '<div class="cx" role="img" aria-label="撤单前后对比：两边的卖一都是 $50.02 200 股。撤单后 $50.03 和 $50.04 两档空了，$50.06 以内可买股数从 1,500 股变成 800 股；小林买 600 股，从 $30,017 变成 $30,028。">' +
        col('撤单前', lv0, buy0, r0, dep0, false) + col('撤单后', lv1, buy1, r1, dep1, true) + '</div>' +
        '<p class="cx-same st" data-s="2">' + BN(1) + '最下面一行（卖一）两边一样：屏幕上看不出区别</p>' +
        '<p class="cx-same st" data-s="3">' + BN(2) + 'C、G、D 撤单，$50.03 和 $50.04 两档空了</p>';
    };
    cfg.apply = function (step, isStatic) {
      stOn(stage, step, isStatic);
      const k = isStatic ? 99 : step;
      stage.querySelector('.cx').classList.toggle('lit', k >= 2);
      stage.querySelectorAll('.cx-bar.was').forEach(b => b.classList.toggle('gone', k >= 3));
    };
    return stepper(el, cfg);
  }

  /* ---------- 图 5：两个交易所，合起来的最优报价 ---------- */
  function venues(el) {
    const stage = el.querySelector('.pf-stage');
    const mq = window.matchMedia('(max-width:620px)');
    // 两本只有队首的订单簿，由撮合引擎读出各自的买一、卖一，再取最高买价和最低卖价。
    const mk = (tag, bid, ask) => OB.create({ bids: [{ id: tag + 'b', owner: tag + 'b', price: bid, qty: 100, time: OB.T(9, 59, 0) }], asks: [{ id: tag + 'a', owner: tag + 'a', price: ask, qty: 100, time: OB.T(9, 59, 0) }] });
    const V = [{ name: '甲所', book: mk('甲', 5000, 5002) }, { name: '乙所', book: mk('乙', 4999, 5001) }]
      .map(v => ({ name: v.name, bid: OB.bestBid(v.book).price, ask: OB.bestAsk(v.book).price }));
    const nbB = V.reduce((a, v) => (v.bid > a.bid ? v : a)), nbA = V.reduce((a, v) => (v.ask < a.ask ? v : a));
    const S = [
      { text: '甲所：买一 ' + f.price(V[0].bid) + '，卖一 ' + f.price(V[0].ask) + '。只看甲所，最便宜要 ' + f.price(V[0].ask) + ' 才能买到。' },
      { text: '乙所：买一 ' + f.price(V[1].bid) + '，卖一 ' + f.price(V[1].ask) + '。只看乙所，最多只能卖 ' + f.price(V[1].bid) + '。' },
      { badge: '①', text: '把两所合在一起：出价最高的买方在<b>' + nbB.name + '</b>（' + f.price(nbB.bid) + '），要价最低的卖方在<b>' + nbA.name + '</b>（' + f.price(nbA.ask) + '），各自被挑出来。' },
      { badge: '②', text: '合起来：买一 ' + f.price(nbB.bid) + '，卖一 ' + f.price(nbA.ask) + '，价差只有 <b>' + f.price(nbA.ask - nbB.bid) + '</b>。只看一家交易所，会看错最好的价格。' }
    ];
    const cfg = { steps: S, delay: 3000 };
    const B = (x, y, k) => '<g class="badge"><circle cx="' + x + '" cy="' + y + '" r="10" fill="#111827"/><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="12" fill="#D4FF3A" class="num">' + CIRC[k] + '</text></g>';
    cfg.render = function () {
      const Mo = mq.matches, W = Mo ? 360 : 720, H = 312;
      const L0 = Mo ? 60 : 120, pad = Mo ? 36 : 50, cw = Mo ? 62 : 76, ch = 42, st = (W - L0 - pad - cw / 2 - 8) / 3;
      const x = p => L0 + pad + (p - 4999) * st;
      const Y = [46, 140, 252];
      const card = (p, side, y, sub) => '<rect x="' + (x(p) - cw / 2) + '" y="' + (y - ch / 2) + '" width="' + cw + '" height="' + ch + '" rx="9" fill="' + (side === 'sell' ? '#7A5CFF' : '#111827') + '"/>' +
        '<text x="' + x(p) + '" y="' + (y - 3) + '" text-anchor="middle" font-size="13" fill="#fff" class="num">' + f.price(p) + '</text>' +
        '<text x="' + x(p) + '" y="' + (y + 13) + '" text-anchor="middle" font-size="10.5" fill="#DADFF0">' + sub + '</text>';
      const axis = (y, label) => '<line x1="' + (L0 - 6) + '" x2="' + (W - 8) + '" y1="' + y + '" y2="' + y + '" stroke="#C9CED8" stroke-width="2"/>' +
        '<text x="6" y="' + (y + 5) + '" font-size="' + (Mo ? 13 : 15) + '" font-weight="900">' + label + '</text>';
      let g = '<defs><marker id="ah6" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#5F6878"/></marker></defs>';
      V.forEach((v, i) => {
        g += '<g class="st" data-s="' + (i + 1) + '">' + axis(Y[i], v.name) + card(v.bid, 'buy', Y[i], '买一') + card(v.ask, 'sell', Y[i], '卖一') + '</g>';
      });
      const yb = Y[V.indexOf(nbB)], ya = Y[V.indexOf(nbA)];
      g += '<g class="st" data-s="3">' + axis(Y[2], Mo ? '合起来' : '两所合起来') +
        '<line x1="' + x(nbB.bid) + '" x2="' + x(nbB.bid) + '" y1="' + (yb + ch / 2 + 2) + '" y2="' + (Y[2] - ch / 2 - 4) + '" stroke="#5F6878" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#ah6)"/>' +
        '<line x1="' + x(nbA.ask) + '" x2="' + x(nbA.ask) + '" y1="' + (ya + ch / 2 + 2) + '" y2="' + (Y[2] - ch / 2 - 4) + '" stroke="#5F6878" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#ah6)"/>' +
        '<g class="mv" data-m="3" data-from="0,' + (yb - Y[2]) + '">' + card(nbB.bid, 'buy', Y[2], '来自' + nbB.name) + '</g>' +
        '<g class="mv" data-m="3" data-from="0,' + (ya - Y[2]) + '">' + card(nbA.ask, 'sell', Y[2], '来自' + nbA.name) + '</g>' +
        B((x(nbB.bid) + x(nbA.ask)) / 2, (ya + Y[2]) / 2 + 6, 1) + '</g>';
      const mx = (x(nbB.bid) + x(nbA.ask)) / 2;
      g += '<g class="st" data-s="4">' +
        '<rect x="' + (x(nbB.bid) - cw / 2 - 4) + '" y="' + (Y[2] - ch / 2 - 4) + '" width="' + (cw + 8) + '" height="' + (ch + 8) + '" rx="12" fill="none" stroke="#D4FF3A" stroke-width="4"/>' +
        '<rect x="' + (x(nbA.ask) - cw / 2 - 4) + '" y="' + (Y[2] - ch / 2 - 4) + '" width="' + (cw + 8) + '" height="' + (ch + 8) + '" rx="12" fill="none" stroke="#D4FF3A" stroke-width="4"/>' +
        '<path d="M' + (x(nbB.bid)) + ' ' + (Y[2] + ch / 2 + 8) + ' v6 H' + x(nbA.ask) + ' v-6" fill="none" stroke="#111827" stroke-width="2"/>' +
        '<text x="' + mx + '" y="' + (Y[2] + ch / 2 + 30) + '" text-anchor="middle" font-size="12.5" font-weight="800">价差 ' + f.price(nbA.ask - nbB.bid) + '</text>' +
        B(mx - (Mo ? 50 : 58), Y[2] + ch / 2 + 26, 2) + '</g>';
      stage.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="甲所买一 $50.00、卖一 $50.02；乙所买一 $49.99、卖一 $50.01。两所合起来，最高买价 $50.00 来自甲所，最低卖价 $50.01 来自乙所，价差 $0.01。">' + g + '</svg>';
    };
    cfg.apply = function (step, isStatic) {
      stOn(stage, step, isStatic);
      stage.querySelectorAll('.mv').forEach(e => {
        const done = isStatic || step >= +e.dataset.m;
        const [dx, dy] = e.dataset.from.split(',').map(Number);
        e.style.transform = done ? 'translate(0px,0px)' : 'translate(' + dx + 'px,' + dy + 'px)';
      });
    };
    const F = stepper(el, cfg);
    mq.addEventListener('change', () => F.rerender());
    return F;
  }

  /* ---------- 小题：题干、提示、答案都取自页面上的课文原文 ---------- */
  function quiz(el, qi) {
    const right = +el.dataset.answer;
    const opts = [...el.querySelectorAll('.opts li')];
    const hint = el.querySelector('.qhint'), ans = el.querySelector('.qans');
    const name = 'quiz-' + (el.id || qi);
    const qq = el.querySelector('.qq');
    qq.id = qq.id || name + '-q';
    const group = document.createElement('div');
    group.className = 'opts'; group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-labelledby', qq.id);
    group.innerHTML = opts.map((li, i) => '<label><input type="radio" name="' + name + '" value="' + i + '"> <span>' + li.innerHTML + '</span></label>').join('');
    el.querySelector('ul.opts').replaceWith(group);
    const bar = document.createElement('div'); bar.className = 'qa';
    bar.innerHTML = '<button type="button" data-a="check">提交</button><button type="button" class="ghost" data-a="show">看答案</button>';
    group.after(bar);
    const fb = document.createElement('p'); fb.className = 'fb'; fb.setAttribute('aria-live', 'polite'); fb.hidden = true;
    bar.after(fb);
    const labels = [...group.querySelectorAll('label')];
    el.classList.add('js');
    const showAns = () => { hint.hidden = true; ans.hidden = false; labels[right].classList.add('right'); };
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const sel = group.querySelector('input:checked');
      labels.forEach(l => l.classList.remove('right', 'wrong'));
      if (b.dataset.a === 'show') { fb.hidden = true; showAns(); el.dataset.state = 'shown'; return; }
      if (!sel) { fb.hidden = false; fb.textContent = '先选一个答案。'; return; }
      if (+sel.value === right) {
        fb.hidden = false; fb.innerHTML = '<b>答对了。</b>';
        showAns(); el.dataset.state = 'right';
      } else {
        sel.closest('label').classList.add('wrong');
        ans.hidden = true; hint.hidden = false;
        fb.hidden = false; fb.innerHTML = '<b>不对，再想想。</b>看看下面的提示，改选后再点「提交」；想直接看答案，点「看答案」。';
        el.dataset.state = 'wrong';
      }
    });
    group.addEventListener('change', () => { labels.forEach(l => l.classList.remove('wrong')); });
  }

  /* ---------- 选读信息卡：集合竞价的可成交量 ---------- */
  (function () {
    const el = document.querySelector('[data-viz="auction"]'); if (!el) return;
    // 信息卡中的订单（美分）；在每个试算价格上：可成交 = min(愿买, 愿卖)
    const buys = [[5003, 300], [5001, 200], [5000, 400]], sells = [[4999, 200], [5001, 300], [5003, 300]];
    const rows = [5000, 5001, 5003].map(p => {
      const bq = buys.filter(x => x[0] >= p).reduce((a, x) => a + x[1], 0);
      const sq = sells.filter(x => x[0] <= p).reduce((a, x) => a + x[1], 0);
      return { p: p, b: bq, s: sq, x: Math.min(bq, sq) };
    });
    const max = Math.max(...rows.map(r => r.x));
    el.innerHTML = '<div class="auc-bars">' + rows.map(r => '<div class="auc-r' + (r.x === max ? ' win' : '') + '"><span class="p">' + f.price(r.p) + '</span><span class="bar"><i style="width:' + (r.x / 900 * 100) + '%"></i></span><span class="x">' + r.x + ' 股</span></div>').join('') + '</div>';
  })();

  /* ---------- 启动 ---------- */
  document.querySelectorAll('[data-fig=queues]').forEach(queues);
  document.querySelectorAll('[data-fig=book]').forEach(bookFig);
  document.querySelectorAll('[data-fig=climb]').forEach(climb);
  document.querySelectorAll('[data-fig=cancel]').forEach(cancelFig);
  document.querySelectorAll('[data-fig=venues]').forEach(venues);
  document.querySelectorAll('.quiz').forEach(quiz);

  const modeBtn = document.getElementById('modebtn');
  function setMode(m) {
    MODE = m;
    document.body.classList.toggle('static', m === 'static');
    if (modeBtn) { modeBtn.setAttribute('aria-pressed', String(m === 'static')); modeBtn.textContent = m === 'static' ? '改看分步动画' : '改看静态版'; }
    figs.forEach(F => F.reset());
  }
  if (modeBtn) modeBtn.addEventListener('click', () => setMode(MODE === 'static' ? 'anim' : 'static'));
  reduceMq.addEventListener('change', e => setMode(e.matches ? 'static' : 'anim'));
  setMode(MODE);
  /* 打印 / 导出 PDF：临时切到静态版，打印完恢复 */
  let beforePrint = null;
  window.addEventListener('beforeprint', () => { beforePrint = MODE; if (MODE !== 'static') setMode('static'); });
  window.addEventListener('afterprint', () => { if (beforePrint && beforePrint !== 'static') setMode(beforePrint); beforePrint = null; });
  window.__figs = { setMode, figs, mode: () => MODE };
})();
