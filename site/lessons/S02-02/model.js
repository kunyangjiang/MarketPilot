/* S02-02 订单簿沙盘 · 数据与会话层（不依赖 DOM）
 * 数据全部取自 lessons/S02-02/S02-02-交互方案.md 第 6 节（与课文图 1、图 3 一致）。价格为整数美分。
 * 会话层负责：两种角色模式、时钟（读者每次操作 +5 秒）、场景预设、外部事件、权限检查。
 * 界面只调用这里的方法；测试也走同一条路径。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../engine/orderbook.js'));
  else root.S0202 = factory(root.MPOrderBook);
})(typeof self !== 'undefined' ? self : this, function (OB) {
  'use strict';
  const T = OB.T;

  /* ---------- 6.1 初始订单簿（10:00:00，小林下单前） ---------- */
  const INITIAL = {
    asks: [
      { id: 'E', owner: 'E', price: 5006, qty: 600, time: T(9, 57, 30) },
      { id: 'D', owner: 'D', price: 5004, qty: 400, time: T(9, 58, 20) },
      { id: 'C', owner: 'C', price: 5003, qty: 100, time: T(9, 58, 5) },
      { id: 'G', owner: 'G', price: 5003, qty: 200, time: T(9, 59, 50) },
      { id: 'B', owner: 'B', price: 5002, qty: 200, time: T(9, 59, 10) }
    ],
    bids: [
      { id: 'H', owner: 'H', price: 5000, qty: 100, time: T(9, 58, 10) },
      { id: 'J', owner: 'J', price: 5000, qty: 200, time: T(9, 59, 40) },
      { id: 'K', owner: 'K', price: 4999, qty: 500, time: T(9, 57, 45) },
      { id: 'L', owner: 'L', price: 4997, qty: 400, time: T(9, 56, 30) },
      { id: 'M', owner: 'M', price: 4995, qty: 800, time: T(9, 55, 0) }
    ],
    last: { price: 5001, qty: 100, time: T(9, 59, 58) }
  };
  const START_CLOCK = T(10, 0, 0);

  /* ---------- 课文图 3 / 场景 6：两本"股价相同"的订单簿（只给出卖方，课文与方案均未给买方） ---------- */
  const BOOK_A = { asks: [{ id: 'A1', owner: 'A1', price: 5001, qty: 3000, time: null }], bids: [], last: { price: 5000, qty: 100, time: null } };
  const BOOK_B = { asks: [
      { id: 'B1', owner: 'B1', price: 5005, qty: 100, time: null },
      { id: 'B2', owner: 'B2', price: 5020, qty: 200, time: null },
      { id: 'B3', owner: 'B3', price: 5040, qty: 300, time: null },
      { id: 'B4', owner: 'B4', price: 5080, qty: 400, time: null }
    ], bids: [], last: { price: 5000, qty: 100, time: null } };
  /* 注：课文与方案都只写"最新成交价都是 $50.00"，没有给出那笔成交的股数。这里的 qty 只为满足数据结构，界面不显示它。 */

  /* ---------- 外部市场事件（市场实验模式） ---------- */
  const EVENTS = {
    X1: { id: 'X1', name: '未证实的消息：报价者撤回部分卖单', short: 'C、G、D 撤单',
          story: '北岭电池最大的客户可能正在重新谈判供货合同。消息真假未明，报价者 C、G、D 撤回 $50.03 与 $50.04 两档的全部卖单。',
          withdraw: ['C', 'G', 'D'] },
    X2: { id: 'X2', name: '新的卖方报价者进场', short: '小周在 $50.01 挂入 200 股卖单',
          story: '另一位投资者小周提交限价卖单：卖 200 股，不低于 $50.01。',
          add: [{ id: 'Z', owner: 'zhou', side: 'sell', type: 'limit', qty: 200, price: 5001 }] },
    X3: { id: 'X3', name: '切换到对比视图', short: '并排显示厚、薄两本订单簿',
          story: '两只虚构的股票，最新成交价都是 $50.00。左边订单簿厚，右边订单簿薄。' }
  };

  const NAMES = { you: '你', zhou: '小周', buyer2: '另一位买家' };
  const ownerName = o => NAMES[o] || o;

  /* ---------- 读者控件的取值范围（方案第 3 节） ---------- */
  const LIMITS = { qtyMin: 100, qtyMax: 3000, qtyStep: 100, priceMin: 4980, priceMax: 5030 };

  /* ---------- 6.2 场景 ---------- */
  const SCENARIOS = [
    { id: 'S1', n: 1, title: '小林的市价单', mode: 'trader', start: 'initial', lesson: '对应：撮合',
      question: '屏幕显示 $50.01。市价买入 600 股，平均每股要花多少？',
      steps: [{ kind: 'reader', order: { side: 'buy', type: 'market', qty: 600 }, text: '市价买入 600 股' }],
      predict: { at: 0, q: '平均每股会花多少？成交后屏幕上的"股价"是多少？',
                 fields: [{ key: 'avg', label: '平均每股', kind: 'price' }, { key: 'last', label: '成交后的最新成交价', kind: 'price' }] } },
    { id: 'S2', n: 2, title: '不交易，报价也会变', mode: 'trader', start: 'after-S1', lesson: '对应：不交易，报价也会变',
      question: '现在以你自己的身份挂一张"卖 200 股，不低于 $50.01"的单。最新成交价会变吗？',
      steps: [
        { kind: 'reader', order: { side: 'sell', type: 'limit', qty: 200, price: 5001 }, text: '限价卖出 200 股，不低于 $50.01（课文中的小周）' },
        { kind: 'scripted', order: { side: 'buy', type: 'market', qty: 100, owner: 'buyer2' }, text: '下一步：另一位买家市价买入 100 股' }
      ],
      after: '你可以撤销自己剩余的 100 股，观察卖一退回 $50.04 × 300。',
      predict: { at: 1, q: '这笔买入会让最新成交价上升还是下降？', fields: [{ key: 'dir', label: '最新成交价', kind: 'choice', options: ['上升', '下降', '不变'] }] } },
    { id: 'S3', n: 3, title: '报价被收回', mode: 'experiment', start: 'initial', lesson: '对应：报价可以收回',
      question: '一条真假未明的消息出现了。报价者会怎么做？小林这次要多付多少？',
      steps: [
        { kind: 'event', event: 'X1', text: '触发外部事件 X1' },
        { kind: 'reader', switchTo: 'trader', order: { side: 'buy', type: 'market', qty: 600 }, text: '市价买入 600 股' }
      ],
      predict: { at: 1, q: '最上面一行报价变了吗？小林这次会比场景 1 多付还是少付？',
                 fields: [{ key: 'top', label: '最上面一行报价', kind: 'choice', options: ['变了', '没变'] },
                          { key: 'more', label: '和场景 1 相比', kind: 'choice', options: ['多付', '少付', '一样'] }] } },
    { id: 'S4', n: 4, title: '限价单是上限，不是成交价', mode: 'trader', start: 'initial', lesson: '对应：回到小林',
      question: '限价买 600 股，不超过 $50.03。能买到几股？每股花多少？',
      steps: [{ kind: 'reader', order: { side: 'buy', type: 'limit', qty: 600, price: 5003 }, text: '限价买入 600 股，不超过 $50.03' }],
      predict: { at: 0, q: '能买到几股？剩下的会怎样？',
                 fields: [{ key: 'qty', label: '能买到', kind: 'shares' },
                          { key: 'rest', label: '剩下的', kind: 'choice', options: ['挂进订单簿等待', '自动取消', '以更高价格成交'] }] } },
    { id: 'S5', n: 5, title: '先到先得', mode: 'trader', start: 'initial', lesson: '对应：撮合 · 时间优先', details: true,
      question: '市价卖出 200 股。$50.00 上有 H 和 J 两张买单，谁先成交？',
      steps: [{ kind: 'reader', order: { side: 'sell', type: 'market', qty: 200 }, text: '市价卖出 200 股' }] },
    { id: 'S6', n: 6, title: '同样的股价，不同的深度（选做 · 下一课预告）', mode: 'experiment', start: 'initial', lesson: '选做 · 预告下一课：交易成本',
      question: '两边各市价买入 1,000 股，平均价差多少？',
      steps: [
        { kind: 'event', event: 'X3', text: '触发外部事件 X3：切换到对比视图' },
        { kind: 'reader', switchTo: 'trader', book: 'A', order: { side: 'buy', type: 'market', qty: 1000 }, text: '在股票 A 上市价买入 1,000 股' },
        { kind: 'reader', book: 'B', order: { side: 'buy', type: 'market', qty: 1000 }, text: '在股票 B 上市价买入 1,000 股' }
      ],
      predict: { at: 1, q: '两边的平均价差多少？', fields: [{ key: 'diff', label: '平均每股相差', kind: 'price' }] } },
    { id: 'S7', n: 7, title: '对手方不够了', mode: 'trader', start: 'initial', lesson: '对应：你提交的是一个条件',
      question: '卖方一共只挂了 1,500 股。市价买入 2,500 股会怎样？',
      steps: [{ kind: 'reader', order: { side: 'buy', type: 'market', qty: 2500 }, text: '市价买入 2,500 股' }],
      note: '真实交易场所对市价单设有价格保护等机制，可能拒绝、限制或部分取消这类订单，本模型只模拟"对手方不足"这一种情况。' }
  ];

  /* ---------- 会话 ---------- */
  function createSession() {
    const S = {};
    let st;

    function fresh() {
      st = { mode: 'trader', clock: START_CLOCK, view: 'single', book: OB.create(INITIAL), compare: null,
             youSeq: 0, otherSeq: 0, scenario: null, step: 0, reports: [], journal: [] };
    }
    function note(entry) { st.journal.push(entry); }
    function tick() { const t = st.clock; st.clock += 5000; return t; }

    function bookRef(which) {
      if (!which || which === 'main') return { get: () => st.book, set: b => { st.book = b; } };
      if (!st.compare) throw new Error('对比视图还没有打开');
      return { get: () => st.compare[which], set: b => { st.compare[which] = b; } };
    }

    function place(order, which, owner) {
      const ref = bookRef(which);
      const id = owner === 'you' ? 'Y' + (++st.youSeq) : 'P' + (++st.otherSeq);
      const time = tick();
      const r = OB.submit(ref.get(), Object.assign({}, order, { id: id, owner: owner, time: time }));
      ref.set(r.state);
      const rep = Object.assign({ book: which || 'main' }, r.report);
      st.reports.push(rep);
      note({ kind: 'order', time: time, book: which || 'main', report: rep });
      return { report: rep, trace: r.trace };
    }

    function validate(o) {
      if (o.side !== 'buy' && o.side !== 'sell') return '请选择买或卖';
      if (o.type !== 'market' && o.type !== 'limit') return '请选择订单类型';
      if (!Number.isSafeInteger(o.qty) || o.qty < LIMITS.qtyMin || o.qty > LIMITS.qtyMax || o.qty % LIMITS.qtyStep) return '数量须为 100–3,000 股，以 100 股为单位';
      if (o.type === 'limit' && (!Number.isSafeInteger(o.price) || o.price < LIMITS.priceMin || o.price > LIMITS.priceMax)) return '限价须在 $49.80–$50.30 之间';
      return null;
    }

    /** 读者以自己的身份下单（交易者模式） */
    S.submit = function (o, which) {
      if (st.mode !== 'trader') return { ok: false, reason: 'mode', message: '下单需要切换到交易者模式' };
      const order = { side: o.side, type: o.type, qty: o.qty, price: o.type === 'limit' ? o.price : undefined };
      const err = validate(order);
      if (err) return { ok: false, reason: 'invalid', message: err };
      if (st.view === 'compare' && which !== 'A' && which !== 'B') return { ok: false, reason: 'invalid', message: '对比视图中请选择股票 A 或股票 B' };
      if (st.view !== 'compare' && which && which !== 'main') return { ok: false, reason: 'invalid', message: '请先打开对比视图' };
      const r = place(order, which, 'you');
      advanceIf('reader');
      return Object.assign({ ok: true }, r);
    };

    /** 撤销读者自己的挂单。对他人订单一律拒绝。 */
    S.cancel = function (orderId, which) {
      if (st.mode !== 'trader') return { ok: false, reason: 'mode', message: '撤单需要在交易者模式下进行' };
      const ref = bookRef(which);
      const r = OB.cancel(ref.get(), { orderId: orderId, requester: 'you', time: st.clock });
      if (!r.ok) {
        return { ok: false, reason: r.reason, message: r.reason === 'not-owner' ? '只能撤销你自己的订单。其他参与者的订单由他们自己决定。' : '这张订单已经不在订单簿上（可能已全部成交），无法撤销。' };
      }
      ref.set(r.state);
      note({ kind: 'cancel', time: st.clock, book: which || 'main', cancelled: r.cancelled });
      st.clock += 5000;
      return { ok: true, cancelled: r.cancelled };
    };

    S.setMode = function (m) { if (m !== 'trader' && m !== 'experiment') throw new TypeError('mode'); st.mode = m; };

    /** 外部事件（市场实验模式） */
    S.trigger = function (eventId) {
      if (st.mode !== 'experiment') return { ok: false, reason: 'mode', message: '外部事件只能在市场实验模式中触发' };
      const ev = EVENTS[eventId];
      if (!ev) return { ok: false, reason: 'unknown', message: '没有这个事件' };
      const time = st.clock;
      if (eventId === 'X3') {
        st.view = 'compare';
        st.compare = { A: OB.create(BOOK_A), B: OB.create(BOOK_B) };
        note({ kind: 'event', time: time, event: ev });
        st.clock += 5;
        advanceIf('event');
        return { ok: true, event: ev };
      }
      if (st.view === 'compare') return { ok: false, reason: 'view', message: '请先回到单本订单簿' };
      const missing = (ev.withdraw || []).filter(id => !OB.find(st.book, id));
      if (missing.length) return { ok: false, reason: 'state', message: '事件 ' + eventId + ' 需要初始订单簿中的 ' + ev.withdraw.join('、') + '，请先重置' };
      if (ev.add && ev.add.some(a => OB.find(st.book, a.id))) return { ok: false, reason: 'state', message: '小周的订单已经在订单簿上了' };
      const r = OB.applyMarketEvent(st.book, { id: ev.id, label: ev.name, time: time, withdraw: ev.withdraw,
                                                add: (ev.add || []).map(a => Object.assign({}, a, { time: time })) });
      st.book = r.state;
      note({ kind: 'event', time: time, event: ev, withdrawn: r.withdrawn, reports: r.reports });
      st.clock += 5; // "几毫秒之后"
      advanceIf('event');
      return { ok: true, event: ev, withdrawn: r.withdrawn, reports: r.reports };
    };

    /** 场景中由脚本代为提交的订单（不是读者的操作） */
    S.runScripted = function () {
      const sc = st.scenario, step = sc && sc.steps[st.step];
      if (!step || step.kind !== 'scripted') return { ok: false, reason: 'no-step', message: '当前没有待执行的脚本步骤' };
      const r = place({ side: step.order.side, type: step.order.type, qty: step.order.qty, price: step.order.price }, step.book, step.order.owner);
      st.step++;
      return Object.assign({ ok: true }, r);
    };

    function advanceIf(kind) {
      const sc = st.scenario, step = sc && sc.steps[st.step];
      if (step && step.kind === kind) {
        st.step++;
        const nx = sc.steps[st.step];
        if (nx && nx.switchTo) st.mode = nx.switchTo; // 场景 3、6：事件之后自动切回交易者模式
      }
    }

    S.loadScenario = function (id) {
      const sc = SCENARIOS.find(x => x.id === id);
      if (!sc) throw new Error('没有这个场景：' + id);
      fresh();
      if (sc.start === 'after-S1') { // 场景 2 接场景 1 的结束状态
        place({ side: 'buy', type: 'market', qty: 600 }, null, 'you');
      }
      st.scenario = sc; st.step = 0; st.mode = sc.mode;
      return sc;
    };

    S.reset = function () { fresh(); };
    S.restartScenario = function () { return st.scenario ? S.loadScenario(st.scenario.id) : (fresh(), null); };

    S.state = function () { return st; };
    S.pendingStep = function () { return st.scenario ? st.scenario.steps[st.step] || null : null; };

    fresh();
    return S;
  }

  return { INITIAL, START_CLOCK, BOOK_A, BOOK_B, EVENTS, SCENARIOS, LIMITS, NAMES, ownerName, createSession };
});
