/* S01-02 的四张图。银行与人物均为虚构；所有金额按美元整数记账，不自动播放。 */
(function () {
  'use strict';
  const { stepper, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);
  const YI = 100000000;
  const LOAN = 30000;
  const usd = v => '$' + Math.abs(v).toLocaleString('en-US');
  const yi = v => String(Math.round(v / YI * 100) / 100) + ' 亿';
  /* 「6 亿 + $30,000」：起点用亿，变化用美元 */
  const show = (v, s) => { const d = v - s; return d === 0 ? yi(s) : yi(s) + (d > 0 ? ' + ' : ' − ') + usd(d); };

  /* ---------- 起点：S01-01 的河岸银行与同样简化的松石银行 ---------- */
  const START = {
    R: { res: 120000000, oth: 280000000, loan: 600000000, dep: 900000000, eq: 100000000 },  // 其他资产 = 金库现金 0.1 亿 + 证券 2.7 亿
    P: { res: 80000000, oth: 156000000, loan: 364000000, dep: 540000000, eq: 60000000 },    // 其他资产 = 0.06 亿 + 1.5 亿
    F: { R: 120000000, P: 80000000 }                                                       // 联储：欠河岸 / 欠松石
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  const A = b => b.res + b.oth + b.loan, L = b => b.dep + b.eq;
  const NAMES = { R: '河岸银行', P: '松石银行' };
  const ROWS = { a: [['res', '准备金'], ['oth', '其他资产'], ['loan', '贷款']], l: [['dep', '存款'], ['eq', '股东权益']] };

  /* 两张 T 型账户 + （可选）联储小账 + 整个体系 */
  function books(stage, pre, withFed) {
    const tee = k => '<div class="tb" id="' + pre + k + '"><p class="tb-name">' + NAMES[k] + '</p><div class="tb-t">' +
      ['a', 'l'].map(side => '<div class="tb-side"><span class="th-h">' + (side === 'a' ? '资产' : '负债与股东权益') + '</span>' +
        ROWS[side].map(([f, t]) => '<div class="tb-row" data-f="' + f + '"><span>' + t + '</span><b></b></div>').join('') +
        (side === 'l' ? '<div class="tb-row pend" hidden><span>待结算</span><b>' + usd(LOAN) + '</b></div>' : '') +
        '<div class="tb-row tot" data-f="' + side + '"><span>合计</span><b></b></div></div>').join('') + '</div></div>';
    stage.innerHTML = '<p class="tb-note" id="' + pre + 'note"></p><div class="tb-grid' + (withFed ? ' fed' : '') + '">' + tee('R') + tee('P') +
      (withFed ? '<div class="tb fd" id="' + pre + 'F"><p class="tb-name">联储 · 准备金账户</p><div class="tb-row" data-f="R"><span>欠河岸</span><b></b></div><div class="tb-row" data-f="P"><span>欠松石</span><b></b></div><div class="tb-row tot"><span>合计</span><b></b></div></div>' : '') +
      '<div class="tb sy" id="' + pre + 'S"><p class="tb-name">整个体系 · 两家合计，相对起点</p><div class="tb-row" data-f="dep"><span>存款</span><b></b></div><div class="tb-row" data-f="res"><span>准备金</span><b></b></div></div></div>';
    const set = (row, txt, full, chg, neg) => {
      const b = row.querySelector('b'); b.textContent = txt;
      if (full) b.title = full; else b.removeAttribute('title');
      row.classList.toggle('chg', !!chg); row.classList.toggle('neg', !!neg);
    };
    const full = v => '$' + v.toLocaleString('en-US');
    return function draw(st, prev, opt) {
      opt = opt || {};
      for (const k of ['R', 'P']) {
        const box = $(pre + k), b = st[k], s = START[k], p = prev[k];
        for (const side of ['a', 'l']) for (const [f] of ROWS[side]) set(box.querySelector('[data-f=' + f + ']'), show(b[f], s[f]), full(b[f]), b[f] !== p[f], b[f] < p[f]);
        const pend = opt.pend === k;
        box.querySelector('.pend').hidden = !pend;
        const ta = box.querySelector('[data-f=a]'), tl = box.querySelector('[data-f=l]');
        set(ta, show(A(b), A(s)), full(A(b))); set(tl, show(L(b), L(s)), full(L(b)));
        box.classList.toggle('uneq', A(b) !== L(b));
      }
      if (withFed) {
        const fd = $(pre + 'F');
        set(fd.querySelector('[data-f=R]'), show(st.F.R, START.F.R), full(st.F.R), st.F.R !== prev.F.R, st.F.R < prev.F.R);
        set(fd.querySelector('[data-f=P]'), show(st.F.P, START.F.P), full(st.F.P), st.F.P !== prev.F.P, st.F.P < prev.F.P);
        set(fd.querySelector('.tot'), show(st.F.R + st.F.P, START.F.R + START.F.P), full(st.F.R + st.F.P), st.F.R + st.F.P !== prev.F.R + prev.F.P);
        fd.classList.toggle('off', !!opt.fedOff);
      }
      const sy = $(pre + 'S');
      const dD = st.R.dep + st.P.dep - START.R.dep - START.P.dep, dR = st.R.res + st.P.res - START.R.res - START.P.res;
      const pD = prev.R.dep + prev.P.dep - START.R.dep - START.P.dep;
      set(sy.querySelector('[data-f=dep]'), dD === 0 ? '0（14.4 亿）' : (dD > 0 ? '+' : '−') + usd(dD), full(st.R.dep + st.P.dep), dD !== pD, dD < pD);
      set(sy.querySelector('[data-f=res]'), dR === 0 ? '0（2 亿不变）' : (dR > 0 ? '+' : '−') + usd(dR), full(st.R.res + st.P.res));
      const note = $(pre + 'note'); note.textContent = opt.note || ''; note.classList.toggle('slip', !!opt.slip);
    };
  }

  /* 按顺序施加的变化：[银行, 字段, 金额] */
  function run(moves) {
    const out = [clone(START)];
    for (const m of moves) { const st = clone(out[out.length - 1]); for (const [k, f, v] of m) (k === 'F' ? st.F : st[k])[f] += v; out.push(st); }
    return out;
  }

  /* ---------- 图 1：一笔贷款的三步（0、1、2a–2d、3） ---------- */
  const F1 = run([
    [['R', 'loan', LOAN], ['R', 'dep', LOAN]],                                              // 1 批准贷款
    [],                                                                                       // 2a 付款指令
    [['R', 'dep', -LOAN]],                                                                    // 2b 河岸减少小周的存款
    [['F', 'R', -LOAN], ['F', 'P', LOAN], ['R', 'res', -LOAN], ['P', 'res', LOAN]],         // 2c 通过联储结算
    [['P', 'dep', LOAN]],                                                                     // 2d 松石记入车商的存款
    [['R', 'dep', LOAN], ['R', 'res', LOAN], ['F', 'R', LOAN]],                              // 3a 一年后小周攒下 $30,000 工资，从图外的别家银行转入（那家银行的准备金 −$30,000 不画）
    [['R', 'loan', -LOAN], ['R', 'dep', -LOAN]]                                               // 3b 还清本金：600,000,000 / 900,000,000
  ]);
  const F1CODE = ['0', '1', '2a', '2b', '2c', '2d', '3a', '3b'];
  const F1OPT = [
    { note: '起点：两张表左右各自相等', fedOff: true },
    { note: '一张借条换一张借条，准备金不动', fedOff: true },
    { note: '小周 → 河岸银行：付给松石银行的车商 $30,000', slip: true },
    { note: '答应替小周付出去，这笔钱还没付', pend: 'R' },
    { note: '准备金在联储的账上换了名下', pend: 'P' },
    { note: '存款搬家，准备金跟着走' },
    { note: '工资从别家银行转入，本图不画那一家' },
    { note: '还款消灭的是小周的 $30,000，车商的存款还在' }
  ];
  (function () {
    const el = $('fig1'); if (!el) return;
    const draw = books($('fig1-stage'), 'fig1-', true);
    const tbl = $('fig1-tbl');
    stepper(el, {
      first: 0,
      steps: [
        { label: '起点', what: '河岸银行：准备金 1.2 亿、其他资产 2.8 亿、贷款 6 亿；存款 9 亿、股东权益 1 亿。松石银行：准备金 0.8 亿、其他资产 1.56 亿、贷款 3.64 亿；存款 5.4 亿、股东权益 0.6 亿。', why: '河岸左右都是 10 亿，松石左右都是 6 亿。', learn: '两家准备金合计 2 亿，存款合计 14.4 亿。' },
        { label: '批准贷款', what: '河岸银行左边贷款 +$30,000，右边小周的存款 +$30,000。', why: '小周给银行一张「我欠你」的借条，银行回给他一张可以直接拿去付款的借条。', learn: '准备金一分没动；体系存款多了 $30,000。' },
        { label: '小周发出付款指令', what: '小周让河岸银行付给松石银行的车商 $30,000。', why: '这只是一条指令，两家银行的账都还没动。', learn: '接下来分三小步走完一笔跨行转账。' },
        { label: '河岸减少小周的存款', what: '河岸银行 小周的存款 −$30,000。', why: '它少欠小周 $30,000，但答应替他付给车商，这笔钱还没付出去。', learn: '此刻河岸左边比右边多 $30,000，就是虚线里待结算的那笔。' },
        { label: '通过联储结算', what: '联储 欠河岸 −$30,000、欠松石 +$30,000；河岸准备金 −$30,000，松石准备金 +$30,000。', why: '两家银行之间用准备金在联储的账上结清。', learn: '联储欠两家银行的合计仍是 2 亿，只是换了名下；松石还没给车商记账。' },
        { label: '松石记入车商的存款', what: '松石银行 车商的存款 +$30,000。', why: '松石多了一笔准备金，同时多欠车商一笔。', learn: '体系存款仍多 $30,000，准备金合计 2 亿不变：存款搬家，准备金跟着走。' },
        { label: '一年后：攒下工资', what: '小周的工资打在河岸银行，一年后账上攒下了 $30,000：河岸 小周的存款 +$30,000、准备金 +$30,000；联储 欠河岸 +$30,000。', why: '工资从这两家之外的一家银行转入，经联储结算：联储小账多出的 $30,000，是从图外那家银行转来的准备金，不是联储凭空多出来的。', learn: '还款前，河岸贷款仍是 6 亿 + $30,000，存款是 9 亿 + $30,000。' },
        { label: '还清本金', what: '河岸银行 贷款 −$30,000、小周的存款 −$30,000（只看本金，利息另计）。', why: '两张借条互相抵掉，资产负债表两边同时缩小。', learn: '河岸贷款 6 亿、存款 9 亿。还款消灭的是小周的 $30,000；车款变成的车商存款还在松石，所以两家存款合计仍比起点多 $30,000。' }
      ],
      render(step, s) {
        const i = s ? 7 : step;
        draw(F1[i], F1[Math.max(0, i - 1)], s ? { note: '还款消灭的是小周的 $30,000，车商的存款还在' } : F1OPT[i]);
        if (s) tbl.open = true;
      },
      after(step) {
        const nb = el.querySelector('.pf-now .nb'); if (nb) nb.textContent = F1CODE[step];
        el.querySelector('.pf-ctrl .cnt').textContent = F1CODE[step] + ' · 共 8 步';
      }
    });
    el.querySelectorAll('.pf-steps li>b').forEach((b, i) => { b.textContent = F1CODE[i]; });
  })();

  /* ---------- 图 2：一家放贷和大家一起放贷 ---------- */
  const F2 = {
    one: run([
      [['R', 'loan', LOAN], ['R', 'dep', LOAN]],
      [['R', 'dep', -LOAN], ['R', 'res', -LOAN], ['P', 'dep', LOAN], ['P', 'res', LOAN]]
    ]),
    two: run([
      [['R', 'loan', LOAN], ['R', 'dep', LOAN]],
      [['P', 'loan', LOAN], ['P', 'dep', LOAN]],
      [['R', 'dep', -LOAN], ['R', 'res', -LOAN], ['P', 'dep', LOAN], ['P', 'res', LOAN]],
      [['P', 'dep', -LOAN], ['P', 'res', -LOAN], ['R', 'dep', LOAN], ['R', 'res', LOAN]]
    ])
  };
  const F2NOTE = {
    one: ['起点', '河岸放给小周 $30,000', '河岸准备金 −$30,000，松石 +$30,000'],
    two: ['起点', '河岸放给小周 $30,000', '松石放给另一位借款人 $30,000', '小周付给松石的车商', '两笔付款互相抵掉，准备金都回到起点']
  };
  (function () {
    const el = $('fig2'); if (!el) return;
    const draw = books($('fig2-stage'), 'fig2-', false);
    const runs = {}, ind = $('fig2-ind');
    let cur = 'one';
    const steps = {
      one: [
        { label: '起点', what: '和图 1 相同的两张账。', why: '这一次只有河岸银行放贷。', learn: '看结束时准备金去了哪里。' },
        { label: '河岸放给小周', what: '河岸 贷款 +$30,000、存款 +$30,000。', why: '放贷创造存款。', learn: '准备金不动。' },
        { label: '小周付给松石的车商', what: '河岸 存款 −$30,000、准备金 −$30,000；松石 存款 +$30,000、准备金 +$30,000。', why: '跨行付款用准备金结清。', learn: '河岸准备金少了 $30,000：存款流走，对单家银行很要紧。' }
      ],
      two: [
        { label: '起点', what: '和图 1 相同的两张账。', why: '两家银行各自独立决定放贷，互不商量。', learn: '看结束时准备金有没有流失。' },
        { label: '河岸放给小周', what: '河岸 贷款 +$30,000、存款 +$30,000。', why: '放贷创造存款。', learn: '准备金不动。' },
        { label: '松石放给另一位借款人', what: '松石 贷款 +$30,000、存款 +$30,000。', why: '松石也在放贷，同样创造存款。', learn: '准备金仍然不动。' },
        { label: '小周付给松石的车商', what: '河岸 存款 −$30,000、准备金 −$30,000；松石 存款 +$30,000、准备金 +$30,000。', why: '河岸用准备金给松石结账。', learn: '到这里和只有一家放贷时一样。' },
        { label: '那位借款人付给河岸的客户', what: '松石 存款 −$30,000、准备金 −$30,000；河岸 存款 +$30,000、准备金 +$30,000。', why: '方向相反、金额相同的一笔付款。', learn: '两家准备金都回到起点（1.2 亿、0.8 亿），贷款、存款各 +$30,000；体系存款 +$60,000。' }
      ]
    };
    el.querySelectorAll('.f2-run').forEach(box => {
      const m = box.dataset.m;
      runs[m] = stepper(box, {
        first: 0, steps: steps[m],
        render(step, s) {
          if (m !== cur) return;
          const i = s ? F2[m].length - 1 : step;
          draw(F2[m][i], F2[m][Math.max(0, i - 1)], { note: F2NOTE[m][i] });
          if (s) $('fig2-tbl').open = true;
        },
        after(step) {
          const nb = box.querySelector('.pf-now .nb'); if (nb) nb.textContent = String(step);
          box.querySelector('.pf-ctrl .cnt').textContent = step + ' / ' + (steps[m].length - 1);
        }
      });
      box.querySelectorAll('.pf-steps li>b').forEach((b, i) => { b.textContent = String(i); });
    });
    function pick(m) {
      cur = m;
      el.querySelectorAll('button[data-m]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
      el.querySelectorAll('.f2-run').forEach(b => b.classList.toggle('idle', b.dataset.m !== m));
      ind.hidden = m !== 'two';
      runs[m].apply();
    }
    el.querySelectorAll('button[data-m]').forEach(b => b.addEventListener('click', () => pick(b.dataset.m)));
    pick('one');
  })();

  /* ---------- 图 3：乘数（只停在第 1、2、3、10、50 轮） ---------- */
  const M = {
    cum: { 1: '$100', 2: '$190', 3: '$271', 10: '约 $651.32', 50: '约 $994.85' },
    add: { 1: '$100', 2: '$90', 3: '$81' },
    lab: ['100', '90', '81'],
    total: n => { let s = 0, d = 100; for (let i = 0; i < n; i++) { s += d; d *= 0.9; } return s; }   // 只用来画高度
  };
  (function () {
    const el = $('fig3'); if (!el) return;
    const bars = $('fig3-bars'), fill = $('fig3-fill'), out = $('fig3-out'), f = $('fig3-f'), two = $('fig3-two');
    const btn = a => el.querySelector('[data-a=' + a + ']');
    let n = 1, zero = false, seen = false;
    function draw() {
      let h = '', d = 100;
      for (let i = 0; i < n; i++) { h += '<span class="mb' + (i === n - 1 && n <= 3 ? ' cur' : '') + '" style="height:' + d.toFixed(2) + '%">' + (i < 3 && n <= 10 ? '<em>' + M.lab[i] + '</em>' : '') + '</span>'; d *= 0.9; }
      bars.innerHTML = h; bars.dataset.n = n;
      fill.style.height = (M.total(n) / 10).toFixed(2) + '%';
      el.classList.toggle('zero', zero);
      f.textContent = zero ? '乘数 = 1 ÷ 0：无法定义' : '乘数 = 1 ÷ 10% = 10　·　$100 × 10 = $1,000';
      out.textContent = zero ? '法定准备金率 0%（美国，2020-03-26 起）：乘数公式 1 ÷ 0 无法定义'
        : (n <= 3 ? '第 ' + n + ' 轮新增 ' + M.add[n] + '，累计 ' + M.cum[n] : '前 ' + n + ' 轮累计' + M.cum[n] + '，越来越接近 $1,000');
      two.hidden = !(zero || seen || isStatic());
      btn('more').disabled = zero || n >= 3;
      btn('r10').disabled = zero || n === 10; btn('r50').disabled = zero || n === 50;
      btn('zero').setAttribute('aria-pressed', String(zero));
    }
    el.querySelector('.f3-btns').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'more') n = Math.min(3, n + 1);
      else if (a === 'r10') n = 10; else if (a === 'r50') n = 50;
      else if (a === 'zero') { zero = !zero; if (zero) seen = true; }
      else if (a === 'reset') { n = 1; zero = false; seen = false; }
      draw();
      if (b.disabled) (btn('more').disabled ? (btn('r10').disabled ? (btn('r50').disabled ? btn('zero') : btn('r50')) : btn('r10')) : btn('more')).focus();
    });
    const st = s => { if (s) { n = 50; zero = false; $('fig3-tbl').open = true; } draw(); };
    onMode(st); st(isStatic());
  })();

  /* ---------- 图 4：约束仪表（按钮，每次从起点出发；单位：亿美元） ---------- */
  const C = {
    b1: { res: 1.2, loan: 6, ta: 10, dep: 9, eq: 1, cap: '约 16.67%', capv: 16.67, rr: '约 13.33%', rrv: 13.33, room: 6.5, lim: 12.5, chg: [], say: '河岸银行的起点：权益 1 亿最多支撑 12.5 亿贷款', ev: '' },
    b2: { res: 1.2, loan: 8, ta: 12, dep: 11, eq: 1, cap: '12.5%', capv: 12.5, rr: '1.2 亿 ÷ 11 亿', rrv: 1.2 / 11 * 100, room: 4.5, lim: 12.5, chg: ['loan', 'ta', 'dep', 'tl'], tight: ['cap', 'room'], say: '资本不会随贷款自动增加', ev: '新放 2 亿：贷款和存款各 +2 亿，股东权益不变' },
    b3: { res: 0.8, loan: 6.4, ta: 10, dep: 9, eq: 1, cap: '约 15.63%', capv: 15.63, rr: '约 8.89%', rrv: 8.89, room: 6.1, lim: 12.5, chg: ['res', 'loan'], tight: ['rr'], say: '每天如此，三天见底｜先收紧的是准备金，不是资本', ev: '新放 0.4 亿，钱全部付到别家：准备金 −0.4 亿' },
    b4: { res: 1.2, loan: 5.8, ta: 9.8, dep: 9, eq: 0.8, cap: '约 13.79%', capv: 13.79, rr: '约 13.33%', rrv: 13.33, room: 4.2, lim: 10, chg: ['loan', 'ta', 'eq', 'tl'], tight: ['cap', 'room'], say: '还能新增从 6.5 亿降到 4.2 亿：少 2.3 亿，远多于 0.2 亿的损失', ev: '原有损失准备未覆盖，补记 0.2 亿信用损失费用：贷款净额 −0.2 亿，股东权益 −0.2 亿，存款不变' }
  };
  (function () {
    const el = $('fig4'); if (!el) return;
    function set(k) {
      const c = C[k];
      $('fig4-res').textContent = c.res; $('fig4-loan').textContent = c.loan; $('fig4-ta').textContent = c.ta;
      $('fig4-dep').textContent = c.dep; $('fig4-eq').textContent = c.eq; $('fig4-tl').textContent = c.ta;
      el.querySelectorAll('.f4-row').forEach(r => r.classList.toggle('chg', c.chg.includes(r.dataset.k)));
      $('fig4-cap').textContent = c.cap; $('fig4-rr').textContent = c.rr; $('fig4-room').textContent = c.room + ' 亿';
      $('fig4-capb').style.width = (c.capv / 20 * 100).toFixed(2) + '%';
      $('fig4-rrb').style.width = (c.rrv / 15 * 100).toFixed(2) + '%';
      $('fig4-lb').style.width = (c.loan / 12.5 * 100).toFixed(2) + '%';
      $('fig4-rb').style.width = (c.room / 12.5 * 100).toFixed(2) + '%';
      $('fig4-cap2').textContent = '贷款净额 ' + c.loan + ' 亿 + 还能新增 ' + c.room + ' 亿 = 上限 ' + c.lim + ' 亿';
      el.querySelectorAll('.gx').forEach(g => g.classList.toggle('tight', (c.tight || []).includes(g.dataset.g)));
      $('fig4-say').innerHTML = c.say.split('｜').map(t => '<span>' + t + '</span>').join('');
      $('fig4-ev').textContent = c.ev; $('fig4-ev').hidden = !c.ev;
      el.querySelectorAll('button[data-c]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === k)));
    }
    el.querySelectorAll('button[data-c]').forEach(b => b.addEventListener('click', () => set(b.dataset.c)));
    set('b1');
    const st = s => { if (s) $('fig4-tbl').open = true; };
    onMode(st); st(isStatic());
  })();

  window.S0102 = { START, F1, F2, C, M };
})();
