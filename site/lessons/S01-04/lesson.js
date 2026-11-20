/* S01-04 的图。图 1、图 2 是选择器，只停在下面写定的几个取值上；图 3 是静态图（在页面里直接写好）。不自动播放 */
(function () {
  'use strict';
  const { isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);

  /* 按钮组：点按或用左右键切换，aria-pressed 标出当前选中 */
  function seg(group, pick) {
    const bs = [...group.querySelectorAll('button[data-k]')];
    const set = k => { bs.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.k === k))); pick(k); };
    group.addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) set(+b.dataset.k); });
    group.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const i = bs.indexOf(document.activeElement); if (i < 0) return;
      const j = (i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length;
      e.preventDefault(); bs[j].focus(); set(j);
    });
    return set;
  }
  /* 减少动态效果或打印时，把表格视图一并展开 */
  function tables(fig) {
    const d = fig.querySelector('details.tbl'); if (!d) return;
    const st = s => { if (s) d.open = true; };
    st(isStatic()); onMode(st);
  }

  /* ---------- 图 1：多了美元，还是多了篮子 ---------- */
  const F1 = [
    { pi: '1%', px: '$101', n: 101.98, ns: '101.98 个', pp: '$10,198.02', r: '+1.98%', d: '多了 1.98 个', lab: '+1.98 个' },
    { pi: '3%', px: '$103', n: 100, ns: '100.00 个', pp: '$10,000.00', r: '0', d: '不多不少', lab: '' },
    { pi: '6%', px: '$106', n: 97.17, ns: '97.17 个', pp: '$9,716.98', r: '−2.83%', d: '少了 2.83 个', lab: '−2.83 个' }
  ];
  (function () {
    const fig = $('fig1'); if (!fig) return;
    const svg = $('fig1-svg');
    const X0 = 92, CW = 32, X = c => X0 + (c - 94) * CW;   // 第 95 个篮子占 94→95 这一格
    function basket(k, frac, lost) {
      const x = X0 + (k - 95) * CW, id = 'f1c' + k;
      const body = `M${x + 4} 58 L${x + 28} 58 L${x + 25} 86 L${x + 7} 86 Z`;
      return `<clipPath id="${id}"><rect x="${x}" y="40" width="${(frac * CW).toFixed(2)}" height="50"/></clipPath>` +
        `<path class="hd${lost ? ' lost' : ''}" d="M${x + 8} 58 Q${x + 16} 40 ${x + 24} 58"/>` +
        `<path class="bd${lost ? ' lost' : ''}" d="${body}"/>` +
        (frac > 0 ? `<path class="fl" d="${body}" clip-path="url(#${id})"/>` : '');
    }
    function draw(k) {
      const s = F1[k], n = s.n, a = Math.min(n, 100), b = Math.max(n, 100);
      let g = '';
      if (b > a) {
        g += `<rect class="band" x="${X(a).toFixed(1)}" y="30" width="${(X(b) - X(a)).toFixed(1)}" height="64" rx="4"/>`;
        g += `<text class="bl" x="${((X(a) + X(b)) / 2).toFixed(1)}" y="22" text-anchor="middle">${s.lab}</text>`;
      }
      g += `<rect class="blk" x="4" y="44" width="76" height="44" rx="6"/><text class="blt" x="42" y="63" text-anchor="middle">第 1–94 个</text><text class="blt s" x="42" y="79" text-anchor="middle">都还在</text>`;
      for (let i = 95; i <= 103; i++) {
        const frac = Math.max(0, Math.min(1, n - (i - 1)));
        if (i > 100 && frac === 0) continue;
        g += basket(i, frac, i <= 100 && frac < 1);
      }
      g += `<line class="base" x1="${X(100)}" x2="${X(100)}" y1="30" y2="104"/><text class="basel" x="${X(100)}" y="120" text-anchor="middle">年初 100 个</text>`;
      svg.innerHTML = g;
      $('fig1-px').textContent = s.px;
      $('fig1-n').textContent = s.ns;
      const d = $('fig1-d'); d.textContent = s.d; d.classList.toggle('hl', !!s.lab);
      $('fig1-pp').textContent = s.pp;
      $('fig1-r').textContent = s.r;
      $('fig1-out').textContent = '通胀 ' + s.pi + '：账上 $10,300，能买 ' + s.ns + '篮子，与年初相比' + s.d + '；按年初价格算相当于 ' + s.pp + '，实际回报 ' + s.r;
    }
    seg($('fig1-seg'), draw)(1);
    tables(fig);
  })();

  /* ---------- 图 2：一笔合同，两个人 ---------- */
  const F2 = [
    { pi: '如预期 2%', v: '$10,294.12', l: '0', lt: '得到了想要的', b: '0', bt: '付出了预想的', f: '购买力没有转移', hl: false },
    { pi: '意外高 6%', v: '$9,905.66', l: '−$388.46', lt: '少得的购买力', b: '+$388.46', bt: '少还的购买力', f: '购买力 $388.46：小林 → 朋友', hl: true },
    { pi: '意外低 1%', v: '$10,396.04', l: '+$101.92', lt: '多得的购买力', b: '−$101.92', bt: '多付的购买力', f: '购买力 $101.92：朋友 → 小林', hl: true }
  ];
  (function () {
    const fig = $('fig2'); if (!fig) return;
    function draw(k) {
      const s = F2[k];
      $('fig2-v').textContent = s.v;
      $('fig2-l').textContent = s.l; $('fig2-lt').textContent = s.lt;
      $('fig2-b').textContent = s.b; $('fig2-bt').textContent = s.bt;
      $('fig2-l').classList.toggle('hl', s.hl); $('fig2-b').classList.toggle('hl', s.hl);
      const f = $('fig2-f'); f.textContent = s.f; f.classList.toggle('on', s.hl);
      $('fig2-out').textContent = '通胀' + s.pi + '：$10,500 按年初价格值 ' + s.v + '。与预期相比，小林 ' + s.l + '，朋友 ' + s.b + '；' + s.f.replace('→', '转给');
    }
    seg($('fig2-seg'), draw)(0);
    tables(fig);
  })();

  /* ---------- 图 3：静态图，只需在减少动态效果或打印时展开表格 ---------- */
  if ($('fig3')) tables($('fig3'));

  window.S0104 = { F1, F2 };
})();
