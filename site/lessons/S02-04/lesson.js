/* S02-04 的四张图。数字在 data.js；不调用撮合引擎；不自动播放。 */
(function () {
  'use strict';
  const D = window.S0204Data;
  const { stepper, reveal, isStatic, onMode } = window.LessonSteps;
  const $ = id => document.getElementById(id);
  const usd = c => (c < 0 ? '−' : '+') + '$' + (Math.abs(c) / 100).toLocaleString('en-US');
  const N1 = D.fills.reduce((a, f) => a + f[0] * f[1], 0);                      // 3001700
  const NET = { qty: D.trades.reduce((a, t) => a + t.side * t.qty, 0),            // −100
                cash: D.trades.reduce((a, t) => a - t.side * t.cents, 0) };       // +502100

  /* ---------- 图 1：小林的 600 股走过的路 ---------- */
  (function () {
    const el = $('fig1'); if (!el) return;
    const stage = el.querySelector('.pf-stage');
    let mkt = 'us', S;
    const name = () => mkt === 'us' ? { c: 'NSCC', d: 'DTC', ct: '清算机构', dt: '存管机构' } : { c: '中国结算', d: '中国结算', ct: '登记结算机构', dt: '登记结算机构（存管）' };
    const steps = [
      { label: '成交', what: '小林的 600 股在执行渠道成交，合计 $30,017。', why: '价格和数量约定好了，股票和钱都还没动。', learn: '持仓里多了 600 股，旁边写着「未结算」。' },
      { label: '成交记录', what: '一张成交记录分别送到券商甲、券商乙和清算机构。', why: '后面的每一步都以这份记录为准。', learn: '记录是虚线：它是凭证，不是钱也不是股票。' },
      { label: '比对', what: '清算机构比对两边的记录：都是 600 股、$30,017。', why: '两边不一致，就要在交收之前查清楚。', learn: '今天这一步绝大部分是自动完成的。' },
      { label: '站到中间', what: '甲和乙之间原本的一条线断开，变成两条：甲—清算机构、清算机构—乙。', why: '清算机构成为每一笔交易的法律对手方，也就是中央对手方。', learn: '每家券商只需要关心一个对手。' },
      { label: '轧差', what: '当天收盘后，券商甲在北岭电池上的所有交易归并成一笔。', why: '所有交易的对手都是同一个，买进和卖出可以先互相抵掉。', learn: '轧差在券商这一层进行，小林自己的 600 股不受影响。' },
      { label: '交收', what: '', why: '', learn: '' },
      { label: '已结算', what: '', why: '', learn: '' }
    ];
    function text() {
      const n = name();
      steps[1].what = '一张成交记录分别送到券商甲、券商乙和' + n.c + '。';
      steps[2].what = n.c + '比对两边的记录：都是 600 股、$30,017。';
      steps[3].what = '甲和乙之间原本的一条线断开，变成两条：甲—' + n.c + '、' + n.c + '—乙。';
      steps[3].why = mkt === 'us' ? 'NSCC 成为每一笔交易的法律对手方，也就是中央对手方。' : '中国结算在 A 股交易中同样作为结算的共同对手方。';
      steps[4].what = mkt === 'us' ? '当天收盘后，NSCC 把券商甲在北岭电池上的所有交易归并成一笔。' : '中国结算采用多边净额结算，把券商当天的交易归并计算。';
      if (mkt === 'us') {
        steps[5].what = 'T+1 日，在 DTC 的账簿上，股票从卖方一侧移到买方一侧，钱反方向移动。'; steps[5].why = '美国大多数证券交易自 2024 年 5 月 28 日起按 T+1 结算。'; steps[5].learn = '没有纸质股票在搬运，只是账户记录的变化。';
        steps[6].what = '小林的持仓旁边，「未结算」变成「已结算」。'; steps[6].why = '发行人名册上登记的常常是 Cede & Co.，券商的账簿上记着小林持有 600 股。'; steps[6].learn = '小林是实益所有人。';
      } else {
        steps[5].what = 'T 日证券划转，T+1 日资金交收。'; steps[5].why = '按 2022 年货银对付改革的说明：资金足额交收以前，划过去的证券带着标识。'; steps[5].learn = '交钱和交货互为条件。';
        steps[6].what = '持有记录记在你自己的证券账户。'; steps[6].why = 'A 股投资者的证券账户就开在中国结算。'; steps[6].learn = '「当天买入、次日才能卖出」是交易规则，不是这里的结算周期。';
      }
      stage.querySelectorAll('.cname').forEach(x => { x.textContent = n.c; });
      stage.querySelector('.ctype').textContent = n.ct;
      stage.querySelector('.dname').textContent = n.d;
      stage.querySelector('.dtype').textContent = n.dt;
      $('fig1-dx').textContent = mkt === 'us' ? 'T+1 日：股票从卖方一侧移到买方一侧，钱反方向移动' : 'T 日证券划转，T+1 日资金交收';
      $('fig1-reg').textContent = mkt === 'us' ? '发行人名册上登记的是 Cede & Co.；小林是实益所有人' : '记在你自己的证券账户';
      $('fig1-cn').hidden = mkt === 'us';
    }
    text();
    S = stepper(el, {
      steps,
      render(i, st) {
        reveal(stage, i + 1, st);
        const s1 = st ? 7 : i + 1;
        $('fig1-direct').classList.toggle('cut', s1 >= 4);
        $('fig1-direct').classList.toggle('off', false);
        $('fig1-st').textContent = s1 >= 7 ? '已结算' : '未结算';
        $('fig1-st').classList.toggle('done', s1 >= 7);
      }
    });
    el.querySelectorAll('button[data-mkt]').forEach(b => b.addEventListener('click', () => {
      mkt = b.dataset.mkt;
      el.querySelectorAll('button[data-mkt]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      text(); S.apply();
      const list = el.querySelector('.pf-steps');
      if (list) list.innerHTML = steps.map((s, k) => '<li><b>' + (k + 1) + '</b><span><strong>' + s.label + '</strong>　' + s.what + ' ' + s.why + ' <em>' + s.learn + '</em></span></li>').join('');
    }));
  })();

  /* ---------- 图 2：三笔变一笔 ---------- */
  (function () {
    const el = $('fig2'); if (!el) return;
    const stage = el.querySelector('.pf-stage');
    $('fig2-q').textContent = (NET.qty > 0 ? '+' : '−') + Math.abs(NET.qty).toLocaleString('en-US');
    $('fig2-c').textContent = usd(NET.cash);
    stepper(el, {
      steps: [
        { label: '三笔交易', what: '券商甲的客户当天在北岭电池上做了三笔交易。', why: '如果逐笔交收，券商甲要收进 900 股、交出 1,000 股，付出 $45,029、收进 $50,050。', learn: '股票和钱要来回搬好几趟。' },
        { label: '股票一栏相加', what: '+600 + 300 − 1,000 = −100。', why: '所有交易的对手都是 NSCC，可以先互相抵掉。', learn: '券商甲净交出 100 股。' },
        { label: '钱一栏相加', what: '−$30,017 − $15,012 + $50,050 = +$5,021。', why: '三笔交易，最后只需要一笔交收。', learn: '交出 100 股，收进 $5,021。' }
      ],
      render(i, st) {
        reveal(stage, i + 1, st);
        const s1 = st ? 3 : i + 1;
        stage.querySelectorAll('tr.tr').forEach(r => r.classList.toggle('folded', s1 >= 3));
        $('fig2-v').textContent = s1 < 2 ? '逐笔交收：收进 900 股、交出 1,000 股；付出 $45,029、收进 $50,050' :
          s1 < 3 ? '股票一栏：净交出 100 股' : '三笔变一笔：交出 100 股，收进 $5,021';
      }
    });
  })();

  /* ---------- 图 3：风险越大，押金越多（示意） ---------- */
  (function () {
    const fig = $('fig3'); if (!fig) return;
    const H = [28, 55, 92], L = ['低', '中', '高'];
    function set(v) {
      fig.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === v)));
      $('fig3-b0').style.height = H[v] + '%';
      $('fig3-t2').textContent = '价格波动：' + L[v];
    }
    fig.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => set(+b.dataset.v)));
    set(1);
  })();

  /* ---------- 图 4：如果卖方的券商倒了 ---------- */
  (function () {
    const el = $('fig4'); if (!el) return;
    const stage = el.querySelector('.pf-stage');
    stepper(el, {
      steps: [
        { label: '两条线', what: '券商甲（小林）— NSCC — 券商乙。', why: '比对之后，NSCC 是双方各自的对手方。', learn: '甲和乙之间没有直接的线。' },
        { label: '券商乙出问题', what: '结算日之前，券商乙出了问题，NSCC 对它停止行事。', why: 'NSCC 停止为它提供服务，并了结它留下的、由 NSCC 担保的头寸。', learn: '乙的方框变成虚线。' },
        { label: '小林的交易照常完成', what: 'NSCC 按约定向券商甲交付 600 股。', why: 'NSCC 是甲的对手方，它的义务不因乙违约而消失。', learn: '小林的持仓显示「已结算」。' },
        { label: '亏损由谁承担', what: '先用违约会员自己的清算基金和其他资源；不够，NSCC 用自有资金出一部分；还不够，其他会员按清算基金比例分摊。', why: '文件中 NSCC 出的部分是不少于其留存收益的 25%，或董事会决定的更高金额。', learn: '违约方先承担，中央对手方也要承担一部分，最后才由会员群体分摊。' }
      ],
      render(i, st) {
        reveal(stage, i + 1, st);
        const s1 = st ? 4 : i + 1;
        $('fig4-b').classList.toggle('down', s1 >= 2);
        $('fig4-st').textContent = s1 >= 3 ? '已结算' : '未结算';
        $('fig4-st').classList.toggle('done', s1 >= 3);
      }
    });
  })();

  window.S0204 = { N1, NET, D };
})();
