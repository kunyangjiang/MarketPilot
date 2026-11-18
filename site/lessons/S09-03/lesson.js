/* S09-03 图与沙盘：图 A 时间线、图 B 机构关系、图 2 传导链、图 3 贷款凭证、图 D 保护圈沙盘（M1–M6）。
 * 史实数据来自 history.js；模型来自 liquidity.js；分步控件来自 steps.js。 */
(function () {
  'use strict';
  const H = window.S0903History, M = window.S0903Model, S = window.S0903Steps;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const srcTag = (src, st) => '<span class="srcs-in">' + src.map(c => '<a href="#src-' + c + '">' + c + '</a>').join(' · ') + (st ? ' <b class="stt' + (st === '◐' ? ' half' : '') + '" title="' + (st === '✔' ? '读到了来源原文' : '只有二手概述，或来源说法不一') + '">' + st + '</b>' : '') + '</span>';

  /* ================= 图 A：时间线 ================= */
  (function figA() {
    const el = $('#figA'); if (!el) return;
    const list = $('.tl', el);
    list.innerHTML = H.T.map((e, i) => '<li class="ev lane-' + e.lane + '" data-step="' + e.step + '" data-cat="' + (e.cat || '') + '" data-i="' + i + '">' +
      '<div class="d">' + esc(e.date) + '</div><div class="b"><span class="lane">' + H.LANES[e.lane].name + '</span>' + esc(e.text) +
      (e.diff ? '<span class="diff">' + esc(e.diff) + '</span>' : '') + srcTag(e.src, e.st) + '</div></li>').join('');
    const rates = $('.rates', el);
    rates.innerHTML = '<div class="rt-h">通知贷款利率（年率，只画有记载的点，不插值）</div><div class="rt-row">' +
      H.RATES.map(r => '<div class="rt" data-d="' + r.date + '"><i style="--v:' + r.v + '"></i><b>' + (r.approx ? '约 ' : '') + r.v + '%</b><span>' + r.date + '</span><small>' + esc(r.note) + ' ' + srcTag(r.src) + '</small></div>').join('') +
      '</div><p class="dep">' + esc(H.DEPOSITS.text) + ' ' + srcTag(H.DEPOSITS.src) + '</p>';
    const rateStep = { '10-22': 7, '10-24': 9, '10-25': 10 };
    const chips = [...el.querySelectorAll('.cats button')];
    let cat = null;
    chips.forEach(b => b.addEventListener('click', () => {
      cat = cat === b.dataset.cat ? null : b.dataset.cat;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === cat)));
      el.classList.toggle('filtered', !!cat);
      list.querySelectorAll('.ev').forEach(li => li.classList.toggle('hit', li.dataset.cat === cat));
    }));
    S.stepper(el, { steps: H.STEPS, render(step, isStatic) {
      list.querySelectorAll('.ev').forEach(li => {
        const s = +li.dataset.step;
        li.hidden = !isStatic && s > step;
        li.classList.toggle('cur', !isStatic && s === step);
      });
      rates.querySelectorAll('.rt').forEach(r => r.classList.toggle('on', isStatic || rateStep[r.dataset.d] <= step));
      rates.classList.toggle('on', isStatic || step >= 7);
      // 存款记载的终点是 12 月 19 日：只在最后一步（和静态版）显示，不提前透露
      $('.dep', rates).hidden = !isStatic && step < H.STEPS.length - 1;
    } });
  })();

  /* ================= 图 B：机构关系 ================= */
  (function figB() {
    const el = $('#figB'); if (!el) return;
    const stage = $('.pf-stage', el);
    let layout = null, cur = 0, stat = false;
    function draw() {
      const P = H.POS[layout], ring = P.ring, step = stat ? H.GSTEPS.length - 1 : cur;
      const B = {}; Object.keys(H.NODES).forEach(id => { B[id] = H.boxOf(id, layout, step); });
      const labs = H.labelBoxes(layout, B, step);
      let s = '<svg viewBox="0 ' + (P.vy || 0) + ' ' + P.w + ' ' + (P.h - (P.vy || 0)) + '" role="img" aria-labelledby="figB-t figB-d"><title id="figB-t">图 B：1907 年 10 月的机构关系（简化）</title><desc id="figB-d">圈内是纽约清算所的直接会员；圈外是不是直接会员的信托公司等机构。清算代理、紧急援助、人事关联用不同的线表示；没有核实的关系只写标签、不画线。文字版见图下。</desc>' +
        '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#7A5CFF"/></marker></defs>';
      s += '<circle class="ring" cx="' + ring.x + '" cy="' + ring.y + '" r="' + ring.r + '"/>';
      labs.filter(l => l.kind !== 'mark').forEach(l => { s += '<text class="' + (l.kind === 'ring' ? 'ring-l' : 'zone-l') + '" x="' + l.x + '" y="' + (l.y + 5) + '" text-anchor="middle">' + l.t + '</text>'; });
      // 连线
      H.EDGES.forEach(e => {
        if (e.s > step) return;
        const pts = H.edgeGeom(e, layout, B).pts;
        let cls = 'e ' + e.type, lab = null;
        if (e.type === 'agency') {
          lab = H.edgeLabel(e, layout, step);
          if (e.end !== undefined && step >= e.end) cls += ' ended';
        }
        if (!stat && e.s === step && step > 0) cls += ' new';
        s += '<g class="' + cls + '"><title>' + esc(e.tip) + '（' + e.src.join('、') + '）</title><polyline points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"' + (/^aid/.test(e.type) ? ' marker-end="url(#ah)"' : '') + '/>';
        if (lab) {
          const at = P.elab && P.elab[e.id];
          const a = pts[0], b = pts[pts.length - 1];
          const [lx, ly, anc] = at || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 7, 'middle'];
          lab.forEach((t, i) => { s += '<text class="el" x="' + (+lx).toFixed(1) + '" y="' + (ly + i * 14).toFixed(1) + '" text-anchor="' + anc + '">' + t + '</text>'; });
        }
        s += '</g>';
      });
      // 节点
      Object.keys(H.NODES).forEach(id => {
        const n = H.NODES[id], b = B[id];
        if (n.ghost && step < 11) return;
        const cls = 'n m-' + n.m + (n.unk ? ' unk' : '') + (n.person ? ' person' : '') + (n.ghost ? ' ghost' : '') + (id === 'CH' ? ' hub' : '');
        const top = b.y - b.h / 2;
        s += '<g class="' + cls + '" data-id="' + id + '"><rect x="' + (b.x - b.w / 2) + '" y="' + top + '" width="' + b.w + '" height="' + b.h + '" rx="10"/>';
        let y = top + (n.ghost ? 20 : 22);
        b.lines.name.forEach(t => { s += '<text class="nn" x="' + b.x + '" y="' + y + '" text-anchor="middle">' + esc(t) + '</text>'; y += 17; });
        y += 1;
        b.lines.sub.forEach(t => { s += '<text class="ns' + (n.unk ? ' u' : '') + '" x="' + b.x + '" y="' + y + '" text-anchor="middle">' + esc(t) + '</text>'; y += 15; });
        s += '</g>';
      });
      // 事件标记
      labs.filter(l => l.kind === 'mark').forEach(l => {
        const fresh = !stat && l.s === step;
        s += '<g class="mk' + (fresh ? ' cur' : '') + '"><rect x="' + (l.x - l.w / 2) + '" y="' + (l.y - 10) + '" width="' + l.w + '" height="20" rx="10"/><text x="' + l.x + '" y="' + (l.y + 4) + '" text-anchor="middle">' + esc(l.t) + '</text></g>';
      });
      s += '</svg>';
      stage.innerHTML = s;
    }
    function pickLayout() { const l = stage.clientWidth < 600 ? 'narrow' : 'wide'; if (l !== layout) { layout = l; draw(); } }
    layout = stage.clientWidth < 600 ? 'narrow' : 'wide';
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(pickLayout, 120); });
    S.stepper(el, { steps: H.GSTEPS, render(step, isStatic) { cur = step; stat = isStatic; draw(); } });
    // 文字版
    const tv = $('.tv', el);
    if (tv) {
      const memb = { member: '直接会员', non: '不是直接会员', unk: '会员身份未核实', out: '—', hub: '—' };
      tv.innerHTML = '<table><thead><tr><th>机构</th><th>清算所会员资格</th><th>清算代理</th><th>来源</th></tr></thead><tbody>' +
        Object.keys(H.NODES).filter(id => !['PPL', 'BAR', 'SPARE', 'CH'].includes(id)).map(id => { const n = H.NODES[id];
          return '<tr><td>' + esc(n.name) + '</td><td>' + (memb[n.m] || '—') + (n.st ? ' ' + n.st : '') + (n.note ? '（' + esc(n.note) + '）' : '') + '</td><td>' + esc(n.agent || (n.m === 'out' ? '—' : '')) + '</td><td>' + (n.src ? srcTag(n.src) : '—') + '</td></tr>'; }).join('') +
        '</tbody></table><ul class="edges">' + H.EDGES.map(e => '<li><b>' + ({ agency: '清算代理', aid: '直接援助', aidi: '间接援助', person: '人事关联' }[e.type]) + '</b> ' + esc(e.tip) + ' ' + srcTag(e.src) + '</li>').join('') + '</ul>';
    }
  })();

  /* ================= 图 2：传导链（模型） ================= */
  (function fig2() {
    const el = $('#fig2'); if (!el) return;
    const items = [...el.querySelectorAll('.chain li')];
    const steps = [
      { label: '存款人提款', what: '存款人来要现金。', why: '担心别人会先把钱取走。', learn: '起点在柜台。' },
      { label: '现金不足', what: '信托公司的金库现金和存放同业很快用完。', why: '平时只留薄薄一层现金。', learn: '缺口必须从别处补。' },
      { label: '叫回通知贷款', what: '信托公司叫回借给经纪商的通知贷款。', why: '这是仅次于现金的「活钱」。', learn: '压力从信托公司转到经纪商。' },
      { label: '经纪商借不到', what: '经纪商当天要还钱，却找不到新的出借人。', why: '许多信托公司同时在叫回。', learn: '一家这样做没问题，大家一起做就出问题。' },
      { label: '卖出抵押股票', what: '经纪商只好卖掉作抵押的股票。', why: '这是当天唯一能凑到现金的办法。', learn: '信用问题变成了卖压。' },
      { label: '股价下跌', what: '大量卖出压低股价。', why: '买的人少，卖的人多。', learn: '价格下跌会反过来影响别的贷款。' },
      { label: '抵押品缩水', what: '其他贷款的抵押品价值也下降。', why: '它们用的也是股票作抵押。', learn: '本来安全的贷款也变得不那么安全。' },
      { label: '更想叫回', what: '出借人更不敢借、更想叫回，链条回到第 3 环。', why: '每一环都是一个人或一家机构在做对自己合理的事。', learn: '这是一个自我强化的循环，不会自己停下来。' }
    ];
    S.stepper(el, { steps, render(step, isStatic) {
      items.forEach((li, i) => { li.classList.toggle('on', isStatic || i <= step); li.classList.toggle('cur', !isStatic && i === step); });
      el.querySelector('.loop').classList.toggle('on', isStatic || step === steps.length - 1);
    } });
  })();

  /* ================= 图 3：贷款凭证（示意） ================= */
  (function fig3() {
    const el = $('#fig3'); if (!el) return;
    const steps = [
      { label: '没有凭证', what: '甲银行今天在清算中欠乙银行 75 万美元，必须付出 75 万美元现金。', why: '会员之间的差额平时用现金结清。', learn: '甲金库里的现金因此减少 75 万美元。' },
      { label: '有凭证', what: '甲把市值 100 万美元的贷款抵押给清算所，领到 75 万美元凭证，用凭证付给乙。', why: '凭证按抵押品市值最多 75% 发放，只在会员之间用于结算。', learn: '甲金库里的 75 万美元现金留了下来，可以付给存款人。' },
      { label: '乙为什么接受', what: '乙接受凭证，不要求现金。', why: '凭证有 6% 的年利息，而且有全体会员共同的信用作保。', learn: '凭证「腾出」了现金，但只在会员之间流通。' }
    ];
    S.stepper(el, { steps, render(step, isStatic) {
      el.querySelectorAll('[data-k]').forEach(n => { const k = +n.dataset.k; n.classList.toggle('on', isStatic || k <= step); n.classList.toggle('cur', !isStatic && k === step); });
      el.querySelector('.vault b').textContent = isStatic || step >= 1 ? '75 万美元留在金库' : '金库付出 75 万美元';
    } });
  })();

  /* ================= 图 D：保护圈沙盘（模型） ================= */
  (function sandbox() {
    const root = $('#sim-model'); if (!root) return;
    const q = s => root.querySelector(s);
    const ui = { scn: 'M2', basis: 40, path: 1, runs: null, steps: [], i: 0, revealed: null, pred: null, done: false };
    const HIST = {
      M1: '平常日子里，薄准备完全够用：信托公司的理由在平时大致成立。',
      M2: '对应：清算所会员银行（商业国民银行）得到支持后，它的挤兑停止；尼克博克经国民商业银行间接清算，但不是会员，没有得到援助，停业。模型中的「有 / 无借款渠道」是简化，不等于 1907 年任何一种具体安排。',
      M3: '对应：清算所会员银行（商业国民银行）得到支持后，它的挤兑停止。模型中的「有借款渠道」是简化，不等于 1907 年任何一种具体安排。',
      M4: '类似的讨论：研究者讨论信托公司的资产风险是否更高（Tallman & Moen 1990）。本模型不对任何真实机构下结论。',
      M5: '对应：10 月 21 日夜，斯特朗在有限时间内无法判断尼克博克的偿付能力，摩根决定不予援助。',
      M6: '对应：尼克博克停业后，挤兑蔓延到美国信托公司、林肯信托等；10 月 24 日通知贷款几乎断供。',
      FREE: '自由实验没有对应的史实，只用来观察机制。'
    };
    const PRED = {
      M2: { q: '提款 60，这家公司账上有 110 的资产。它撑得过今天吗？', opts: ['撑得过', '撑不过'], ans: r => r.days[0].survived ? 0 : 1 },
      M4: { q: '现在借给它钱，它就安全了吗？', opts: ['安全了', '还不一定'], ans: () => 1 },
      M6: { q: '乙的资产和甲一样健康。甲倒了，乙会怎样？', opts: ['乙没事', '乙也可能撑不过'], ans: () => 1 }
    };
    const NAMES = M.NAMES;
    const fmt = M.fmt;

    function params() {
      const s = ui.scn;
      if (s === 'FREE') return { W: +q('#sb-w').value, panic: q('input[name=sb-mk]:checked').value === 'p', channel: q('input[name=sb-ch]:checked').value === 'y', appraisal: +q('#sb-ap').value, trueK: +q('#sb-tk').value };
      if (s === 'M5') return Object.assign({}, M.SCENARIOS.M5.day, { appraisal: ui.basis, trueK: 40 });
      return Object.assign({}, M.SCENARIOS[s].day);
    }
    // 预设场景：只读的参数摘要（不显示揭晓前的隐藏值）
    function summary(s) {
      if (s === 'FREE') return null;
      if (s === 'M6') return [['提款需求', '甲第 1 天 75；乙第 2 天 20（甲停业则 60）'], ['市场状态', '恐慌'], ['紧急借款渠道', '由下方的路径决定'], ['资产', '甲乙相同，真实价值等于账面']];
      const d = M.SCENARIOS[s].day, it = [['当天提款需求 W', String(d.W)], ['市场状态', d.panic ? '恐慌' : '平静'], ['紧急借款渠道', d.channel ? '有（按评估值的 75% 借）' : '没有']];
      if (s === 'M5') it.push(['出借人的评估值', '由你在下方选择（25 或 40）'], ['抵押贷款的真实价值', '今晚看不清：25 到 40 之间，揭晓前不显示']);
      else if (d.channel) it.push(['出借人的评估值', String(d.appraisal)], ['抵押贷款的真实价值', String(d.trueK)]);
      else it.push(['资产', '真实价值等于账面']);
      return it;
    }
    function syncControls() {
      const s = ui.scn, free = s === 'FREE';
      root.dataset.scn = s;
      const p = s === 'M6' ? { W: 75, panic: true, channel: false } : params();
      q('#sb-w').value = p.W; q('#sb-wv').textContent = p.W;
      q('input[name=sb-mk][value=' + (p.panic ? 'p' : 'c') + ']').checked = true;
      q('input[name=sb-ch][value=' + (p.channel ? 'y' : 'n') + ']').checked = true;
      if (p.appraisal !== undefined) { q('#sb-ap').value = p.appraisal; q('#sb-apv').textContent = p.appraisal; }
      if (!free && s !== 'M5' && p.trueK !== undefined) { q('#sb-tk').value = p.trueK; q('#sb-tkv').textContent = p.trueK; }
      // 预设：隐藏可编辑参数，只给摘要；自由实验：显示全部可编辑参数
      root.querySelectorAll('.free-only').forEach(n => { n.hidden = !free; });
      root.querySelectorAll('.free-only input').forEach(i => { i.disabled = !free; });
      const sm = summary(s), box = q('#sb-sum');
      box.hidden = !sm;
      if (sm) box.innerHTML = '<span class="sum-h">本场景的参数（固定）</span><dl>' + sm.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('') + '</dl><span class="sum-n">想改参数，请选「自由实验」。</span>';
      const ch = free ? q('input[name=sb-ch]:checked').value === 'y' : !!p.channel;
      q('#sb-ap').disabled = !free || !ch; q('.ap-row').classList.toggle('off', !ch);
      q('.m5-only').hidden = s !== 'M5'; q('.m6-only').hidden = s !== 'M6';
      $('#sim-hist').textContent = HIST[s];
    }
    function sum(r) { return { survived: r.survived, short: r.short, paid: r.paid }; }

    function buildSteps() {
      const out = [];
      ui.runs.days.forEach((r, di) => {
        const who = ui.runs.days.length > 1 ? (di === 0 ? '甲 · 第 1 天' : '乙 · 第 2 天') : '';
        out.push({ day: di, k: -1, label: (who ? who + '：' : '') + '提款需求 ' + fmt(r.W), what: '存款人今天要提 ' + fmt(r.W) + '。', why: di === 1 && ui.runs.extra ? '基础提款 20，甲停业后又多了 40。' : (r.input.panic ? '恐慌：资产变现要打折。' : '平静：资产几乎不用打折。'), learn: '先看这一天它最多能凑出多少现金：' + fmt(r.maxCash) + '。' });
        r.steps.forEach((x, k) => {
          const before = M.add(x.needAfter, x.cash);
          let label, what, why, learn;
          if (x.kind === 'C' || x.kind === 'B') { label = x.kind === 'C' ? '动用金库现金' : '提回存放同业'; what = label + ' ' + fmt(x.cash) + '。'; why = '这两项可以按面值立即付出。'; learn = '金库现金加存放同业一共只有 15：这就是「薄薄的现金准备」。'; }
          else if (x.kind === 'borrow') { label = '紧急借款'; what = '以抵押贷款作抵押借入 ' + fmt(x.cash) + '（上限：评估值 ' + fmt(r.input.appraisal) + ' × 75% = ' + fmt(x.cap) + '）。'; why = '还差 ' + fmt(before) + '；借款不打折。'; learn = '有借款渠道，就可以少甩卖资产。'; }
          else { const nm = x.kind === 'L' ? '叫回通知贷款' : '卖出证券'; label = nm; what = nm + '：面值 ' + fmt(x.face) + '，按 ' + Math.round(M.val(x.rate) * 100) + '% 收回 ' + fmt(x.cash) + '，损失 ' + fmt(x.loss) + '。'; why = '还差 ' + fmt(before) + '。' + (x.kind === 'S' && r.input.priorFireSale ? '前一天市场上已有甩卖，证券只能按 70% 卖。' : '恐慌中要打折才能变现。'); learn = '折价损失直接吃掉资本。'; }
          out.push({ day: di, k, label: (who ? who + '：' : '') + label, what, why, learn });
        });
        const lb = M.label(r, ui.revealed && ui.scn === 'M5' ? r.at(ui.revealed) : null);
        out.push({ day: di, k: 99, label: (who ? who + '：' : '') + (r.survived ? '撑过当天' : '停业'), what: r.survived ? '付清了全部提款 ' + fmt(r.W) + '。' : '最多付出 ' + fmt(r.paid) + '，还差 ' + fmt(r.short) + '，只能停业。', why: lb.text, learn: r.survived ? '撑过当天不等于有偿付能力，见下方「模型净资产」。' : '停业的直接原因是当天的现金缺口。' });
      });
      ui.steps = out;
    }
    function start() {
      if (ui.scn === 'M6') { const m = M.runM6(ui.path); ui.runs = { days: [m.a, m.b], extra: m.extra, m6: m }; }
      else ui.runs = { days: [M.runDay(params())] };
      ui.revealed = null; ui.i = 0; ui.done = false;
      buildSteps(); paint();
    }
    function bar(v, scale, cls, title) { const w = Math.max(0, M.val(v)) / scale * 100; return w > 0 ? '<i class="' + cls + '" style="width:' + w.toFixed(2) + '%" title="' + title + '"></i>' : ''; }
    function sheet(r, upto, title) {
      // upto：已执行到的付款步数（-1 = 还没开始）
      const left = Object.assign({}, M.BOOK), paidBy = {}, lossBy = {}; let borrow = M.F(0), paid = M.F(0);
      r.steps.forEach((x, k) => { if (k > upto) return;
        if (x.kind === 'borrow') { borrow = x.cash; paid = M.add(paid, x.cash); return; }
        left[x.kind] = M.sub(left[x.kind], x.face); paidBy[x.kind] = x.cash; lossBy[x.kind] = x.loss; paid = M.add(paid, x.cash); });
      const finished = upto >= r.steps.length - 1 || ui.done;
      const kVal = ui.scn === 'M5' ? (ui.revealed || null) : r.input.trueK !== undefined ? r.input.trueK : 40;
      const kShow = kVal === null ? 40 : kVal;
      const rows = ['C', 'B', 'L', 'S', 'K', 'O'].map(k => {
        const book = M.BOOK[k]; let segs = '';
        if (k === 'K') { const imp = M.sub(book, M.F(kShow)); segs = bar(M.F(kShow), 40, 'rem', '剩余') + bar(imp, 40, 'imp', '减值'); }
        else segs = bar(left[k], 40, 'rem', '剩余') + bar(paidBy[k] || M.F(0), 40, 'out', '已变现付出') + bar(lossBy[k] || M.F(0), 40, 'loss', '折价损失');
        const valTxt = k === 'K' ? (kVal === null ? '账面 40 · 真实值未知（25–40）' : (M.cmp(M.F(kShow), book) ? '账面 40 → ' + fmt(M.F(kShow)) : '40')) : fmt(left[k]) + (lossBy[k] && !M.isZero(lossBy[k]) ? '（损失 ' + fmt(lossBy[k]) + '）' : '');
        return '<div class="r"><span class="k">' + NAMES[k] + '</span><span class="bar">' + segs + '</span><span class="v">' + valTxt + '</span></div>';
      }).join('');
      const dep = M.sub(M.DEPOSITS, paid);
      // 净资产（按当前资产价值假设）
      let nwTxt, lb = null;
      if (finished) {
        if (kVal === null) { const lo = r.at(25).nw, hi = r.at(40).nw; nwTxt = '揭晓前未知：在 ' + fmt(lo) + ' 到 ' + fmt(hi) + ' 之间'; }
        else { const v = r.at(kVal); nwTxt = fmt(v.nw); lb = M.label(r, v); }
      } else nwTxt = '当天结束后计算';
      const v = kVal === null ? null : r.at(kVal);
      return '<div class="sheet"><div class="sh-h">' + title + '</div><div class="cols"><div class="col"><div class="ch">资产</div>' + rows + '</div>' +
        '<div class="col"><div class="ch">负债与净资产</div>' +
        '<div class="r"><span class="k">存款</span><span class="bar">' + bar(dep, 100, 'rem', '剩余存款') + bar(paid, 100, 'out', '已付出') + '</span><span class="v">' + fmt(dep) + '（已付 ' + fmt(paid) + '）</span></div>' +
        '<div class="r"><span class="k">紧急借款</span><span class="bar">' + bar(borrow, 100, 'brw', '紧急借款') + '</span><span class="v">' + fmt(borrow) + '</span></div>' +
        '<div class="read"><div><b>当日可付现金（最多）</b><span class="big">' + fmt(r.maxCash) + '</span><small>需求 ' + fmt(r.W) + '：这是流动性</small></div>' +
        '<div><b>模型净资产（按当前资产价值假设）</b><span class="big' + (v && finished && v.nw.n < 0 ? ' neg' : '') + '">' + nwTxt + '</span><small>这是对偿付能力的条件性估计，不是证据</small></div></div>' +
        (lb ? '<p class="lbl ' + lb.tone + '">' + lb.text + (lb.why ? '<br><span>' + lb.why + '</span>' : '') + '</p>' : '') +
        (finished && v && !M.isZero(v.gap) ? '<p class="gap">抵押品覆盖缺口 ' + fmt(v.gap) + '（借款 ' + fmt(r.borrow) + ' − 抵押品 ' + fmt(v.kValue) + '）。这不等于出借人的实际信用损失：还取决于追索权、担保范围、借款机构的其他资产和清算结果。本模型不模拟法律追偿。</p>' : '') +
        '</div></div></div>';
    }
    function paint() {
      const out = q('#sb-out');
      if (!ui.runs) { out.innerHTML = '<p class="idle">选好场景后，点「开始这一天」。每一步由你点「下一步」推进。</p>'; q('#sb-ctrl').hidden = true; return; }
      q('#sb-ctrl').hidden = false;
      const st = ui.steps[ui.i];
      const days = ui.runs.days;
      // 每一天已执行到第几步
      const upto = days.map((r, di) => { if (st.day > di || ui.done) return r.steps.length; if (st.day < di) return -2; return st.k === 99 ? r.steps.length : st.k; });
      out.innerHTML = days.map((r, di) => upto[di] === -2 ? '<div class="sheet wait"><div class="sh-h">乙 · 第 2 天</div><p>甲的第 1 天结束后才开始。</p></div>' :
        sheet(r, upto[di] === r.steps.length ? 99 : upto[di], days.length > 1 ? (di === 0 ? '信托公司甲 · 第 1 天' : '信托公司乙 · 第 2 天（资产与甲相同）') : '信托公司甲')).join('');
      const now = q('#sb-now');
      now.innerHTML = '<span class="nb">' + (ui.i + 1) + '</span><strong>' + esc(st.label) + '</strong><span class="w1"><b>发生了什么</b>' + esc(st.what) + '</span><span class="w1"><b>为什么</b>' + esc(st.why) + '</span><span class="w1 lrn"><b>要看出什么</b>' + esc(st.learn) + '</span>';
      q('#sb-cnt').textContent = (ui.i + 1) + ' / ' + ui.steps.length;
      q('#sb-next').disabled = ui.i >= ui.steps.length - 1;
      q('#sb-prev').disabled = ui.i === 0;
      const last = ui.i >= ui.steps.length - 1;
      if (last) ui.done = true;
      // 揭晓（只用于 M5）
      const rv = q('#sb-reveal');
      rv.hidden = !(ui.scn === 'M5' && last);
      if (!rv.hidden) {
        rv.innerHTML = ui.revealed === null
          ? '<p>你按 ' + ui.basis + ' 放了款。现在可以揭晓 K 的真实价值。</p><button type="button" class="pri" data-rv="rand">揭晓真实价值</button>'
          : '<p>K 的真实价值是 <b>' + ui.revealed + '</b>。</p><button type="button" data-rv="other">看另一种真实值（' + (ui.revealed === 40 ? 25 : 40) + '）</button><p class="hist-line">在模型里你可以揭晓答案。1907 年 10 月 21 日夜里，没有人能。</p>';
      }
      // 预测对照
      const pr = q('#sb-predres');
      if (last && ui.pred !== null && PRED[ui.scn]) {
        const P = PRED[ui.scn], ans = P.ans(ui.runs);
        pr.hidden = false; pr.innerHTML = '你的预测：<b>' + P.opts[ui.pred] + '</b>。' + (ui.pred === ans ? '和模型的结果一致。' : '模型的结果是：<b>' + P.opts[ans] + '</b>。看看上面每一步的「为什么」。');
      } else pr.hidden = true;
    }
    function askPrediction() {
      const P = PRED[ui.scn], box = q('#sb-pred');
      if (!P || !q('#sb-predon').checked) { box.hidden = true; ui.pred = null; start(); return; }
      box.hidden = false; ui.runs = null; paint();
      box.innerHTML = '<p><b>先猜一猜</b>' + P.q + '</p>' + P.opts.map((o, i) => '<button type="button" data-p="' + i + '">' + o + '</button>').join('');
      box.querySelector('button').focus();
    }
    // 事件
    q('#sb-scn').addEventListener('change', e => { ui.scn = e.target.value; ui.runs = null; ui.pred = null; q('#sb-pred').hidden = true; syncControls(); paint(); });
    q('#sb-w').addEventListener('input', e => { q('#sb-wv').textContent = e.target.value; });
    q('#sb-ap').addEventListener('input', e => { q('#sb-apv').textContent = e.target.value; });
    q('#sb-tk').addEventListener('input', e => { q('#sb-tkv').textContent = e.target.value; });
    root.querySelectorAll('input[name=sb-ch]').forEach(i => i.addEventListener('change', syncControls));
    root.querySelectorAll('input[name=sb-basis]').forEach(i => i.addEventListener('change', e => { ui.basis = +e.target.value; ui.runs = null; paint(); }));
    root.querySelectorAll('input[name=sb-path]').forEach(i => i.addEventListener('change', e => { ui.path = +e.target.value; ui.runs = null; paint(); }));
    q('#sb-go').addEventListener('click', askPrediction);
    q('#sb-pred').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; ui.pred = +b.dataset.p; q('#sb-pred').hidden = true; start(); q('#sb-next').focus(); });
    q('#sb-next').addEventListener('click', () => { if (ui.i < ui.steps.length - 1) { ui.i++; paint(); } });
    q('#sb-prev').addEventListener('click', () => { if (ui.i > 0) { ui.i--; ui.done = false; paint(); } });
    q('#sb-end').addEventListener('click', () => { ui.i = ui.steps.length - 1; paint(); });
    q('#sb-again').addEventListener('click', () => { ui.runs = null; ui.pred = null; paint(); q('#sb-go').focus(); });
    q('#sb-reveal').addEventListener('click', e => {
      const b = e.target.closest('[data-rv]'); if (!b) return;
      ui.revealed = b.dataset.rv === 'rand' ? (Math.random() < 0.5 ? 25 : 40) : (ui.revealed === 40 ? 25 : 40);
      buildSteps(); paint();
    });
    syncControls(); paint();
    window.__sandbox = { ui, start, reveal: v => { ui.revealed = v; buildSteps(); paint(); } };
  })();

  S.setMode(S.mode());
})();
