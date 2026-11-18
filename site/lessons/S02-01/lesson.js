/* S02-01 的四张图。数字全部在本文件中计算或取自招股书封面；不自动播放。 */
(function () {
  'use strict';
  const { stepper, reveal, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);
  const wan = v => (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-US') + ' 万';
  const usd = v => '$' + Math.round(v).toLocaleString('en-US');

  /* ---------- 图 1：借钱，还是卖股份（先预测，再看图） ---------- */
  const F1 = {
    debt: p => p - 240,            // 每年利息 240 万
    equity: p => Math.round(p * 0.8 * 100) / 100   // 新股东占 20%
  };
  (function () {
    const fig = $('fig1'); if (!fig) return;
    const pre = $('fig1-pre'), body = $('fig1-body'), fb = pre.querySelector('.pfb');
    const range = $('fig1-p'), svg = $('fig1-svg');
    const X0 = -500, X1 = 3000, Y0 = -800, Y1 = 2800;
    const L = 64, R = 620, T = 16, B = 262;
    const sx = p => L + (p - X0) / (X1 - X0) * (R - L), sy = v => B - (v - Y0) / (Y1 - Y0) * (B - T);
    const grid = [];
    for (let v = -500; v <= 2500; v += 500) grid.push('<line x1="' + L + '" x2="' + R + '" y1="' + sy(v) + '" y2="' + sy(v) + '" class="g' + (v === 0 ? ' z' : '') + '"/><text x="' + (L - 8) + '" y="' + (sy(v) + 4) + '" class="ax" text-anchor="end">' + v.toLocaleString('en-US') + '</text>');
    for (let p = 0; p <= 3000; p += 1000) grid.push('<text x="' + sx(p) + '" y="' + (B + 18) + '" class="ax" text-anchor="middle">' + p.toLocaleString('en-US') + '</text>');
    grid.push('<line x1="' + sx(0) + '" x2="' + sx(0) + '" y1="' + T + '" y2="' + B + '" class="g z"/>');
    svg.innerHTML = grid.join('') +
      '<text x="' + R + '" y="' + (B + 34) + '" class="ax" text-anchor="end">经营利润（万美元）</text>' +
      '<line class="ln debt" x1="' + sx(X0) + '" y1="' + sy(F1.debt(X0)) + '" x2="' + sx(X1) + '" y2="' + sy(F1.debt(X1)) + '"/>' +
      '<line class="ln eq" x1="' + sx(X0) + '" y1="' + sy(F1.equity(X0)) + '" x2="' + sx(X1) + '" y2="' + sy(F1.equity(X1)) + '"/>' +
      '<text x="' + sx(2500) + '" y="' + (sy(F1.debt(2500)) - 12) + '" class="lb" text-anchor="end">借钱</text>' +
      '<text x="' + sx(2500) + '" y="' + (sy(F1.equity(2500)) + 22) + '" class="lb eq" text-anchor="start">卖股份</text>' +
      '<circle cx="' + sx(1200) + '" cy="' + sy(960) + '" r="4" class="x"/><text x="' + (sx(1200) + 10) + '" y="' + (sy(960) + 20) + '" class="ax">1,200 万处相同：都是 960 万</text>' +
      '<line id="fig1-cur" class="cur" y1="' + T + '" y2="' + B + '"/>' +
      '<circle id="fig1-cd" r="6" class="dot debt"/><circle id="fig1-ce" r="6" class="dot eq"/>';
    function draw() {
      const p = +range.value, d = F1.debt(p), e = F1.equity(p);
      $('fig1-pv').textContent = wan(p);
      $('fig1-d').textContent = wan(d);
      $('fig1-e').textContent = wan(e);
      const c = $('fig1-cur'); c.setAttribute('x1', sx(p)); c.setAttribute('x2', sx(p));
      $('fig1-cd').setAttribute('cx', sx(p)); $('fig1-cd').setAttribute('cy', sy(d));
      $('fig1-ce').setAttribute('cx', sx(p)); $('fig1-ce').setAttribute('cy', sy(e));
      $('fig1-v').textContent = d === e ? '这一年，两种方式留给原来的股东一样多（都是 960 万）' :
        '这一年，' + (d > e ? '借钱' : '卖股份') + '对原来的股东更有利：多留下 ' + wan(Math.abs(d - e));
      range.setAttribute('aria-valuetext', '经营利润 ' + wan(p) + '；借钱留下 ' + wan(d) + '，卖股份留下 ' + wan(e));
    }
    range.addEventListener('input', draw);
    const open = () => { body.hidden = false; fig.dataset.open = '1'; draw(); };
    pre.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'skip') { fb.hidden = true; open(); return; }
      const sel = pre.querySelector('input:checked');
      fb.hidden = false; fb.classList.remove('hint');
      if (!sel) { fb.textContent = '先选一个，再看图。'; return; }
      if (sel.value === 'debt') { fb.innerHTML = '<b>对。</b>借钱留下 2,760 万，卖股份留下 2,400 万：好年景里，利息之外的利润全归原来的股东。拖动滑块看看其他年景。'; open(); }
      else { fb.classList.add('hint'); fb.innerHTML = '<b>提示：</b>借钱时，利息之外的利润全归谁？想好了可以重选。'; }
    });
    const pans = pre.querySelector('.pans');
    const st = s => { pans.hidden = !s; if (s) open(); };
    st(isStatic()); onMode(st);
    draw();
  })();

  /* ---------- 图 2：那一晚的钱流向了哪里（第 1–4 步） ---------- */
  const IPO = { price: 85, newSh: 14142135, oldSh: 5462917, disc: 2.3839, toGoogle: 1168368039, toSellers: 451324897 };
  (function () {
    const el = $('fig2'); if (!el) return;
    const stage = el.querySelector('.pf-stage');
    stepper(el, {
      steps: [
        { label: '投资者付钱', what: '投资者一共付出 $1,666,429,420，换到 19,605,052 股。', why: '19,605,052 股 × $85 = $1,666,429,420，这是总发行金额。', learn: '这是投资者付出的钱，不是 Google 拿到的钱。' },
        { label: '股票分成两堆', what: '14,142,135 股是 Google 新发行的，5,462,917 股是老股东出售的。', why: '招股书封面把两部分分开列出。', learn: '同一场 IPO 里有两个卖方。' },
        { label: '钱分两路，都先经过承销商', what: '粗线 $1,202,081,475 扣除每股 $2.3839 的承销折扣后，$1,168,368,039 归 Google；细线 $464,347,945 扣除同样的折扣后，$451,324,897 归原有股东。', why: '承销商的报酬从发行款里扣除；律师、审计、印刷等其他发行费用由公司另外承担，招股书估计 Google 的净所得约 $1,163.6 million。', learn: '总发行金额、Google 所得、Google 净所得是三个不同的数。' },
        { label: 'Google 的账户', what: 'Google 的账户只连着粗的那一条线。', why: '老股东卖出的那部分，钱归老股东。', learn: '公司只从自己发行的新股拿到钱。' }
      ],
      render(step, s) { reveal(stage, step + 1, s); $('fig2-g').classList.toggle('hl', s || step === 3); }
    });
  })();

  /* ---------- 图 2，续：二级市场（第 5–6 步） ---------- */
  const DAY1 = [100.01, 104.06, 95.00, 100.34];   // 首日价格区间内的演示价位（据当日新闻报道）
  (function () {
    const el = $('fig2b'); if (!el) return;
    const stage = el.querySelector('.pf-stage');
    let k = 0;
    function price() {
      const p = DAY1[k], pl = Math.round((p - IPO.price) * 100);
      $('fig2b-px').textContent = '$' + p.toFixed(2);
      $('fig2b-pl').innerHTML = '前一晚以 $85 买到 100 股的投资者，按这个价格的账面盈亏：<b>' + (pl >= 0 ? '+' : '−') + usd(Math.abs(pl)) + '</b>。Google 的账户：<b>' + usd(IPO.toGoogle) + '</b>，不变';
      $('fig2b-g').textContent = usd(IPO.toGoogle);
    }
    $('fig2b-btn').addEventListener('click', () => { k = (k + 1) % DAY1.length; price(); });
    stepper(el, {
      first: 5,
      steps: [
        { label: '第二天：投资者之间交换', what: '一位投资者卖出股票，另一位付出现金。', why: 'Google 只是发行人，不是这笔交易的任何一方。', learn: 'Google 账户的数字不变。' },
        { label: '股价变化', what: '点「股价变化」，股价在首日的区间里变动。', why: '价格变了，只改变投资者之间谁赚谁亏。', learn: '二级市场的价格变动不改变公司账户。' }
      ],
      reset() { k = 0; price(); },
      render(step, s) { reveal(stage, step + 1, s); $('fig2b-btn').disabled = !s && step < 1; }
    });
    price();
  })();

  /* ---------- 图 3：市场价和增发 ---------- */
  const FO = { raise: 4114328427, price: 295, last: 302.09, uw: 0.015, sharesAfter: 292808590, actual: 14159265 };
  FO.cut = (FO.last - FO.price) / FO.last;   // 相对定价日市场价的折让幅度，约 2.35%
  function follow(M) {
    const p = M * (1 - FO.cut), net = p * (1 - FO.uw), n = Math.round(FO.raise / net);
    const before = FO.sharesAfter - FO.actual;
    return { p, net, n, pct: n / (before + n) };
  }
  (function () {
    const el = $('fig3'); if (!el) return;
    const range = $('fig3-m'); let M = FO.last;
    function draw() {
      const r = follow(M), real = M === FO.last;
      $('fig3-mv').textContent = '$' + (real ? '302.09' : M.toFixed(0));
      $('fig3-p').textContent = '$' + r.p.toFixed(2);
      $('fig3-net').textContent = '$' + (real ? '290.575' : r.net.toFixed(2));
      $('fig3-n').textContent = r.n.toLocaleString('en-US') + ' 股';
      $('fig3-pct').textContent = (r.pct * 100).toFixed(2) + '%';
      $('fig3-bar').style.width = (r.pct * 100 / 15 * 100).toFixed(1) + '%';
      const x = r.n / FO.actual;
      $('fig3-v').textContent = real ? '这是 2005 年的真实发行：14,159,265 股' :
        '假设市场价是 $' + M.toFixed(0) + '：要筹同样多的钱，需要发行 ' + r.n.toLocaleString('en-US') + ' 股，是实际数量的 ' + x.toFixed(2) + ' 倍';
      range.setAttribute('aria-valuetext', '市场价 $' + (real ? '302.09' : M.toFixed(0)) + '，需要发行 ' + r.n.toLocaleString('en-US') + ' 股，占发行后总股数 ' + (r.pct * 100).toFixed(2) + '%');
    }
    range.addEventListener('input', () => { M = +range.value; draw(); });
    $('fig3-real').addEventListener('click', () => { M = FO.last; range.value = 302; draw(); });
    draw();
  })();

  /* ---------- 图 4：小林的订单走了哪条路 ---------- */
  const ROUTES = { us: ['交易所', '另类交易系统', '证券公司直接成交'], cn: ['股票上市的那家交易所'] };
  (function () {
    const el = $('fig4'); if (!el) return;
    const stage = el.querySelector('.pf-stage'), br = $('fig4-br');
    let mkt = 'us', pick = -1, S;
    function branches(s) {
      br.innerHTML = ROUTES[mkt].map((t, i) => '<button type="button" data-i="' + i + '" aria-pressed="' + (pick === i) + '"' + (pick === i ? ' class="on"' : '') + '>' + t + '</button>').join('');
      br.querySelectorAll('button').forEach(b => { b.disabled = !s && S && S.step < 3; });
    }
    const steps = [
      { label: '小林', what: '小林想买北岭电池，在手机上填好订单。', why: '他只看得见手机上的软件。', learn: '接下来每一层的性质都不同。' },
      { label: '交易软件：界面', what: '软件把订单交给券商。', why: '软件由券商提供，本身不是机构，不持有股票，也不让订单成交。', learn: '界面不等于机构。' },
      { label: '券商：机构', what: '券商接受订单，核对账户里的钱，再决定送到哪里。', why: '在美国，交易所只接纳注册的经纪商、交易商或与它们有关联的人作为会员。', learn: '小林不能绕过券商直接去交易所。' },
      { label: '执行渠道', what: '券商把订单送进某个执行渠道：美股可能是交易所、另类交易系统，或由证券公司直接成交；A 股竞价交易的订单集中进入股票上市的那家交易所。', why: '在美国，一张订单不一定在交易所成交。', learn: '券商有义务为客户争取合理可得的最佳执行；具体怎样选，本课不展开。' },
      { label: '成交', what: '订单在那里成交。', why: '卖出股票的是市场中的其他参与者，小林看不到是谁。', learn: '一切经由券商和执行渠道完成。' },
      { label: '成交回报', what: '结果沿原路回到小林的软件。', why: '钱最后归卖出股票的那一方。', learn: '北岭电池不在这条路上。' }
    ];
    function step4() {
      const s = steps[3];
      if (mkt === 'cn') { s.what = 'A 股竞价交易的订单，集中进入股票上市的那家交易所。'; s.why = 'A 股只有这一条路。'; s.learn = '切换市场只改变这一层，其余各层不变。'; }
      else { s.what = pick < 0 ? '点选一种执行渠道，让订单走完这条路。' : '订单被送进「' + ROUTES.us[pick] + '」。'; s.why = '在美国，一张订单不一定在交易所成交：还可能在另类交易系统，或由证券公司直接用自己持有的股票成交。'; s.learn = '券商有义务为客户争取合理可得的最佳执行；具体怎样选，本课不展开。'; }
    }
    S = stepper(el, {
      steps,
      render(step, s) {
        reveal(stage, step + 1, s);
        branches(s);
        stage.classList.toggle('picked', pick >= 0 || s);
      },
      after(step, b) { if (step === 3 && pick < 0 && !isStatic()) b.next.disabled = true; },
      reset() { pick = mkt === 'cn' ? 0 : -1; step4(); }
    });
    step4(); S.apply();
    br.addEventListener('click', e => {
      const b = e.target.closest('button[data-i]'); if (!b) return;
      pick = +b.dataset.i; step4(); S.show(S.step);
      if (S.step === 3) el.querySelector('[data-a=next]').focus();
    });
    el.querySelectorAll('button[data-mkt]').forEach(b => b.addEventListener('click', () => {
      mkt = b.dataset.mkt; pick = mkt === 'cn' ? 0 : -1;
      el.querySelectorAll('button[data-mkt]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      step4(); S.apply();
    }));
  })();

  window.S0201 = { F1, IPO, FO, follow, ROUTES };
})();
