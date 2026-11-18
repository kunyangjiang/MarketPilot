/* MarketPilot 设计探索 · 第 1 轮 · 共用样例内容
 * 所有方向使用同一份内容，便于公平比较。
 * 文字摘自 lessons/S02-02/S02-02-课文.md（试写稿 v2）与 lessons/S09-03/S09-03-课文.md、史实时间线（v2.1），
 * 只做节选，没有改写。数字取自 S02-02 图 1、图 2 与 S09-03 图 1。
 * 这是样稿数据，不是生产代码。 */
(function () {
  const MP = {};

  MP.site = {
    name: 'MarketPilot',
    subtitle: 'Financial Markets as Complex Systems',
    zhSubtitle: '把金融市场当作复杂系统来理解',
    motto: ['叙事驱动', '直觉优先', '机制严谨'],
    intro: '从一张订单簿到一场金融恐慌：61 课，按四个层级展开。每一课都从一个具体的故事开始，落到一个可以验证的机制上。'
  };

  MP.layers = [
    { n: '一', name: '货币、市场与资产', stages: [
      { id: 'S01', name: '货币、信用与利率', count: 6 },
      { id: 'S02', name: '市场如何运作', count: 5 },
      { id: 'S03', name: '投资者到底在交易什么', count: 7 } ] },
    { n: '二', name: '价值、风险与信息', stages: [
      { id: 'S04', name: '估值：把未来变成价格', count: 6 },
      { id: 'S05', name: '风险：度量、分散、定价与转移', count: 4 },
      { id: 'S06', name: '信息、预期与市场判断', count: 4 } ] },
    { n: '三', name: '互动、投机与危机', stages: [
      { id: 'S07', name: '投资者如何相互影响', count: 5 },
      { id: 'S08', name: '投机、杠杆与泡沫', count: 5 },
      { id: 'S09', name: '金融危机与系统性风险', count: 8 } ] },
    { n: '四', name: '现代市场与独立判断', stages: [
      { id: 'S10', name: '现代市场结构与全球联系', count: 7 },
      { id: 'S11', name: '独立金融判断', count: 4 } ] }
  ];
  MP.stages = MP.layers.flatMap((l, i) => l.stages.map(s => Object.assign({ layer: i }, s)));

  /* 样稿中的发布状态只是演示用：S02-02 作为"已发布"示例，S09-03 作为"预览"示例。
     真实发布状态由 PO 签核决定。 */
  MP.s02 = [
    { id: 'S02-01', title: '一家公司为什么要发行股票，你买股票的钱又去了哪里？', status: 'unpublished' },
    { id: 'S02-02', title: '股价到底是谁决定的？', status: 'published' },
    { id: 'S02-03', title: '为什么屏幕上显示 $100，你下单却可能花 $100.30？', status: 'unpublished' },
    { id: 'S02-04', title: '点击 Buy 之后，你的股票究竟经历了什么？', status: 'unpublished' },
    { id: 'S02-05', title: '你怎么能卖出一只自己并不拥有的股票？', status: 'unpublished' }
  ];
  MP.featured = [
    { id: 'S02-02', stage: 'S02 市场如何运作', title: '股价到底是谁决定的？', q: '没有人"定价"的市场里，价格是怎样产生的？', status: 'published' },
    { id: 'S09-03', stage: 'S09 金融危机与系统性风险', title: '1907 年，一场失败的铜矿股逼空，为什么让纽约的信托公司门前排起长队？', q: '流动性问题和偿付能力问题，为什么在挤兑现场看起来一模一样？', status: 'preview' }
  ];
  MP.statusLabel = { published: '已发布', preview: '预览', unpublished: '未发布' };

  MP.lesson = {
    id: 'S02-02', stage: 'S02 市场如何运作', no: '第 2 课',
    title: '股价到底是谁决定的？',
    version: '试写稿 v2',
    prereq: [{ id: 'S02-01', title: '一家公司为什么要发行股票，你买股票的钱又去了哪里？', status: 'unpublished' }],
    next: { id: 'S02-03', title: '为什么屏幕上显示 $100，你下单却可能花 $100.30？', status: 'unpublished' },
    toc: ['一个被自己改写的"股价"', '屏幕上其实有三个数字', '你提交的不是"一个价格"，而是一个条件', '一张订单簿', '撮合：交易所其实什么也不"决定"', '不交易，报价也会变', '报价可以收回', '同样的股价，完全不同的流动性', '那么，价格到底是谁决定的？', '现实比模型复杂在哪里', '回到小林'],
    tocActive: 1
  };

  /* 课文节选（原文）。h2 = 小节标题；p = 段落；ul = 列表；pull = 可做引文强调的原句 */
  MP.lessonBlocks = [
    { t: 'h2', x: '屏幕上其实有三个数字' },
    { t: 'p', x: '先把小林的屏幕看仔细。那个大号数字下面，通常还有两行小字：' },
    { t: 'ul', x: ['<b>买一：$50.00 × 300</b>', '<b>卖一：$50.02 × 200</b>'] },
    { t: 'p', x: '大多数人会忽略这两行字，但它们比大号数字重要得多。' },
    { t: 'p', x: '"卖一 $50.02 × 200"的意思是：此刻公开挂出的卖单当中，要价最低的是 $50.02，在这个价格上一共有 200 股等着卖。' },
    { t: 'p', x: '"买一 $50.00 × 300"的意思是：此刻公开挂出的买单当中，出价最高的是 $50.00，在这个价格上一共想买 300 股。' },
    { t: 'p', x: '而那个大号的 $50.01，叫作<b>最新成交价</b>。它记录的是<b>上一笔已经完成的交易</b>的价格。就在九点五十九分五十八秒，有人以 $50.01 买走了 100 股。' },
    { t: 'p', x: '请注意这三个数字的性质完全不同：' },
    { t: 'ul', x: ['买一和卖一，是<b>现在</b>有人愿意成交的价格。它们是报价，你可以去"接"。', '最新成交价，是<b>过去</b>某一刻实际成交的价格。它是一条记录，已经无法再接。'] },
    { t: 'pull', x: '屏幕上最醒目的数字，恰恰是此刻订单簿上没有任何人报出的价格。' },
    { t: 'h2', x: '撮合：交易所其实什么也不"决定"' },
    { t: 'p', x: '订单簿由交易所的<b>撮合引擎</b>维护。它是一套计算机程序，严格执行两条规则。' },
    { t: 'p', x: '<b>第一条，价格优先。</b>买的时候，先和要价最低的卖单成交；卖的时候，先和出价最高的买单成交。' },
    { t: 'p', x: '<b>第二条，时间优先。</b>同一个价格上如果有多张订单，先到的先成交。' },
    { t: 'model', x: '这是本课模型使用的撮合规则。真实交易所的连续交易大多以它为基础，再加上各自的细则。' },
    { t: 'figure' },
    { t: 'reg', date: '2026-11-16', x: '<b>最小报价单位。</b>价格在 $1 以上的股票，报价单位一般为 $0.01。SEC 于 2024 年通过修订，为部分价差很窄的股票引入 $0.005 的报价单位；2026 年 6 月 11 日，SEC 将该修订的合规日期延至 2027 年 11 月的第一个营业日。' }
  ];

  /* 订单簿：S02-02 图 1（10:00:00） */
  MP.book = {
    time: '10:00:00',
    asks: [ /* 从高到低 */
      { p: 50.06, q: 600, o: [['E', 600, '']] },
      { p: 50.04, q: 400, o: [['D', 400, '']] },
      { p: 50.03, q: 300, o: [['C', 100, '09:58:05'], ['G', 200, '09:59:50']] },
      { p: 50.02, q: 200, o: [['B', 200, '']] }
    ],
    bids: [ /* 从高到低 */
      { p: 50.00, q: 300, o: [['H', 100, '09:58:10'], ['J', 200, '09:59:40']] },
      { p: 49.99, q: 500, o: [['K', 500, '']] },
      { p: 49.97, q: 400, o: [['L', 400, '']] },
      { p: 49.95, q: 800, o: [['M', 800, '']] }
    ],
    last: { p: 50.01, q: 100, t: '09:59:58' },
    spread: 0.02
  };
  /* 小林的市价买单 600 股：S02-02 图 2 */
  MP.order = { side: '买', type: '市价单', q: 600, who: '小林' };
  MP.fills = [
    { p: 50.02, who: 'B', q: 200, amt: 10004 },
    { p: 50.03, who: 'C', q: 100, amt: 5003 },
    { p: 50.03, who: 'G', q: 200, amt: 10006 },
    { p: 50.04, who: 'D', q: 100, amt: 5004 }
  ];
  MP.fillTotal = { q: 600, amt: 30017, avg: '50.0283' };
  /* 样稿展示"第 2 步之后"的中间状态：B 已成交，C 已成交，G 正在成交 */
  MP.demoStep = { step: 3, of: 4, filled: { B: 200, C: 100, G: 200 }, cumQ: 500, cumAmt: 25013, note: '第 3 步：$50.03 价位按时间优先，先 C（09:58:05）后 G（09:59:50）' };

  /* S09-03 节选 */
  MP.s0903 = {
    title: '1907 年，一场失败的铜矿股逼空，为什么让纽约的信托公司门前排起长队？',
    para: '下面用一张示意资产负债表看看这个前提有多关键。注意，这些数字不是尼克博克或任何一家真实信托公司的账目，只是为了让机制看得清楚，按 1906 年信托公司 15% 准备、5% 现金的规定设计的模型。',
    conclusion: '按当前资产价值假设，净资产仍为正，但当日可支付现金不足。',
    assets: [
      { k: '金库现金', v: 5, liq: '能，立即', lv: 3 },
      { k: '存在其他银行的款项', v: 10, liq: '通常能', lv: 3 },
      { k: '通知贷款（以证券作抵押）', v: 25, liq: '能叫回，但在恐慌中要打折', lv: 2 },
      { k: '持有的证券', v: 15, liq: '能卖，但在恐慌中要打大折', lv: 1 },
      { k: '抵押贷款与其他长期贷款', v: 40, liq: '不能', lv: 0 },
      { k: '房地产及其他', v: 15, liq: '不能', lv: 0 }
    ],
    liabs: [{ k: '存款', v: 100 }, { k: '资本', v: 10 }],
    total: 110,
    timeline: [
      { d: '10-14', w: '周一', x: '联合铜业股票被大量买入，股价从约 39 美元急升', src: 'TM90；WP', m: '◐' },
      { d: '10-16', w: '周三', x: '逼空彻底失败，股价跌到约 10 美元；两家经纪行停业', src: 'TM90；FRH', m: '✔' },
      { d: '10-18', w: '周五', x: '传出尼克博克总裁与 Morse 有关联，存款人开始提款', src: 'FRH；TM90', m: '✔' },
      { d: '10-21', w: '周一', x: '国民商业银行宣布从次日起不再为尼克博克清算；清算所拒绝其贷款请求', src: 'FRH；FHZ；SPR', m: '✔' },
      { d: '10-22', w: '周二', x: '尼克博克挤兑约三小时，付出约 800 万美元现金后，中午刚过暂停营业', src: 'TM90；FRH；SPR；OCC', m: '✔' },
      { d: '10-23', w: '周三', x: '美国信托公司的挤兑全面展开；摩根在收盘前调集约 300 万美元', src: 'TM90；SPR', m: '✔' }
    ],
    distinctions: [
      ['经由会员银行间接清算', '信托公司把支票交给一家会员银行，由它代为在清算所交换。'],
      ['正式成为清算所会员', '1907 年，纽约没有一家信托公司是会员。'],
      ['危机时能得到会员之间的集体援助', '例如清算所贷款凭证，只发给会员。']
    ]
  };

  /* 第 3 步之后的订单簿（B、C、G 已成交）。只是把图 1、图 2 的数据按步骤展开，没有新的机制。 */
  MP.after = (function () {
    const f = MP.demoStep.filled;
    const asks = MP.book.asks.map(l => {
      const o = l.o.map(([id, q, t]) => ({ id, q, t, rem: q - (f[id] || 0) }));
      return { p: l.p, q: l.q, rem: o.reduce((s, x) => s + x.rem, 0), o };
    });
    return { asks, bids: MP.book.bids, last: { p: 50.03, q: 200, t: '10:00:00', note: '刚刚与 G 成交' },
      cumQ: 500, cumAmt: 25013, avg: (25013 / 500).toFixed(4), remaining: 100, nextFill: 'D 的 $50.04' };
  })();

  /* 趣味层（第 1 轮 PO 追加要求：活泼、有趣，参考《经济学的思维方式》式的"日常谜题"开场）。
     谜题只是把课文已有的情节改写成一个问题，不新增事实；猜答案的选项中只有正确答案来自课文。 */
  MP.enigma = {
    s0202: { q: '为什么小林只买了 600 股，屏幕上的股价就从 $50.01 跳到了 $50.04？', hook: '北岭电池没有发布任何消息。唯一发生的事情，是小林买了 600 股。', who: '小林' },
    s0903: { q: '为什么一只铜矿股的逼空失败，会让纽约信托公司门前排起长队？', hook: '1907 年 10 月 22 日，尼克博克信托公司被挤兑约三小时，付出约 800 万美元现金，中午刚过就暂停营业。' }
  };
  MP.guess = {
    q: '先猜一猜：小林的 600 股，平均每股花了多少钱？',
    opts: ['$50.01', '$50.02', '约 $50.03', '$50.04'],
    answer: 2,
    reveal: '平均每股约 $50.0283。$50.01 是过去的成交价，小林根本拿不到；他的市价单从卖一 $50.02 一路"吃"到了 $50.04。'
  };

  /* 四格开场（情节来自 S02-02 第一节，台词为课文情节的口语化，不新增事实） */
  MP.strip = [
    { scene: '屏幕：$50.01', say: '买 600 股，市价！', who: '小林' },
    { scene: '成交回报：600 股 · 合计 $30,017 · 均价 $50.0283', say: '怎么比我算的多了 11 美元？', who: '小林' },
    { scene: '屏幕：$50.04', say: '……', who: '小林' },
    { scene: '没有任何新闻', say: '刚才这个 $50.04，是谁定的？', who: '小林' }
  ];
  /* 简笔小林（SVG 片段，可在各方向改色） */
  MP.figure = function (x, y, s, col, mood) {
    s = s || 1; col = col || '#111';
    const mouth = mood === 'o' ? '<circle cx="0" cy="-30" r="2.4" fill="' + col + '"/>' : mood === 'q' ? '<path d="M-4 -29 q4 -3 8 0" stroke="' + col + '" fill="none" stroke-width="1.6"/>' : '<path d="M-4 -31 q4 4 8 0" stroke="' + col + '" fill="none" stroke-width="1.6"/>';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" stroke="' + col + '" stroke-width="2.4" fill="none" stroke-linecap="round"><circle cx="0" cy="-36" r="12" fill="#fff"/><circle cx="-4" cy="-38" r="1.4" fill="' + col + '" stroke="none"/><circle cx="4" cy="-38" r="1.4" fill="' + col + '" stroke="none"/>' + mouth + '<path d="M0 -24 V6 M0 -14 L-12 -2 M0 -14 L12 -4 M0 6 L-9 26 M0 6 L9 26"/></g>';
  };
  MP.stripSVG = function (o) {
    o = o || {}; const ink = o.ink || '#111', bg = o.bg || '#fff', acc = o.acc || '#E8B23A', font = o.font || 'Noto Sans SC, sans-serif';
    const W = 220, H = 200, gap = 12;
    return '<svg viewBox="0 0 ' + (W * 4 + gap * 3) + ' ' + H + '" width="100%" role="img" aria-label="四格漫画：小林市价买入 600 股，成交均价 $50.0283，随后屏幕价格从 $50.01 跳到 $50.04，他问：这个价是谁定的？" font-family="' + font + '">' +
      MP.strip.map((p, i) => {
        const x = i * (W + gap);
        const bubble = '<g transform="translate(' + (x + 14) + ',14)"><rect width="' + (W - 28) + '" height="40" rx="18" fill="' + bg + '" stroke="' + ink + '" stroke-width="2"/><path d="M' + (W / 2 - 14) + ' 40 l6 14 l6 -14" fill="' + bg + '" stroke="' + ink + '" stroke-width="2"/><rect x="' + (W / 2 - 13) + '" y="37" width="12" height="5" fill="' + bg + '"/><text x="' + (W / 2 - 14) + '" y="25" text-anchor="middle" font-size="13" font-weight="700" fill="' + ink + '">' + p.say + '</text></g>';
        const screen = '<g transform="translate(' + (x + 14) + ',' + (H - 46) + ')"><rect width="' + (W - 28) + '" height="34" fill="' + (i === 2 ? acc : bg) + '" stroke="' + ink + '" stroke-width="2"/><text x="' + ((W - 28) / 2) + '" y="22" text-anchor="middle" font-size="' + (p.scene.length > 14 ? 10 : 13) + '" font-weight="700" fill="' + ink + '">' + p.scene + '</text></g>';
        const lines = i === 2 ? '<g stroke="' + ink + '" stroke-width="1.2">' + [0, 1, 2, 3, 4, 5].map(k => '<line x1="' + (x + 20 + k * 6) + '" y1="70" x2="' + (x + 60 + k * 4) + '" y2="' + (110 + k * 3) + '"/>').join('') + '</g>' : '';
        return '<g><rect x="' + x + '" y="0" width="' + W + '" height="' + H + '" fill="' + bg + '" stroke="' + ink + '" stroke-width="3"/>' + lines + bubble + MP.figure(x + W / 2, 128, 1, ink, i === 0 ? 'smile' : i === 3 ? 'q' : 'o') + screen + '<text x="' + (x + W - 8) + '" y="' + (H - 52) + '" text-anchor="end" font-size="10" fill="' + ink + '">' + (i + 1) + '</text></g>';
      }).join('') + '</svg>';
  };

  /* 趣味层的默认结构，各方向用自己的 CSS 改造外观 */
  MP.enigmaHTML = function (key, label) {
    const e = MP.enigma[key];
    return '<section class="enigma" aria-label="日常谜题"><div class="enigma-lab">' + (label || '日常谜题') + '</div><p class="enigma-q">' + e.q + '</p><p class="enigma-hook">' + e.hook + '</p></section>';
  };
  /* picked：样稿中演示"读者选了哪一项"（静态）；揭晓状态一并画出 */
  MP.guessHTML = function (opts) {
    opts = opts || {};
    const picked = opts.picked == null ? 0 : opts.picked, g = MP.guess;
    return '<section class="guess" aria-label="先猜再看"><div class="guess-lab">' + (opts.label || '先猜再看') + '</div><p class="guess-q">' + g.q + '</p><div class="guess-opts" role="radiogroup">' +
      g.opts.map((o, i) => '<button role="radio" aria-checked="' + (i === picked) + '" class="' + (i === g.answer ? 'right ' : '') + (i === picked && i !== g.answer ? 'wrong' : '') + '">' + o + (i === picked && i !== g.answer ? '<small>你的猜测</small>' : '') + (i === g.answer ? '<small>正确</small>' : '') + '</button>').join('') +
      '</div><p class="guess-reveal">' + g.reveal + '</p></section>';
  };

  /* 首页宣言（陈述句，不提问）与全课程 61 课清单 */
  MP.manifesto = { line1: '金融市场是一个复杂系统。', line2: '从一张订单簿，到一场金融恐慌。', en: 'Financial Markets as Complex Systems' };
  MP.all = MP.stages.map(s => ({ stage: s, lessons: Array.from({ length: s.count }, (_, i) => {
    const id = s.id + '-' + String(i + 1).padStart(2, '0');
    return { id, status: id === 'S02-02' ? 'published' : id === 'S09-03' ? 'preview' : 'unpublished' };
  }) }));
  MP.entries = [
    { k: '从第一课开始', v: 'S01-01 · 未发布', dis: true },
    { k: '首发课', v: 'S02-02 股价到底是谁决定的？', href: '#lesson' },
    { k: '预览', v: 'S09-03 1907 年的恐慌', href: '#panel' },
    { k: '全部课程', v: '4 个层级 · 11 个阶段 · 61 课', href: '#home' }
  ];

  MP.kinds = {
    fact: { zh: '史实', en: 'Historical fact' },
    mech: { zh: '机制', en: 'Mechanism' },
    model: { zh: '模型假设', en: 'Model assumption' },
    reg: { zh: '时效性规则', en: 'Time-sensitive rule' },
    debate: { zh: '有争议的解释', en: 'Contested interpretation' }
  };

  MP.money = v => '$' + v.toLocaleString('en-US');
  MP.px = v => '$' + v.toFixed(2);
  MP.maxQ = 800;

  /* 渲染课文节选。opts.figure：返回图示 HTML 的函数；opts.kind(kind, inner, extra)：标签样式 */
  MP.renderBlocks = function (opts) {
    opts = opts || {};
    return MP.lessonBlocks.map(b => {
      if (b.t === 'h2') return '<h2>' + b.x + '</h2>';
      if (b.t === 'p') return '<p>' + b.x + '</p>';
      if (b.t === 'ul') return '<ul>' + b.x.map(i => '<li>' + i + '</li>').join('') + '</ul>';
      if (b.t === 'pull') return '<p class="pull">' + b.x + '</p>';
      if (b.t === 'model') return opts.kind ? opts.kind('model', b.x) : '<aside class="kind kind-model"><span class="kind-tag">模型假设</span><p>' + b.x + '</p></aside>';
      if (b.t === 'reg') return opts.kind ? opts.kind('reg', b.x, b.date) : '<aside class="kind kind-reg"><span class="kind-tag">时效性规则 · 截至 ' + b.date + '</span><p>' + b.x + '</p></aside>';
      if (b.t === 'figure') return opts.figure ? opts.figure() : '';
      return '';
    }).join('\n');
  };

  /* 页面切换：#home / #lesson / #panel。带 ?embed=1 时隐藏样稿切换条。 */
  MP.boot = function (optName) {
    const embed = /[?&]embed=1/.test(location.search);
    if (!embed) {
      const bar = document.createElement('nav');
      bar.className = 'proto-bar';
      bar.setAttribute('aria-label', '样稿切换');
      bar.innerHTML = '<a href="../index.html">← 返回索引</a><span>' + optName + '</span>' +
        '<a href="#home">首页</a><a href="#lesson">课文</a><a href="#panel">交互面板</a>';
      document.body.prepend(bar);
      const st = document.createElement('style');
      st.textContent = '.proto-bar{position:fixed;z-index:9999;right:12px;bottom:12px;display:flex;gap:10px;align-items:center;font:12px/1.2 system-ui,sans-serif;background:#222;color:#eee;padding:8px 12px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.3)}.proto-bar a{color:#9cf;text-decoration:none}.proto-bar span{color:#fff;font-weight:600}';
      document.head.appendChild(st);
    }
    function show() {
      const id = (location.hash || '#home').slice(1);
      document.querySelectorAll('[data-screen]').forEach(s => { s.hidden = s.dataset.screen !== id; });
      window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', show);
    show();
  };

  window.MP = MP;
})();
