/* S01-05 的两张图。数字取自课文：2026 年 11 月 12 日的 H.15、两个联储模型的同日估计。 */
(function () {
  'use strict';
  const { stepper, reveal, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);

  /* ---------- 图 1：同一个 10 年，两种分法 ---------- */
  const M = [
    { k: 'acm', name: ['纽约联储', 'ACM 模型'], exp: 4.39, tp: 0.68, fit: '约 5.07%' },
    { k: 'kw', name: ['联储理事会', 'Kim–Wright 模型'], exp: 4.13, tp: 0.97, fit: '约 5.10%' }
  ];
  const DIFF = { tp: '0.29', exp: '0.26' };
  (function () {
    const fig = $('fig1'); if (!fig) return;
    const svg = $('fig1-svg'), seg = $('fig1-seg'), out = $('fig1-v');
    const T = 44, B = 312, MAX = 5.5, y = v => B - v / MAX * (B - T);
    const X = [50, 212], W = 84, CX = (X[0] + W + X[1]) / 2;
    const p = [];
    p.push('<defs><pattern id="f1-h" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" class="hb"/><line x1="0" y1="0" x2="0" y2="9" class="hl"/></pattern></defs>');
    for (let v = 0; v <= 5; v++) p.push('<line x1="36" x2="312" y1="' + y(v) + '" y2="' + y(v) + '" class="g' + (v ? '' : ' z') + '"/><text x="31" y="' + (y(v) + 5) + '" class="ax" text-anchor="end">' + v + '%</text>');
    M.forEach((m, i) => {
      const x = X[i], cx = x + W / 2, top = m.exp + m.tp;
      p.push('<g class="sg exp" data-part="exp"><rect x="' + x + '" y="' + y(m.exp) + '" width="' + W + '" height="' + (B - y(m.exp)) + '" class="ink"/>' +
        '<text x="' + cx + '" y="' + (y(m.exp) + 34) + '" class="in big" text-anchor="middle">' + m.exp.toFixed(2) + '%</text>' +
        '<text x="' + cx + '" y="' + (y(m.exp) + 58) + '" class="in" text-anchor="middle">预期平均</text>' +
        '<text x="' + cx + '" y="' + (y(m.exp) + 76) + '" class="in" text-anchor="middle">短期利率</text></g>');
      p.push('<g class="sg tp" data-part="tp"><rect x="' + x + '" y="' + y(top) + '" width="' + W + '" height="' + (y(m.exp) - y(top)) + '" fill="url(#f1-h)" class="hx"/>' +
        '<text x="' + cx + '" y="' + ((y(top) + y(m.exp)) / 2 + 6) + '" class="tv" text-anchor="middle">' + m.tp.toFixed(2) + '%</text></g>');
      p.push('<text x="' + cx + '" y="' + (y(top) - 10) + '" class="fit" text-anchor="middle">' + m.fit + '</text>');
      p.push('<text x="' + cx + '" y="' + (B + 24) + '" class="nm" text-anchor="middle">' + m.name[0] + '</text><text x="' + cx + '" y="' + (B + 44) + '" class="nm b" text-anchor="middle">' + m.name[1] + '</text>');
    });
    // 期限溢价段之间的连线
    const a = M[0], b = M[1];
    const ya = y(a.exp + a.tp / 2), yb = y(b.exp + b.tp / 2);
    const lab = (y0, name, d) => ['<tspan class="t">' + name + '</tspan>', '相差', '<tspan class="d">' + d + '</tspan>', '个百分点']
      .map((t, i) => '<text x="' + CX + '" y="' + (y0 + i * 18) + '" text-anchor="middle">' + t + '</text>').join('');
    p.push('<g class="cn" data-part="tp"><line x1="' + (X[0] + W) + '" y1="' + ya + '" x2="' + X[1] + '" y2="' + yb + '"/>' + lab(ya + 26, '期限溢价', DIFF.tp) + '</g>');
    // 预期部分顶端之间的连线（只在看预期部分时出现）
    const ea = y(a.exp), eb = y(b.exp);
    p.push('<g class="cn ce" data-part="exp"><line x1="' + (X[0] + W) + '" y1="' + ea + '" x2="' + X[1] + '" y2="' + eb + '"/>' + lab(eb + 28, '预期部分', DIFF.exp) + '</g>');
    svg.innerHTML = p.join('');
    const TXT = {
      all: 'ACM：预期平均短期利率 4.39% + 期限溢价 0.68%；Kim–Wright：4.13% + 0.97%。同一天、同一个 10 年，两种分法',
      exp: '预期平均短期利率：ACM 4.39%，Kim–Wright 4.13%，相差 0.26 个百分点',
      tp: '期限溢价：ACM 0.68%，Kim–Wright 0.97%，相差 0.29 个百分点'
    };
    const btns = [...seg.querySelectorAll('button')];
    function set(v) {
      fig.dataset.hl = v;
      btns.forEach(x => { const on = x.dataset.v === v; x.setAttribute('aria-pressed', String(on)); x.tabIndex = on ? 0 : -1; });
      out.textContent = TXT[v];
    }
    seg.addEventListener('click', e => { const x = e.target.closest('button'); if (x) set(x.dataset.v); });
    seg.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = btns.indexOf(document.activeElement); if (i < 0) return;
      const j = (i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length;
      e.preventDefault(); btns[j].focus(); set(btns[j].dataset.v);
    });
    const st = s => { if (s) set('all'); };
    onMode(st);
    set('all');
  })();

  /* ---------- 图 2：以国债为尺子，同一天高出多少（第 1–4 步） ---------- */
  (function () {
    const el = $('fig2'); if (!el) return;
    const S = stepper(el, {
      steps: [
        { label: '期限：10 年比 3 个月', what: '同一个借款人，10 年期国债 5.10%，3 个月期国债 4.32%，高出 0.78 个百分点', why: '借得更久，利率里既有对未来短期利率的预期，也有期限溢价', learn: '两者各占多少，只能用模型估计（见图 1）' },
        { label: '换一个借款人：优惠利率', what: '优惠利率 7.00%，比 3 个月期国债高 2.68 个百分点', why: '银行借钱给企业，要考虑违约风险、审查与管理的成本、自己的资金成本，也有利润', learn: '各占多少，H.15 没有说，也给不出经过核实的分法' },
        { label: '通胀补偿：普通国债比 TIPS', what: '10 年期国债 5.10%，10 年期 TIPS 2.86%，相减得 2.24 个百分点', why: '这是用减法得到的近似值；按复利精确计算，按年约 2.18%，按半年约 2.21%', learn: '它不等于预期通胀，还含通胀风险溢价，并受 TIPS 流动性溢价影响' },
        { label: '另起一张：观察期不同的两组', what: '高质量公司债比 10 年期国债高 0.79 个百分点（2026 年 10 月月平均）；信用卡全部账户比 8 月优惠利率高约 14.4 个百分点', why: '这两组的时期和上面三组不同，放进同一列会让人误以为是同一天的数', learn: '信用卡这一组只是示意：季度数对 8 月的数，口径也不完全对得上' }
      ],
      render(step, s) { reveal(el, step + 1, s); }
    });
    const all = el.querySelector('[data-a=all]');
    all.addEventListener('click', () => S.show(3));
    window.S0105 = { M, DIFF, fig2: S };
  })();
})();
