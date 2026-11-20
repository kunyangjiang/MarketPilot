/* S01-06 的四张图。数字全部取自课文；不自动播放 */
(function () {
  'use strict';
  const { stepper, reveal, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);
  const pct = v => v.toFixed(2) + '%';
  const pp = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
  const openTables = s => document.querySelectorAll('.pf details.tbl').forEach(d => { if (s) d.open = true; });

  /* ---------- 图 1：联储的框，和框里的成交价（2026-11-12） ---------- */
  (function () {
    const el = $('fig1'); if (!el) return;
    const ax = el.querySelector('.f1-ax'), stage = el.querySelector('.f1-plot');
    const top = v => ((4.05 - v) / 0.35 * 100).toFixed(2) + '%';
    let h = '';
    for (let k = 0; k <= 7; k++) { const v = 3.70 + k * 0.05; h += '<i style="top:' + top(v) + '"></i>' + (k === 0 || k === 7 ? '<span style="top:' + top(v) + '">' + v.toFixed(2) + '</span>' : ''); }
    ax.innerHTML = h;
    stepper(el, {
      steps: [
        { label: '目标区间', what: 'FOMC 定下的目标区间是 3.75%–4.00%，宽 0.25 个百分点', why: '联储公布的是一个区间，不是一个数', learn: '联邦基金利率应当落在这条带里' },
        { label: '隔夜逆回购利率 3.75%', what: '下沿：正好是区间下限', why: '货币市场基金等非银行机构可以按 3.75% 把钱借给联储一夜，每家每天最多 1,600 亿美元', learn: '对非银行机构有效：没理由以更低的利率借给别人' },
        { label: '准备金余额利率 3.90%', what: '联储对银行存在它那里的准备金付 3.90%', why: '只有存款机构能拿到：钱放在联储，没有风险，随时可用', learn: '对银行有效：低于 3.90% 不愿借出' },
        { label: '常设回购操作利率 4.00%', what: '上沿：正好是区间上限', why: '符合条件的机构可以拿国债等证券作抵押，按 4.00% 从联储隔夜借钱', learn: '对缺钱的机构有效：没人愿意以高于 4.00% 借入' },
        { label: '有效联邦基金利率 3.88%', what: '成交价落在区间里，比准备金余额利率低 0.02 个百分点', why: '最大的借出方联邦住房贷款银行在联储的余额不计息，借出拿 3.88% 也比闲置强', learn: '准备金余额利率不是严丝合缝的地板；3.75% 才是对更多机构有效的下沿' }
      ],
      render(step, s) { reveal(stage, step + 1, s); }
    });
  })();

  /* ---------- 图 2：加息前后的一天（2026-09-16 → 09-17） ---------- */
  const F2 = [
    { nm: '目标区间', tb: '目标区间', a: [3.50, 3.75], b: [3.75, 4.00], d: 0.25 },
    { nm: '准备金余额利率', a: 3.65, b: 3.90, d: 0.25 },
    { nm: '隔夜逆回购利率', a: 3.50, b: 3.75, d: 0.25 },
    { nm: '有效联邦基金利率', a: 3.63, b: 3.88, d: 0.25, mkt: 1 },
    { nm: 'SOFR', tb: '有担保隔夜融资利率（SOFR）', a: 3.62, b: 3.85, d: 0.23, mkt: 1 },
    { nm: '优惠利率', a: 6.75, b: 7.00, d: 0.25, mkt: 1, lo: 6.40 }
  ];
  (function () {
    const el = $('fig2'); if (!el) return;
    const rows = $('fig2-rows'), v = $('fig2-v');
    const fmt = (x, br) => Array.isArray(x) ? x[0].toFixed(2) + '%–' + (br ? '<wbr>' : '') + x[1].toFixed(2) + '%' : pct(x);
    $('fig2-tb').innerHTML = F2.map(r => '<tr><td>' + (r.tb || r.nm) + '</td><td class="n">' + fmt(r.a) + '</td><td class="n">' + fmt(r.b) + '</td><td class="n">' + pp(r.d) + '</td></tr>').join('');
    rows.innerHTML = '<div class="f2-row f2-hd" aria-hidden="true"><span class="nm"></span><span class="v">9 月 16 日</span><span></span><span class="v b">9 月 17 日</span><span class="v">变化</span></div>' +
      F2.map((r, i) => {
        const lo = r.lo || 3.40;
        return (i === 3 ? '<div class="f2-sep" aria-hidden="true"></div>' : '') +
          '<div class="f2-row' + (r.mkt ? ' mkt' : '') + (r.lo ? ' prime' : '') + '" data-i="' + i + '" role="group" aria-label="' + (r.tb || r.nm) + '">' +
          '<span class="nm">' + r.nm + '</span><span class="v a">' + fmt(r.a, 1) + '</span>' +
          '<span class="f2-tr" aria-hidden="true"><span class="ghost"></span><span class="mv"></span><span class="bar"></span></span>' +
          '<span class="v b"></span><span class="dl"></span></div>';
      }).join('');
    function pos(r, x) { const lo = r.lo || 3.40; return (x - lo) / 0.70 * 100; }
    function place(e, r, x) {
      if (Array.isArray(x)) { e.classList.remove('mk'); e.style.left = pos(r, x[0]) + '%'; e.style.width = (pos(r, x[1]) - pos(r, x[0])) + '%'; }
      else { e.classList.add('mk'); e.style.left = pos(r, x) + '%'; e.style.width = ''; }
    }
    function draw(d) {
      el.dataset.d = d;
      el.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.d === d)));
      F2.forEach((r, i) => {
        const row = rows.querySelector('[data-i="' + i + '"]'), late = d === '17';
        const bar = row.querySelector('.bar'), g = row.querySelector('.ghost'), mv = row.querySelector('.mv');
        place(bar, r, late ? r.b : r.a);
        place(g, r, r.a); g.hidden = !late;
        const x0 = Array.isArray(r.a) ? r.a[1] : r.a, x1 = Array.isArray(r.b) ? r.b[1] : r.b;
        mv.style.left = pos(r, x0) + '%'; mv.style.width = late ? (pos(r, x1) - pos(r, x0)) + '%' : '0';
        row.querySelector('.v.b').innerHTML = late ? fmt(r.b, 1) : '?';
        row.querySelector('.dl').textContent = late ? pp(r.d) : '';
        row.setAttribute('aria-label', (r.tb || r.nm) + '：9 月 16 日 ' + fmt(r.a) + (late ? '，9 月 17 日 ' + fmt(r.b) + '，变化 ' + pp(r.d) + ' 个百分点' : ''));
      });
      v.textContent = d === '17' ? '第二天，后三行也跟着上移：有效联邦基金利率 +0.25、SOFR +0.23、优惠利率 +0.25（个百分点）' : '加息生效前一天。点「9 月 17 日」，看哪些利率当天跟随';
    }
    el.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) draw(b.dataset.d); });
    draw(isStatic() ? '17' : '16');
    onMode(s => { if (s) draw('17'); });
  })();

  /* ---------- 图 3：2019 年 9 月的一周 ---------- */
  const F3 = [
    { d: '9 月 13 日', w: '周五', up: 2.25, ef: 2.14, so: 2.20 },
    { d: '9 月 16 日', w: '周一', up: 2.25, ef: 2.25, so: 2.43 },
    { d: '9 月 17 日', w: '周二', up: 2.25, ef: 2.30, so: 5.25 },
    { d: '9 月 18 日', w: '周三', up: 2.25, ef: 2.25, so: 2.55 },
    { d: '9 月 19 日', w: '周四', up: 2.00, ef: 1.90, so: 1.95 },
    { d: '9 月 20 日', w: '周五', up: 2.00, ef: 1.90, so: 1.86 }
  ];
  (function () {
    const el = $('fig3'); if (!el) return;
    // 断开的刻度：1.70–2.70 占 80%，断口，5.10–5.40 占 16%
    const x = v => (v <= 2.70 ? (v - 1.70) / 1.0 * 80 : 84 + (v - 5.10) / 0.30 * 16);
    const days = $('fig3-days');
    $('fig3-scale').innerHTML = [2.00, 2.25, 5.25].map(t => '<span style="left:' + x(t) + '%">' + t.toFixed(2) + '</span>').join('');
    $('fig3-tb').innerHTML = F3.map(r => '<tr><td>' + r.d + '（' + r.w + '）</td><td class="n">' + pct(r.up) + '</td><td class="n">' + pct(r.ef) + '</td><td class="n">' + pct(r.so) + '</td></tr>').join('');
    const mk = (cls, v) => '<span class="' + cls + (x(v) > 70 ? ' l' : ' r') + '" style="left:' + x(v) + '%"><i></i><b>' + pct(v) + '</b></span>';
    days.innerHTML = F3.map((r, i) => '<li data-s="' + (i + 1) + '"' + (r.ef > r.up ? ' class="out"' : '') + ' aria-label="' + r.d + r.w + '：目标区间上限 ' + pct(r.up) + '，有效联邦基金利率 ' + pct(r.ef) + '，SOFR ' + pct(r.so) + '">' +
      '<span class="dt" aria-hidden="true">' + r.d + '<small>' + r.w + ' · 上限 ' + pct(r.up) + '</small></span>' +
      '<span class="tr" aria-hidden="true"><span class="bd" style="left:' + x(r.up - 0.25) + '%;width:' + (x(r.up) - x(r.up - 0.25)) + '%"></span><span class="up" style="left:' + x(r.up) + '%"></span><span class="brk" style="left:82%"></span>' +
      mk('ef', r.ef) + mk('so', r.so) + '</span></li>').join('');
    stepper(el, {
      steps: [
        { label: '9 月 13 日，周五', what: '区间 2.00%–2.25%；有效联邦基金利率 2.14%，SOFR 2.20%', why: '两个隔夜利率都在上限 2.25% 以下', learn: '平常的一天' },
        { label: '9 月 16 日，周一', what: '有效联邦基金利率 2.25%，碰到上限；SOFR 2.43%，越过上限', why: '企业季度缴税，资金流进财政部在联储的账户；同一天约 540 亿美元长期国债结算付款', learn: '两个工作日里准备金减少约 1,200 亿美元，降到不足 1.4 万亿美元' },
        { label: '9 月 17 日，周二', what: 'SOFR 跳到 5.25%；有效联邦基金利率 2.30%，越出上限 0.05 个百分点', why: '当天回购成交利率最高的那一端（第 99 百分位）达到 9.00%', learn: '框没有管住' },
        { label: '9 月 18 日，周三', what: '有效联邦基金利率 2.25%，SOFR 2.55%', why: '9 月 17 日上午起，纽约联储开展隔夜回购操作，把准备金借给市场：那天最多 750 亿美元，借出 530 亿美元；这一周每天上午都做', learn: '利率随即回落' },
        { label: '9 月 19 日，周四', what: '区间下调 0.25 个百分点，上限变成 2.00%；有效联邦基金利率 1.90%，SOFR 1.95%', why: '这是 9 月 18 日会议的决定；会议还把准备金利率定在区间上限下方 0.20 个百分点', learn: '两个利率回到新区间上限之下' },
        { label: '9 月 20 日，周五', what: '有效联邦基金利率 1.90%，SOFR 1.86%', why: '压力来自缴税、国债交割这些例行事件，只是被准备金处于多年低点放大了', learn: '框要管用，准备金得多到银行不必互相抢' }
      ],
      render(step, s) { reveal(days, step + 1, s); }
    });
  })();

  /* ---------- 图 4：从一个隔夜利率到整个经济 ---------- */
  const EV = [
    { t: '联储直接设定 · 证据见图 1', s: '2026 年 11 月 12 日：隔夜逆回购利率 3.75%（区间下限）、准备金余额利率 3.90%、常设回购操作利率 4.00%（区间上限），都是联储自己挂出的价格' },
    { t: '当天跟随 · 证据见图 2', s: '区间上调 0.25 个百分点生效那天（2026 年 9 月 17 日），有效联邦基金利率、SOFR、优惠利率分别上移 0.25、0.23、0.25 个百分点' },
    { t: '联储只能影响 · 证据见上一课', s: '10 年期期限溢价只能用模型估计：2026 年 11 月 12 日，两套联储模型分别给出约 0.68% 和 0.97%；联储没有一个利率可以直接设定它' }
  ];
  (function () {
    const el = $('fig4'); if (!el) return;
    const out = $('fig4-ev'), btns = [...el.querySelectorAll('.chain button')];
    $('fig4-all').innerHTML = EV.map((e, i) => '<li><b>第 ' + (i + 1) + ' 段</b>' + e.t + '：' + e.s + '</li>').join('');
    function pick(k) {
      btns.forEach((b, i) => b.setAttribute('aria-expanded', String(i === k)));
      out.innerHTML = k < 0 ? '点上面任意一段' : '<b>第 ' + (k + 1) + ' 段 · ' + EV[k].t + '</b>' + EV[k].s;
    }
    el.querySelector('.chain').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pick(+b.dataset.k); });
    pick(-1);
  })();

  openTables(isStatic()); onMode(openTables);
})();
