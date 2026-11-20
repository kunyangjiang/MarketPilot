/* S01-03 的四张图。图上的数字都是课文里的数（写死，不在页面上现算），按钮只停在这些取值上；不自动播放。 */
(function () {
  'use strict';
  const { stepper, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);
  const usd = v => '$' + v.toFixed(2);
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- 图 1：复利的台阶 ---------- */
  // 年数、复利余额、单利余额、复利多出（课文第 3 节的表）；ioi = 当年新增的利息的利息
  const F1 = [
    { y: 0, c: 100.00, s: 100.00, d: 0.00 },
    { y: 1, c: 105.00, s: 105.00, d: 0.00 },
    { y: 2, c: 110.25, s: 110.00, d: 0.25, ioi: 0.25 },
    { y: 3, c: 115.76, s: 115.00, d: 0.76, ioi: 0.51 },
    { y: 10, c: 162.89, s: 150.00, d: 12.89 },
    { y: 20, c: 265.33, s: 200.00, d: 65.33 },
    { y: 30, c: 432.19, s: 250.00, d: 182.19, yr: 20.58 }
  ];
  const yl = y => y === 0 ? '今天' : '第 ' + y + ' 年';
  (function () {
    const el = $('fig1'); if (!el) return;
    const svg = $('fig1-svg'), stage = el.querySelector('.pf-stage');
    let cur = 0, stat = false;
    const t = (x, y, s, cls, anc) => '<text x="' + x + '" y="' + y + '" class="' + cls + '"' + (anc ? ' text-anchor="' + anc + '"' : '') + '>' + s + '</text>';
    function draw() {
      const W = Math.max(280, Math.round(stage.clientWidth - 2 * parseFloat(getComputedStyle(stage).paddingLeft || 0)));
      const vert = W >= 520;
      const shown = stat ? F1.length - 1 : cur;
      const max = shown >= 4 ? 450 : 120;
      const ticks = max === 450 ? [0, 100, 200, 300, 400] : [0, 25, 50, 75, 100];
      const g = [];
      let H;
      if (vert) {
        H = 340; const L = 44, R = W - 8, T = 50, B = H - 30, n = F1.length, slot = (R - L) / n, bw = Math.min(46, slot * 0.5);
        const sy = v => B - v / max * (B - T), cx = i => L + slot * (i + 0.5);
        ticks.forEach(v => g.push('<line class="g" x1="' + L + '" x2="' + R + '" y1="' + sy(v) + '" y2="' + sy(v) + '"/>' + t(L - 6, sy(v) + 4, '$' + v, 'ax', 'end')));
        const pts = [];
        F1.forEach((r, i) => {
          g.push(t(cx(i), B + 20, yl(r.y), 'yl' + (i === shown && !stat ? ' on' : ''), 'middle'));
          if (i > shown) return;
          const x = cx(i) - bw / 2, on = i === shown && !stat;
          g.push('<rect class="pr" x="' + x + '" y="' + sy(100) + '" width="' + bw + '" height="' + (B - sy(100)) + '"/>');
          if (r.c > 100) g.push('<rect class="in" x="' + x + '" y="' + sy(r.c) + '" width="' + bw + '" height="' + (sy(100) - sy(r.c)) + '"/>');
          if (on) g.push('<rect class="hl" x="' + (x - 3) + '" y="' + (sy(r.c) - 3) + '" width="' + (bw + 6) + '" height="' + (B - sy(r.c) + 3) + '"/>');
          if (on && r.ioi) g.push('<rect class="ioib" x="' + x + '" y="' + sy(r.c) + '" width="' + bw + '" height="6"/>');
          g.push(t(cx(i), sy(r.c) - 8, usd(r.c), 'vl' + (on ? ' on' : ''), 'middle'));
          if (r.y >= 2) g.push(t(cx(i), sy(r.c) - 24, '差 ' + usd(r.d), 'df', 'middle'));
          if (on && r.ioi) g.push(t(cx(i) + bw / 2 + 6, sy(r.c) + 14, '利息的利息', 'ioi', 'start') + t(cx(i) + bw / 2 + 6, sy(r.c) + 30, '+' + usd(r.ioi), 'ioi b', 'start'));
          if (on && r.yr) g.push(t(cx(i) - bw / 2 - 6, sy(r.c) + 14, '这一年的利息', 'ioi', 'end') + t(cx(i) - bw / 2 - 6, sy(r.c) + 30, usd(r.yr), 'ioi b', 'end'));
          if (r.y >= 1) pts.push([cx(i), sy(r.s)]);
        });
        if (pts.length > 1) g.push('<polyline class="sl" points="' + pts.map(p => p.join(',')).join(' ') + '"/>');
        pts.forEach(p => g.push('<line class="sl" x1="' + (p[0] - bw / 2 - 4) + '" x2="' + (p[0] + bw / 2 + 4) + '" y1="' + p[1] + '" y2="' + p[1] + '"/>'));
      } else {
        const rowH = 60, L = 58, R = W - 76, T = 22;
        H = T + F1.length * rowH + 8;
        const sx = v => L + v / max * (R - L);
        ticks.forEach(v => g.push('<line class="g" y1="' + (T - 4) + '" y2="' + (H - 8) + '" x1="' + sx(v) + '" x2="' + sx(v) + '"/>' + t(sx(v), 12, '$' + v, 'ax', 'middle')));
        const pts = [];
        F1.forEach((r, i) => {
          const y = T + i * rowH, on = i === shown && !stat;
          g.push(t(0, y + 13, yl(r.y), 'yl' + (on ? ' on' : ''), 'start'));
          if (i > shown) return;
          g.push('<rect class="pr" x="' + L + '" y="' + y + '" height="18" width="' + (sx(100) - L) + '"/>');
          if (r.c > 100) g.push('<rect class="in" x="' + sx(100) + '" y="' + y + '" height="18" width="' + (sx(r.c) - sx(100)) + '"/>');
          if (on) g.push('<rect class="hl" x="' + L + '" y="' + (y - 3) + '" height="24" width="' + (sx(r.c) - L + 3) + '"/>');
          if (on && r.ioi) g.push('<rect class="ioib" x="' + (sx(r.c) - 6) + '" y="' + y + '" width="6" height="18"/>');
          g.push(t(sx(r.c) + 6, y + 14, usd(r.c), 'vl' + (on ? ' on' : ''), 'start'));
          const extra = [];
          if (r.y >= 1) extra.push('单利 ' + usd(r.s));
          if (r.y >= 2) extra.push('差 ' + usd(r.d));
          if (extra.length) g.push(t(L, y + 34, extra.join(' · '), 'df', 'start'));
          if (on && r.ioi) g.push(t(L, y + 50, '利息的利息 +' + usd(r.ioi), 'ioi b', 'start'));
          if (on && r.yr) g.push(t(L, y + 50, '这一年的利息 ' + usd(r.yr), 'ioi b', 'start'));
          if (r.y >= 1) pts.push([sx(r.s), y]);
        });
        pts.forEach(p => g.push('<line class="sl" x1="' + p[0] + '" x2="' + p[0] + '" y1="' + (p[1] - 4) + '" y2="' + (p[1] + 22) + '"/>'));
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.innerHTML = '<title id="fig1-alt">' + alt(shown) + '</title>' + g.join('');
    }
    function alt(k) {
      return '复利余额：' + F1.slice(0, k + 1).map(r => yl(r.y) + ' ' + usd(r.c) + (r.y ? '（单利 ' + usd(r.s) + '）' : '')).join('，');
    }
    const steps = [
      { label: '今天', what: '存入本金 $100。', why: '每年按 5% 计息，利息留在账上。', learn: '墨色这一段始终是本金 $100。' },
      { label: '第 1 年', what: '余额 $105.00 = $100 + $100 × 5%。', why: '第一年只有本金在生息，单利同样是 $105.00。', learn: '第一年，复利和单利没有差别。' },
      { label: '第 2 年', what: '余额 $110.25，单利 $110.00，差 $0.25。', why: '第二年按 $105 计息，利息 $5.25，其中 $0.25 是第一年那 $5 利息生出的利息。', learn: '荧光标出的 $0.25 就是利息的利息。' },
      { label: '第 3 年', what: '余额 $115.76，单利 $115.00，差 $0.76。', why: '这一年新增的利息的利息是 $0.51，比上一年的 $0.25 多。', learn: '利息的利息每年都在变大。' },
      { label: '跳到第 10 年', what: '余额 $162.89，单利 $150.00，差 $12.89。', why: '每一年都把账上的数乘以 1.05，十年连乘十次。', learn: '纵轴换成了更大的刻度，前几年的柱子相对变矮。' },
      { label: '跳到第 20 年', what: '余额 $265.33，单利 $200.00，差 $65.33。', why: '单利每年只多 $5；复利每年多同样的比例。', learn: '差距越拉越快。' },
      { label: '跳到第 30 年', what: '余额 $432.19，单利 $250.00，差 $182.19。', why: '光是第 30 年这一年的利息就有 $20.58，是第一年 $5 的四倍多。', learn: '复利增加的是比例，账上越多，5% 对应的金额越大。' }
    ];
    const nextLab = ['再过一年', '再过一年', '再过一年', '跳到第 10 年', '跳到第 20 年', '跳到第 30 年', '下一步'];
    stepper(el, {
      steps,
      render(step, s) { cur = step; stat = s; draw(); },
      after(step, b) { b.next.textContent = nextLab[step]; }
    });
    let rw = 0;
    new ResizeObserver(() => { if (stage.clientWidth !== rw) { rw = stage.clientWidth; draw(); } }).observe(stage);
  })();

  /* ---------- 图 2：72 法则准不准（课文第 4 节的表） ---------- */
  const F2 = [
    { r: 1, a: 72.00, e: 69.66, d: 2.34 },
    { r: 3, a: 24.00, e: 23.45, d: 0.55 },
    { r: 5, a: 14.40, e: 14.21, d: 0.19 },
    { r: 8, a: 9.00, e: 9.01, d: -0.01 },
    { r: 10, a: 7.20, e: 7.27, d: -0.07 },
    { r: 20, a: 3.60, e: 3.80, d: -0.20 }
  ];
  function radios(group, onPick) {
    const bs = [...group.querySelectorAll('button')];
    function pick(i, focus) {
      bs.forEach((b, j) => { b.setAttribute('aria-checked', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      if (focus) bs[i].focus();
      onPick(i);
    }
    bs.forEach((b, i) => b.addEventListener('click', () => pick(i)));
    group.addEventListener('keydown', e => {
      const i = bs.indexOf(document.activeElement); if (i < 0) return;
      let k = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % bs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i + bs.length - 1) % bs.length;
      else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = bs.length - 1;
      if (k >= 0) { e.preventDefault(); pick(k, true); }
    });
    return pick;
  }
  (function () {
    const el = $('fig2'); if (!el) return;
    const yr = v => v.toFixed(2) + ' 年';
    radios(el.querySelector('.f2-rates'), i => {
      const r = F2[i], top = Math.max(r.a, r.e) / 0.92;
      $('fig2-a').style.width = (r.a / top * 100).toFixed(2) + '%';
      $('fig2-b').style.width = (r.e / top * 100).toFixed(2) + '%';
      $('fig2-av').textContent = yr(r.a);
      $('fig2-bv').textContent = yr(r.e);
      const how = r.d > 0 ? '多算 ' + r.d.toFixed(2) + ' 年' : '少算 ' + Math.abs(r.d).toFixed(2) + ' 年';
      $('fig2-out').innerHTML = r.r + '%：72 法则 ' + yr(r.a) + '，精确 ' + yr(r.e) + '，<b>' + how + '</b>';
    })(2);
  })();

  /* ---------- 图 3：时间轴上的折现 ---------- */
  const PV10 = [95.24, 90.70, 86.38, 82.27, 78.35, 74.62, 71.07, 67.68, 64.46, 61.39];   // 往回折 1 至 10 年
  const sup = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
  const tick = k => k === 0 ? '今天' : k + ' 年后';
  (function () {
    const el = $('fig3'); if (!el) return;
    const axis = $('fig3-axis'), eq = $('fig3-eq');
    axis.innerHTML = Array.from({ length: 11 }, (_, k) => '<li data-k="' + k + '"><span class="tk">' + tick(k) + '</span><span class="coin"></span></li>').join('');
    const cells = [...axis.children];
    // 每一步：钱在哪一格（at）、显示多少（v）、经过的格子留下的数（trail）、算式
    const S = [
      { at: 1, v: 100, eq: '$100 放在 1 年后' },
      { at: 0, v: 95.24, ghost: [[1, 100]], eq: '100 ÷ 1.05 = 95.24' },
      { at: 1, v: 100, ghost: [[0, 95.24]], eq: '95.24 × 1.05 ≈ 100 · 同一条路，两个方向' },
      { at: 10, v: 100, eq: '$100 放在 10 年后' }
    ];
    PV10.forEach((v, i) => {
      const n = i + 1, ghost = [[10, 100]];
      for (let j = 0; j < i; j++) ghost.push([9 - j, PV10[j]]);
      S.push({ at: 9 - i, v, ghost, eq: '100 ÷ 1.05' + (n > 1 ? sup(n) : '') + ' = ' + v.toFixed(2) });
    });
    function paint(st) {
      cells.forEach(c => { c.className = ''; c.querySelector('.coin').textContent = ''; });
      (st.ghost || []).forEach(([k, v]) => { cells[k].classList.add('gh'); cells[k].querySelector('.coin').textContent = usd(v); });
      cells[st.at].classList.add('on'); cells[st.at].querySelector('.coin').textContent = usd(st.v);
      eq.textContent = st.eq;
    }
    const steps = [
      { label: '1 年后的 $100', what: '$100 放在「1 年后」。', why: '朋友答应明年给小林 $100。', learn: '先问：它今天值多少？' },
      { label: '往回折一年', what: '移到「今天」，变成 $95.24。', why: '100 ÷ 1.05 = 95.24。', learn: '折现就是往回除一次 1.05。' },
      { label: '按 5% 存一年', what: '今天的 $95.24 存一年，回到 1 年后，又是 $100。', why: '95.24 × 1.05 ≈ 100。', learn: '同一条路，两个方向：复利往后乘，折现往回除。' },
      { label: '10 年后的 $100', what: '把 $100 放在「10 年后」。', why: '越远的钱，要往回除越多次。', learn: '每按一次，往回退一年。' }
    ];
    PV10.forEach((v, i) => {
      const n = i + 1, k = 10 - n;
      steps.push({ label: '往回折到' + (k ? '第 ' + k + ' 年末' : '今天'), what: (k ? '第 ' + k + ' 年末' : '今天') + '：$' + v.toFixed(2) + '。', why: '100 ÷ 1.05' + (n > 1 ? sup(n) : '') + ' = ' + v.toFixed(2) + '。', learn: k ? (n <= 3 ? '和课文里一年一年往回除的手算一致。' : '离今天越近，往回除的次数越多。') : '10 年后的 $100，今天值 $61.39。' });
    });
    const nextLab = i => i === 0 ? '往回折一年' : i === 1 ? '按 5% 存一年' : i === 2 ? '换成 10 年后的 $100' : i < 13 ? '往回折一年' : '下一步';
    const gb = [...el.querySelectorAll('button[data-g]')];
    const api = stepper(el, {
      steps,
      render(step, s) {
        if (s) {
          const all = { at: 0, v: 61.39, ghost: [[10, 100]].concat(PV10.slice(0, 9).map((v, j) => [9 - j, v])), eq: '' };
          paint(all);
        } else paint(S[step]);
        gb.forEach(b => b.setAttribute('aria-pressed', String((step >= 3) === (b.dataset.g === '3'))));
        gb.forEach(b => { b.disabled = s; });
      },
      after(step, b) { b.next.textContent = nextLab(step); }
    });
    gb.forEach(b => b.addEventListener('click', () => api.show(+b.dataset.g)));
  })();

  /* ---------- 图 4：同一个价格，四种报价与回报口径 ---------- */
  const F4 = [
    { k: '银行贴现率', v: 4.290, den: 'face', say: '银行贴现率：$4.337667 ÷ 面值 $100 × 360 ÷ 364 = 4.290%，一年按 360 天，是报价与投标用的数，不是买家的回报' },
    { k: '投资利率', v: 4.496, den: '', say: '' },
    { k: '持有期回报', v: 4.534, den: 'price', say: '持有期回报：$4.337667 ÷ 价格 $95.662333 = 4.534%，364 天，不年化，是买家的持有期回报' },
    { k: '单利年化', v: 4.547, den: 'price', say: '单利年化：4.5344% × 365 ÷ 364 ≈ 4.547%，按 365 天、单利，把同一笔回报写成年率，不是另一笔收益' }
  ];
  F4[1].say = '投资利率：95.662333 × [1 + (364 − 365 ÷ 2) × i ÷ 365] × (1 + i ÷ 2) = 100，解出 i ≈ 4.496%；假想前半年 182.5 天按年利率的一半增长，剩下 181.5 天按单利；365 天，假设半年复利，是标准化的换算口径，国库券不付息票，半年时没有任何付款';
  const ORDER = [0, 2, 3, 1];   // 按钮顺序：贴现率、持有期、单利年化、投资利率 → F4 下标
  (function () {
    const el = $('fig4'); if (!el) return;
    const panels = [...el.querySelectorAll('.f4-p')], chips = [...el.querySelectorAll('.f4-den .chip')], den = $('fig4-den'), ax = $('fig4-ax');
    panels.forEach(p => { p.hidden = false; });
    document.querySelectorAll('.f3-static').forEach(p => { p.hidden = false; }); // 图 3 的两行等式：只在减少动态效果和打印时由 CSS 显示 // 页面原文里后三块带 hidden（搜索索引只收第一块）；脚本接管后由 .on / .all 控制显示
    const lo = 4.25, hi = 4.62, pos = v => ((v - lo) / (hi - lo) * 100).toFixed(2) + '%';
    const side = ['up c', 'dn r', 'up c', 'dn l'];
    ax.innerHTML = F4.map((r, i) => '<span class="pt ' + side[i] + '" data-i="' + i + '" style="left:' + pos(r.v) + '"><i></i><em>' + r.v.toFixed(3) + '%<small>' + r.k + '</small></em></span>').join('');
    const pts = [...ax.children];
    const pick = radios(el.querySelector('.f4-tabs'), b => {
      const r = F4[ORDER[b]];
      panels.forEach((p, j) => p.classList.toggle('on', j === b));
      den.hidden = !r.den;
      chips.forEach(c => c.classList.toggle('on', c.dataset.d === r.den));
      pts.forEach((p, j) => p.classList.toggle('on', j === ORDER[b]));
      $('fig4-out').textContent = r.say;
    });
    pick(0);
    const st = s => el.classList.toggle('all', s);
    st(isStatic()); onMode(st);
  })();

  window.S0103 = { F1, F2, PV10, F4 };
})();
