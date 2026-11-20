/* S01-01 的三张图。图 2 的账户模型与课文、数值核验用的是同一组数和同一套步骤；不自动播放。 */
(function () {
  'use strict';
  const { stepper, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);
  const fmt = v => (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US');
  const dfmt = v => (v < 0 ? '−' : '+') + Math.abs(v).toLocaleString('en-US');

  /* ---------- 图 1：谁欠谁（分类练习） ---------- */
  const DEBTORS = [['fed', '联储'], ['tsy', '财政部'], ['river', '河岸银行'], ['pine', '松石银行']];
  const CARDS = [
    { id: 'n20', t: '钱包里的 $20 纸币', d: 'fed', back: '联储账右边：联储券，欠持有人' },
    { id: 'coin', t: '一枚 25 美分硬币', d: 'tsy', back: '财政部账右边：财政部发行的通货' },
    { id: 'dxl', t: '小林在河岸银行的存款', d: 'river', back: '河岸银行账右边：欠小林的存款' },
    { id: 'dll', t: '房东在松石银行的存款', d: 'pine', back: '松石银行账右边：欠房东的存款' },
    { id: 'res', t: '河岸银行在联储的准备金', d: 'fed', back: '联储账右边：欠河岸银行的准备金' },
    { id: 'vault', t: '河岸银行金库里的一沓纸币', d: 'fed', back: '联储账右边：联储券。河岸银行持有，联储欠' }
  ];
  (function () {
    const el = $('fig1'); if (!el) return;
    const cardsBox = el.querySelector('.f1-cards'), binsBox = el.querySelector('.f1-bins');
    const fb = $('fig1-fb'), cnt = $('fig1-cnt'), keyBtn = el.querySelector('[data-a=key]');
    const play = $('fig1-play'), key = $('fig1-key');
    let sel = null, placed = {}, shown = false;
    binsBox.innerHTML = DEBTORS.map(([k, n]) => '<div class="binw"><button type="button" class="bin" data-d="' + k + '">' + n + '</button><ul class="got" id="fig1-got-' + k + '" aria-label="已放进' + n + '的卡片"></ul></div>').join('');
    function draw() {
      cardsBox.innerHTML = CARDS.filter(c => !placed[c.id]).map(c => '<button type="button" class="cd" data-c="' + c.id + '" aria-pressed="' + (sel === c.id) + '">' + c.t + '</button>').join('') ||
        '<p class="f1-done">六张都放好了</p>';
      DEBTORS.forEach(([k]) => {
        $('fig1-got-' + k).innerHTML = CARDS.filter(c => placed[c.id] && c.d === k).map(c => '<li class="back"><b>' + c.t + '</b><span>' + c.back + '</span></li>').join('');
      });
      const n = Object.keys(placed).length;
      cnt.textContent = '已放好 ' + n + ' / ' + CARDS.length;
      keyBtn.hidden = n < CARDS.length;
      el.dataset.placed = String(n);
    }
    function focusCard(id) { const b = cardsBox.querySelector(id ? '[data-c=' + id + ']' : '.cd'); if (b) b.focus(); }
    cardsBox.addEventListener('click', e => {
      const b = e.target.closest('.cd'); if (!b) return;
      sel = sel === b.dataset.c ? null : b.dataset.c;
      draw(); focusCard(b.dataset.c);
      const c = CARDS.find(x => x.id === sel);
      fb.className = 'f1-fb';
      fb.textContent = c ? '选中：' + c.t + '。再点它的欠债人' : '先选一张卡片';
    });
    binsBox.addEventListener('click', e => {
      const b = e.target.closest('.bin'); if (!b) return;
      const c = CARDS.find(x => x.id === sel);
      if (!c) { fb.className = 'f1-fb'; fb.textContent = '先选一张卡片，再点欠债人'; focusCard(); return; }
      const name = DEBTORS.find(d => d[0] === b.dataset.d)[1];
      if (c.d === b.dataset.d) {
        placed[c.id] = 1; sel = null; draw();
        fb.className = 'f1-fb ok';
        fb.innerHTML = '<b>放对了</b>' + c.t + ' → ' + name + '。' + c.back;
        if (cardsBox.querySelector('.cd')) focusCard(); else keyBtn.focus();
      } else {
        sel = null; draw();
        fb.className = 'f1-fb no';
        fb.innerHTML = '<b>不是' + name + '</b>卡片回到原位。先问：如果要把它兑现，找谁要？' +
          (c.id === 'vault' && b.dataset.d === 'river' ? '纸币放在谁的金库里，和谁欠它，是两回事' : '');
        focusCard(c.id);
      }
    });
    function showKey(s) { key.hidden = !s; play.hidden = !!s && isStatic(); }
    keyBtn.addEventListener('click', () => { shown = true; showKey(true); key.scrollIntoView({ block: 'nearest' }); });
    el.querySelector('[data-a=again]').addEventListener('click', () => {
      placed = {}; sel = null; shown = false; draw(); showKey(false);
      fb.className = 'f1-fb'; fb.textContent = '先选一张卡片'; focusCard();
    });
    draw();
    const st = s => { if (s) showKey(true); else { play.hidden = false; key.hidden = !shown; } };
    st(isStatic()); onMode(st);
  })();

  /* ---------- 图 2：四张账一起动 ---------- */
  // 起点与四步，与数值核验第三部分相同
  function book() {
    return {
      xiaolin: { cash: 0, depositRiver: 500 },
      employer: { depositRiver: 50000 },
      landlord: { depositPine: 0 },
      river: { reserves: 120e6, vaultCash: 10e6, securities: 270e6, loans: 600e6, deposits: 900e6, equity: 100e6 },
      pine: { reserves: 80e6, vaultCash: 6e6, securities: 150e6, loans: 364e6, deposits: 540e6, equity: 60e6 },
      fed: { notes: 0, reservesRiver: 120e6, reservesPine: 80e6 }
    };
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  const MOVES = [
    B => { B.employer.depositRiver -= 3200; B.xiaolin.depositRiver += 3200; },
    B => { B.xiaolin.depositRiver -= 200; B.xiaolin.cash += 200; B.river.deposits -= 200; B.river.vaultCash -= 200; },
    B => {
      B.xiaolin.depositRiver -= 1500; B.landlord.depositPine += 1500;
      B.river.deposits -= 1500; B.river.reserves -= 1500; B.pine.deposits += 1500; B.pine.reserves += 1500;
      B.fed.reservesRiver -= 1500; B.fed.reservesPine += 1500;
    },
    B => { B.river.reserves -= 50000; B.river.vaultCash += 50000; B.fed.reservesRiver -= 50000; B.fed.notes += 50000; }
  ];
  const SNAP = [book()];
  MOVES.forEach(f => { const B = clone(SNAP[SNAP.length - 1]); f(B); SNAP.push(B); });
  // 对照：房东也在河岸银行开户，第 3 步变成同行转账
  const ALT = clone(SNAP[2]); ALT.landlordRiver = 0;
  const ALT3 = clone(ALT); ALT3.xiaolin.depositRiver -= 1500; ALT3.landlordRiver += 1500;

  // 每张账的行：[键, 名称, 取值, 是否「其中」行]
  const ACCTS = {
    xl: { name: '小林', ls: '负债与净资产',
      a: [['cash', '现金', B => B.xiaolin.cash], ['dep', '河岸银行的存款', B => B.xiaolin.depositRiver]],
      l: [['debt', '负债', () => 0], ['eq', '净资产', B => B.xiaolin.cash + B.xiaolin.depositRiver]] },
    river: { name: '河岸银行', ls: '负债与股东权益',
      a: [['res', '在联储的准备金', B => B.river.reserves], ['vault', '金库现金', B => B.river.vaultCash], ['oth', '其他资产', B => B.river.securities + B.river.loans]],
      l: [['dep', '存款', B => B.river.deposits], ['dxl', '其中 小林', B => B.xiaolin.depositRiver, 1], ['demp', '其中 公司', B => B.employer.depositRiver, 1],
        ['dll', '其中 房东', B => B.landlordRiver, 1, B => B.landlordRiver !== undefined], ['eq', '股东权益', B => B.river.equity]] },
    pine: { name: '松石银行', ls: '负债与股东权益',
      a: [['res', '在联储的准备金', B => B.pine.reserves], ['vault', '金库现金', B => B.pine.vaultCash], ['oth', '其他资产', B => B.pine.securities + B.pine.loans]],
      l: [['dep', '存款', B => B.pine.deposits], ['dll', '其中 房东', B => B.landlord.depositPine, 1], ['eq', '股东权益', B => B.pine.equity]] },
    fed: { name: '联储', ls: '负债',
      a: [['sec', '国债等资产', () => 200e6]],
      l: [['rr', '准备金：欠河岸银行', B => B.fed.reservesRiver], ['rp', '准备金：欠松石银行', B => B.fed.reservesPine], ['nt', '联储券：本例换出的', B => B.fed.notes]] }
  };
  const total = (side, B) => side.filter(r => !r[3]).reduce((s, r) => s + r[2](B), 0);
  const STEPS = [
    { label: '发工资（同行）', say: '银行欠的总数不变，只是换了人',
      what: '公司的存款 −$3,200，小林的存款 +$3,200。', why: '公司和小林都在河岸银行开户，银行只是把「欠公司」改成「欠小林」。', learn: '银行欠的总数不变，只是换了人；准备金一分没动。' },
    { label: '取现', say: '银行用央行的欠条，还掉了自己的一部分欠条',
      what: '小林的存款 −$200、现金 +$200；河岸银行的存款 −$200、金库现金 −$200。', why: '取款机吐出的纸币是联储的负债，银行拿它还掉欠小林的一部分。', learn: '小林的资产还是 $3,700，只是换了形式；银行的账两边同时缩小。' },
    { label: '跨行付房租', say: '银行之间用联储的欠条结账',
      what: '小林的存款 −$1,500；河岸银行的存款和准备金各 −$1,500；松石银行的存款和准备金各 +$1,500；联储欠河岸 −$1,500，欠松石 +$1,500。', why: '松石银行多欠房东 $1,500，要同时收到一笔等额的资产：河岸银行在联储的存款。', learn: '联储账上的准备金总额不变，只是换了名下。' },
    { label: '银行换纸币', say: '现金和准备金可以互换，总数不变',
      what: '河岸银行的准备金 −$50,000、金库现金 +$50,000；联储欠河岸的准备金 −$50,000、联储券 +$50,000。', why: '纸币和准备金都是联储的负债，可以一比一互换。', learn: '河岸银行的总资产不变，联储的总负债也不变。' }
  ];
  const STEP3 = Object.assign({}, STEPS[2]);
  const STEP3ALT = { label: '跨行付房租 · 对照：房东也在河岸银行', say: '同一家银行里，只是改了欠谁，准备金不动',
    what: '小林的存款 −$1,500，房东的存款 +$1,500，都在河岸银行。松石银行和联储的账不动。', why: '没有另一家银行需要被付钱，河岸银行只是把「欠小林」改成「欠房东」。', learn: '同行转账不动准备金。' };

  function rowsHtml(side, B, P) {
    return side.filter(r => !r[4] || r[4](B)).map(r => {
      const v = r[2](B), p = P && (!r[4] || r[4](P)) ? r[2](P) : v, d = P ? v - p : 0;
      return '<div class="r' + (r[3] ? ' sub' : '') + (d ? ' chg' : '') + '" data-k="' + r[0] + '"><span class="rl">' + r[1] + '</span><span class="rv">' + fmt(v) + '</span>' +
        (d ? '<span class="dl ' + (d < 0 ? 'neg' : 'pos') + '">' + dfmt(d) + '</span>' : '') + '</div>';
    }).join('');
  }
  function acctHtml(k, B, P) {
    const A = ACCTS[k], ta = total(A.a, B), tl = total(A.l, B);
    let foot = '<p class="sum" data-left="' + ta + '" data-right="' + tl + '"><span>左 ' + fmt(ta) + '</span><span class="eqs">' + (ta === tl ? '＝' : '≠') + '</span><span>右 ' + fmt(tl) + '</span></p>';
    if (k === 'fed') foot += '<p class="rtot">准备金总额 <b id="fig2-rtot">' + fmt(B.fed.reservesRiver + B.fed.reservesPine) + '</b></p>';
    return '<h4>' + A.name + '</h4><div class="tt"><div class="side"><p class="sh">资产</p>' + rowsHtml(A.a, B, P) + '</div><div class="side"><p class="sh">' + A.ls + '</p>' + rowsHtml(A.l, B, P) + '</div></div>' + foot;
  }
  // 汇总表：每一步各主体的变化，由同一组快照算出
  function changes(k, B, P) {
    const A = ACCTS[k], out = [];
    [...A.a, ...A.l].forEach(r => {
      if (r[4] && !r[4](B)) return;
      const d = r[2](B) - (r[4] && !r[4](P) ? 0 : r[2](P));
      if (d) out.push(r[1].replace(/^其中 (.+)$/, '$1的存款') + ' ' + dfmt(d));
    });
    return out.length ? out.join('；') : '不变';
  }
  function summary() {
    const rows = STEPS.map((s, i) => [String(i + 1) + ' ' + s.label, SNAP[i + 1], SNAP[i]]);
    rows.splice(3, 0, ['3′ 对照：房东也在河岸银行', ALT3, ALT]);
    return '<table class="bs f2-tab"><thead><tr><th>步骤</th><th>小林</th><th>河岸银行</th><th>松石银行</th><th>联储</th></tr></thead><tbody>' +
      rows.map(([t, B, P]) => '<tr><td>' + t + '</td>' + ['xl', 'river', 'pine', 'fed'].map(k => '<td>' + changes(k, B, P) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  }
  (function () {
    const el = $('fig2'); if (!el) return;
    const alt = $('fig2-alt'), tbl = $('fig2-tbl');
    $('fig2-sum').innerHTML = summary();
    let on = false, S;
    function paint(step, s) {
      const useAlt = on && step === 2 && !s;
      const B = s ? SNAP[4] : useAlt ? ALT3 : SNAP[step + 1], P = s ? null : useAlt ? ALT : SNAP[step];
      ['xl', 'river', 'pine', 'fed'].forEach(k => { $('ta-' + k).innerHTML = acctHtml(k, B, P); });
      $('ta-pine').classList.toggle('dim', useAlt); $('ta-fed').classList.toggle('dim', useAlt);
      const st = useAlt ? STEP3ALT : STEPS[step];
      $('fig2-say').innerHTML = s ? '四步走完后的账' : '<span class="n">' + (step + 1) + '</span>' + st.label.replace(' · 对照：房东也在河岸银行', '') + '<em>' + st.say + '</em>';
      alt.hidden = s || step !== 2;
      alt.setAttribute('aria-pressed', String(on));
    }
    S = stepper(el, {
      steps: STEPS,
      render(step, s) {
        if (step !== 2) on = false;
        STEPS[2] = on ? STEP3ALT : STEP3;
        paint(step, s);
        el.dataset.alt = on ? '1' : '0';
      },
      reset() { on = false; }
    });
    alt.addEventListener('click', () => { on = !on; S.show(S.step); alt.focus(); });
    const st = s => { tbl.open = s || tbl.open; tbl.classList.toggle('st', s); };
    st(isStatic()); onMode(st);
  })();

  /* ---------- 图 3：一家银行的资产负债表 ---------- */
  const BAL = {
    a: [['res', '在联储的准备金', 1.2, '联储欠河岸银行的'], ['vault', '金库现金', 0.1, '河岸银行自己持有的现金：纸币是联储欠的，硬币是财政部欠的'],
      ['sec', '证券（国债等）', 2.7, '发行人欠河岸银行的'], ['loan', '贷款', 6, '借款人欠河岸银行的']],
    l: [['dep', '存款', 9, '河岸银行欠储户的'], ['eq', '股东权益', 1, '资产减去负债，属于银行的股东']]
  };
  (function () {
    const el = $('fig3'); if (!el) return;
    const out = $('fig3-out');
    const yi = v => String(v).replace(/^0\./, '0.') + ' 亿';
    const seg = ([k, n, v, w]) => '<button type="button" class="sg sg-' + k + (v < 0.5 ? ' tiny' : '') + '" style="flex:' + v + ' 0 0" data-k="' + k + '" aria-label="' + n + ' ' + yi(v) + '，占 ' + Math.round(v * 10) + '%。' + w + '">' +
      '<span class="lb"><b>' + n + '</b> <span>' + yi(v) + ' · ' + Math.round(v * 10) + '%</span></span></button>';
    $('fig3-a').insertAdjacentHTML('beforeend', BAL.a.map(seg).join(''));
    $('fig3-l').innerHTML = BAL.l.map(seg).join('');
    $('fig3-all').innerHTML = [...BAL.a, ...BAL.l].map(([, n, v, w]) => '<li><b>' + n + ' ' + yi(v) + '</b>' + w + '</li>').join('');
    const all = [...BAL.a, ...BAL.l];
    function pick(b) {
      el.querySelectorAll('.sg').forEach(x => x.classList.toggle('on', x === b));
      const r = all.find(x => x[0] === b.dataset.k);
      out.innerHTML = '<b>' + r[1] + ' ' + yi(r[2]) + '</b>' + r[3];
    }
    el.querySelectorAll('.sg').forEach(b => {
      b.addEventListener('click', () => pick(b));
      b.addEventListener('mouseenter', () => pick(b));
      b.addEventListener('focus', () => pick(b));
    });
  })();

  window.S0101 = { CARDS, SNAP, ALT3, BAL };
})();
