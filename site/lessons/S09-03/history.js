/* S09-03 史实数据：图 A（时间线）与图 B（机构关系）。
 * 每一条都对应《史实时间线》v2.3 候选中的一行：row = 该行日期列原文，match = 该行中的一段原文（用于唯一定位），
 * src = 来源代号（必须出现在该行中），st = 核验状态（✔ / ◐）。测试会逐条核对。
 * 这里不允许出现时间线里没有的事实。 */
(function (root) {
  'use strict';

  const LANES = {
    trig: { name: '触发', tip: '逼空失败' },
    vuln: { name: '脆弱性', tip: '平时就存在的薄弱处' },
    exp: { name: '预期的转变', tip: '存款人开始担心别人会去取钱' },
    liq: { name: '流动性传导', tip: '现金需求从一处传到另一处' },
    resp: { name: '应对', tip: '谁出手、用什么工具' }
  };
  // 开关：与投机者有关的会员银行 / 信托公司 / 其他银行
  const CATS = { spec: '与投机者有关的会员银行', trust: '信托公司', other: '其他银行' };

  const T = [
    // ---------- 背景带 ----------
    { step: 0, date: '1903', lane: 'vuln', cat: 'trust', row: '1903', match: 'the most important exception', src: ['SPR'], st: '✔',
      text: '清算所规定：经由会员银行清算的信托公司须多留准备金。几乎所有信托公司宁可放弃这种间接清算；最重要的例外是尼克博克。' },
    { step: 0, date: '1906', lane: 'vuln', cat: 'trust', row: '1906', match: '15% 的准备金', src: ['TM90', 'FHZ'], st: '✔',
      text: '纽约州首次要求信托公司持有存款 15% 的准备金，其中只有 5% 须为库存现金；纽约市国民银行须持有 25%。' },
    { step: 0, date: '1907 年 5 月', lane: 'vuln', cat: null, row: '1907 年 5 月', match: '衰退', src: ['LSE'], st: '✔',
      text: '美国经济进入衰退。' },
    { step: 0, date: '1907 年夏', lane: 'vuln', cat: null, row: '1907 年夏', match: '3,000 万美元黄金', src: ['TM90'], st: '✔',
      text: '约 3,000 万美元黄金流向伦敦；秋季用钱旺季到来前，纽约的黄金存量偏低。' },
    // ---------- 10 月 ----------
    { step: 1, date: '10-14', lane: 'trig', cat: null, row: '10-14（周一）', match: '39 美元', src: ['TM90', 'WP'], st: '◐',
      text: '海因策一方大举买入联合铜业，股价从约 39 美元冲到 50 多至 60 美元。', diff: '记载不一：TM90 写升至 60 美元；Bruner & Carr（经维基百科转引）写升至 52 美元。' },
    { step: 2, date: '10-16', lane: 'trig', cat: null, row: '10-16（周三）', match: 'Gross & Kleeberg', src: ['TM90', 'FRH'], st: '✔',
      text: '逼空失败：经纪行被迫卖出保证金买入的股票，股价跌到约 10 美元；两家相关经纪行停业。' },
    { step: 2, date: '10-16 前后', lane: 'exp', cat: 'spec', row: '10-16 前后', match: '挤兑', src: ['FHZ'], st: '✔',
      text: '商业国民银行出现挤兑。' },
    { step: 3, date: '10-17 前后', lane: 'resp', cat: 'spec', row: '10-17 前后', match: '有偿付能力', src: ['TM90', 'FHZ'], st: '✔',
      text: '清算所检查商业国民银行的资产，宣布其有偿付能力，承诺支持，条件是海因策和董事会辞职。' },
    { step: 4, date: '10-18', lane: 'exp', cat: 'trust', row: '10-18（周五）', match: 'Barney', src: ['FRH', 'TM90'], st: '✔',
      text: '有消息称尼克博克总裁巴尼与莫尔斯有关联，存款人开始提款；国民商业银行为它提供信贷。' },
    { step: 5, date: '10-19', lane: 'resp', cat: 'spec', row: '10-19（周六）', match: 'Morse 完全退出', src: ['TM90'], st: '✔',
      text: '莫尔斯控制的两家银行求援；清算所以莫尔斯完全退出纽约银行业为条件同意援助。' },
    { step: 5, date: '10-20', lane: 'resp', cat: 'spec', row: '10-20（周日）', match: '1,000 万美元基金', src: ['FHZ', 'TM90', 'FRH'], st: '✔',
      text: '清算所宣布涉事会员银行都有偿付能力，设立约 1,000 万美元的援助基金。' },
    { step: 6, date: '10-21', lane: 'exp', cat: 'spec', row: '10-21（周一）', match: '商业国民银行在新管理层下复业', src: ['TM90', 'OCC'], st: '✔',
      text: '商业国民银行在新管理层下复业，这几家涉事会员银行的挤兑停止。这不等于此后所有银行问题都消失了。' },
    { step: 6, date: '10-21', lane: 'exp', cat: 'trust', row: '10-21（周一）', match: '解除 Barney 的总裁职务', src: ['FRH', 'FHZ', 'TM90', 'SPR'], st: '✔',
      text: '尼克博克董事会解除巴尼的总裁职务；国民商业银行宣布不再担任尼克博克的清算代理。' },
    { step: 6, date: '10-21 晚', lane: 'resp', cat: 'trust', row: '10-21 晚', match: '资源留给会员', src: ['FRH', 'FHZ'], st: '✔',
      text: '尼克博克向清算所求助，被拒绝：资源要留给会员。' },
    { step: 6, date: '10-21 晚', lane: 'resp', cat: 'trust', row: '10-21 晚', match: '无法判断其偿付能力', src: ['FRH', 'TM90', 'LSE'], st: '✔',
      text: '斯特朗受摩根之托查账，在可用的时间内无法判断尼克博克有没有偿付能力；摩根决定不出手。' },
    { step: 7, date: '10-22', lane: 'liq', cat: 'trust', row: '10-22（周二）', match: 'three hours', src: ['TM90', 'FRH', 'SPR', 'OCC'], st: '✔',
      text: '尼克博克被挤兑约三个小时，付出约 800 万美元现金，中午刚过暂停营业。' },
    { step: 7, date: '10-22', lane: 'liq', cat: null, row: '10-22', match: '70%', src: ['FRH'], st: '✔',
      text: '交易所的通知贷款利率从 9.5% 升至 70%。' },
    { step: 8, date: '10-23', lane: 'liq', cat: 'trust', row: '10-23（周三）', match: 'sore point', src: ['TM90', 'SPR'], st: '◐',
      text: '《纽约时报》引摩根合伙人珀金斯的话，称美国信托公司是当前的「痛点」；它的挤兑全面展开。', diff: '珀金斯的动机，历史学家看法不一；这里只记他说了什么和之后发生了什么。' },
    { step: 8, date: '10-23', lane: 'resp', cat: 'trust', row: '10-23 凌晨起', match: '300 万美元', src: ['TM90'], st: '✔',
      text: '斯特朗凌晨开始检查美国信托公司，下午报告它基本健康；摩根在收盘前为它调集约 300 万美元。' },
    { step: 9, date: '10-24 上午', lane: 'resp', cat: null, row: '10-24（周四）上午', match: '2,500 万美元存入', src: ['TM90'], st: '✔',
      text: '财政部把 2,500 万美元存入纽约的国民银行。法律只允许存入国民银行。' },
    { step: 9, date: '10-24', lane: 'liq', cat: 'trust', row: '10-24（周四）', match: 'Lincoln Trust', src: ['SPR'], st: '✔',
      text: '林肯信托开始遭到挤兑。' },
    { step: 9, date: '10-24', lane: 'liq', cat: null, row: '10-24', match: '100%', src: ['TM90', 'FRH'], st: '✔',
      text: '交易所里通知贷款几乎借不到：出价 60% 仍无人借出，报价后来到 100%。' },
    { step: 9, date: '10-24', lane: 'resp', cat: null, row: '10-24', match: '1,895 万美元', src: ['TM90'], st: '✔',
      text: '摩根召集银行承诺约 2,500 万美元，在交易所内放贷；当天市场实际借走约 1,900 万美元。' },
    { step: 10, date: '10-25', lane: 'resp', cat: null, row: '10-25（周五）', match: 'no margin sales', src: ['TM90', 'SPR'], st: '✔',
      text: '第二轮资金池：利率由市场决定，大部分时间接近 50%；用意是抑制投机，只许现金交易，不许保证金交易。' },
    { step: 10, date: '10-25', lane: 'liq', cat: 'other', row: '10 月下旬至 11 月', match: '10 月 25 日', src: ['OCC'], st: '✔',
      text: '布鲁克林第一国民银行关门。它是两家已倒闭的布鲁克林信托公司的清算代理。' },
    { step: 11, date: '10-26', lane: 'resp', cat: null, row: '10-26（周六）', match: '清算所贷款凭证', src: ['TM90', 'FRH', 'FHZ', 'T-CHLC', 'OCC'], st: '✔',
      text: '清算所发行贷款凭证（只发给会员）；会员银行开始限制存款兑现。' },
    { step: 12, date: '10-29', lane: 'resp', cat: null, row: '10-28/29', match: '3,000 万美元', src: ['TM90'], st: '✔',
      text: '摩根等人同意承销 3,000 万美元的纽约市债券。这是市政府融资困难的一部分，课文正文没有展开。' },
    { step: 12, date: '11-4', lane: 'resp', cat: null, row: '11-2 至 11-4', match: 'TC&I', src: ['TM90', 'WP'], st: '✔',
      text: '一家大经纪行濒临违约；美国钢铁公司用自己的债券收购它抵押的 TC&I 股票。这笔交易的动机至今有争议。' },
    { step: 12, date: '11 月初', lane: 'resp', cat: 'trust', row: '11-4 / 11-6', match: '2,500 万美元贷款', src: ['TM90', 'FHZ', 'SPR'], st: '◐',
      text: '摩根说服实力较强的信托公司总裁们拿出 2,500 万美元，组成联合体支持美国信托公司和林肯信托。', diff: '日期记载不一：TM90 写 11 月 4 日提供资金；FHZ、SPR 写 11 月 6 日安排落定。' },
    { step: 13, date: '10–11 月', lane: 'liq', cat: 'other', row: '10 月下旬至 11 月', match: '十家州立银行和信托公司', src: ['OCC', 'SPR'], st: '✔',
      text: '纽约市及周边共有十家州立银行和信托公司关门（两家后来复业）；储蓄银行开始要求提款须提前 60 天通知。' }
  ];

  const STEPS = [
    { label: '背景', what: '恐慌之前已经存在的四处薄弱。', why: '它们本身不会引发恐慌，但决定了冲击来了以后能不能被接住。', learn: '脆弱性和触发事件要分开看。' },
    { label: '10-14', what: '海因策一方开始大举买入联合铜业。', why: '他们想逼空卖空者。', learn: '这时一切还只发生在股票市场。' },
    { label: '10-16', what: '逼空失败，股价崩到约 10 美元；与投机者有关的商业国民银行出现挤兑。', why: '存款人担心投机者控制的银行已经把存款挪去填窟窿。', learn: '冲击第一次越出股票市场，靠的是人事关联。' },
    { label: '10-17', what: '清算所检查商业国民银行，宣布它有偿付能力，并换掉管理层。', why: '清算所平时就掌握会员的账。', learn: '信息加援助，可以很快稳住一家会员银行。' },
    { label: '10-18', what: '尼克博克开始出现提款。', why: '有消息说它的总裁与莫尔斯有关联。', learn: '担忧从会员银行转向一家信托公司。' },
    { label: '10-19～20', what: '清算所对莫尔斯的银行开出同样的条件，并设立援助基金。', why: '把投机者逐出会员银行，是恢复信心的条件。', learn: '保护圈对圈内的会员有效。' },
    { label: '10-21', what: '涉事会员银行的挤兑停止；同一天，尼克博克总裁去职，国民商业银行宣布不再担任它的清算代理；当晚，清算所拒绝援助，摩根也没有出手。', why: '尼克博克不是会员，清算所看不清它的账，一夜之间也没人能判断它的偿付能力。', learn: '这里只标「宣布」。宣布与第二天的停业是两件事，模型和图都不画精确的切断时刻。' },
    { label: '10-22', what: '尼克博克三小时付出约 800 万美元后暂停营业；通知贷款利率升到 70%。', why: '没有人出手时，排在后面的存款人只能拿不到钱。', learn: '一家信托公司停业，就成了别家存款人的「证据」。' },
    { label: '10-23', what: '挤兑转到美国信托公司；斯特朗查账后认为它基本健康，摩根当天为它调集资金。', why: '这一次有人在当天作出了判断。', learn: '同一种挤兑，有没有人及时判断，结果不同。' },
    { label: '10-24', what: '财政部存款进入国民银行；林肯信托被挤兑；交易所里通知贷款借不到，摩根召集资金池。', why: '信托公司叫回通知贷款，经纪商找不到新的贷款。', learn: '挤兑从柜台传到了交易大厅。' },
    { label: '10-25', what: '第二轮资金池，附带限制；布鲁克林第一国民银行关门。', why: '它是已倒闭信托公司的清算代理。', learn: '清算代理关系也会把风险传回给代理银行。' },
    { label: '10-26', what: '清算所发行贷款凭证，只发给会员；会员银行限制兑现。', why: '凭证用来结清会员之间的差额，把现金腾出来付给存款人。', learn: '工具有边界：信托公司只能间接受益。' },
    { label: '10-29～11 月初', what: '纽约市债券、TC&I 交易；信托公司终于组成互助联合体。', why: '信托公司需要一个类似清算所的互助安排。', learn: '缺口最终是由临时组织的私人安排补上的。' },
    { label: '全貌', what: '10–11 月间，纽约及周边仍有较小的银行和信托公司关门。', why: '第一波冲击在涉事会员银行处被接住，不等于此后所有银行问题都消失了。', learn: '最猛烈的挤兑集中在信托公司一侧。' }
  ];

  // 只画有记载的点，不插值（交互方案图 A）
  const RATES = [
    { date: '10-22', v: 70, row: '10-22', match: '70%', src: ['FRH'], note: '从 9.5% 升至 70%' },
    { date: '10-24', v: 100, row: '10-24', match: '100%', src: ['TM90', 'FRH'], note: '报价达到 100%' },
    { date: '10-25', v: 50, row: '10-25（周五）', match: '接近 50%', src: ['TM90'], note: '大部分时间接近 50%', approx: true }
  ];
  const DEPOSITS = { row: '1907-08-22 至 12-19', match: '超过 36%', src: ['FRH'], text: '8 月 22 日 → 12 月 19 日：纽约市信托公司存款减少超过 36%（只有两个时点的记载，中间不画曲线）' };

  // ---------- 图 B：机构关系 ----------
  // m: 'member'（直接会员 ✔/◐）| 'non'（不是直接会员）| 'unk'（会员身份未核实）| 'out'（非银行或人物）
  const NODES = {
    CH: { name: '纽约清算所', sub: '会员银行的私人协会', m: 'hub' },
    MER: { name: '商业国民银行', m: 'member', st: '✔', src: ['TM90', 'SPR'] },
    NBC: { name: '国民商业银行', m: 'member', st: '✔', src: ['TM90', 'SPR'] },
    NCB: { name: '国民城市银行', m: 'member', st: '◐', note: '会员身份据通行记载，本课来源未逐字核实' },
    FNB: { name: '第一国民银行', m: 'member', st: '◐', note: '会员身份据通行记载，本课来源未逐字核实' },
    OMB: { name: '其他会员银行', m: 'member', st: '', group: true },
    KNI: { name: '尼克博克', m: 'non', agent: '经国民商业银行间接清算（10-21 宣布终止；服务实际停止的时间未核实）', st: '✔', src: ['SPR', 'FRH'] },
    TCA: { name: '美国信托公司', m: 'non', agent: '清算代理关系未确立', unk: true },
    LIN: { name: '林肯信托', m: 'non', agent: '清算代理关系未确立', unk: true },
    OTC: { name: '其他信托公司', m: 'non', agent: '1903 年后几乎都放弃了间接清算', group: true, src: ['SPR'] },
    BRK: { name: '布鲁克林第一国民银行', m: 'unk', agent: '纽约清算所会员身份：本课未核实', unk: true, src: ['OCC'] },
    BRT: { name: '两家已倒闭的布鲁克林信托公司', m: 'out', src: ['OCC'] },
    PPL: { name: '海因策 / 莫尔斯', m: 'out', person: true },
    BAR: { name: '巴尼', m: 'out', person: true },
    TRE: { name: '财政部', m: 'out' },
    JPM: { name: '摩根组织的救助', sub: '银行、实力较强的信托公司等多方出资', m: 'out' },
    EXC: { name: '交易所资金池', m: 'out' },
    SYN: { name: '信托公司联合体', m: 'out' },
    SPARE: { name: '会员银行余力', m: 'out', ghost: true }
  };
  // 图中每个节点框里显示的文字（名字可分行；sub 为小字）。KNI 随步骤变化，见 nodeLines。
  const SHOW = {
    CH: { sub: ['会员银行的私人协会'] },
    KNI: { sub: ['清算代理：国民商业银行', '经它间接清算'] },
    TCA: { sub: ['清算代理关系未确立'] },
    LIN: { sub: ['清算代理关系未确立'] },
    OTC: { sub: ['1903 年后几乎都', '放弃了间接清算'] },
    BRK: { name: ['布鲁克林', '第一国民银行'], sub: ['纽约清算所会员身份：', '本课未核实'] },
    BRT: { name: ['两家已倒闭的', '布鲁克林信托公司'] },
    JPM: { sub: ['银行、实力较强的信托', '公司等多方出资'] }
  };
  function nodeLines(id, step) {
    const n = NODES[id], s = SHOW[id] || {};
    let name = s.name || [n.name + (n.st === '◐' ? ' ◐' : '')], sub = s.sub || [];
    if (id === 'KNI') sub = step >= 7 ? ['清算代理已宣布终止', '（10-21）'] : step >= 6 ? ['清算代理：国民商业银行', '10-21 已宣布终止'] : sub;
    return { name, sub };
  }
  const NAME_W = 14.5, SUB_W = 11.6;
  const textW = s => [...s].reduce((a, c) => a + (/[ -]/.test(c) ? 0.56 : 1), 0);
  /** 节点框：宽度按最长一行估算（不同步骤用最长的那一种，避免框忽大忽小） */
  function boxOf(id, layout, step) {
    const n = NODES[id], [x, y] = POS[layout][id];
    const L = nodeLines(id, step);
    let wmax = 0; for (const st of [0, 6, 7]) { const l = nodeLines(id, st); wmax = Math.max(wmax, ...l.name.map(t => textW(t) * NAME_W), ...l.sub.map(t => textW(t) * SUB_W)); }
    const w = Math.max(n.person ? 76 : n.ghost ? 104 : 112, Math.ceil(wmax + 22));
    const h = n.ghost ? 30 : 14 + L.name.length * 17 + L.sub.length * 15 + (L.sub.length ? 4 : 0) + 6;
    const hMax = n.ghost ? 30 : 14 + L.name.length * 17 + Math.max(L.sub.length, id === 'KNI' ? 2 : 0) * 15 + ((L.sub.length || id === 'KNI') ? 4 : 0) + 6;
    return { x, y, w, h: hMax, lines: L };
  }
  function edgePt(b, tx, ty) {
    const dx = tx - b.x, dy = ty - b.y; if (!dx && !dy) return [b.x, b.y];
    const sx = (b.w / 2 + 3) / Math.abs(dx || 1e-9), sy = (b.h / 2 + 3) / Math.abs(dy || 1e-9), k = Math.min(sx, sy);
    return [b.x + dx * k, b.y + dy * k];
  }
  /** 连线几何：端点落在框边或圈上；同一对节点之间的多条线左右错开；可在 POS[layout].via 里给折点 */
  function edgeGeom(e, layout, B) {
    const P = POS[layout], ring = P.ring, via = (P.via && P.via[e.id]) || [];
    const ringPt = (ox, oy) => { const dx = ox - ring.x, dy = oy - ring.y, d = Math.hypot(dx, dy) || 1; return [ring.x + dx / d * (ring.r + 2), ring.y + dy / d * (ring.r + 2)]; };
    const fb = e.from === 'RING' ? null : B[e.from], tb = e.to === 'RING' ? null : B[e.to];
    const first = via.length ? via[0] : tb ? [tb.x, tb.y] : [ring.x, ring.y];
    const last = via.length ? via[via.length - 1] : fb ? [fb.x, fb.y] : [ring.x, ring.y];
    const a = fb ? edgePt(fb, first[0], first[1]) : ringPt(first[0], first[1]);
    const b = tb ? edgePt(tb, last[0], last[1]) : ringPt(last[0], last[1]);
    let pts = [a, ...via, b];
    // 平行错开
    const same = EDGES.filter(o => (o.from === e.from && o.to === e.to) || (o.from === e.to && o.to === e.from));
    if (same.length > 1 && !via.length) {
      const k = same.indexOf(e) - (same.length - 1) / 2, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const sign = e.from < e.to ? 1 : -1; // 与方向无关的统一法线
      const nx = -dy / d * sign, ny = dx / d * sign, off = 7 * k * (e.from < e.to ? 1 : -1) * sign;
      pts = pts.map(p => [p[0] + nx * off, p[1] + ny * off]);
    }
    return { pts };
  }
  /** 文字标签的位置（圈名、圈外说明、标记），供绘图与布局检查共用 */
  function labelBoxes(layout, B, step) {
    const P = POS[layout], ring = P.ring, out = [];
    const rl = P.ringLabel || [ring.x, ring.y + ring.r - 14];
    out.push({ t: '纽约清算所直接会员', x: rl[0], y: rl[1] - 4, w: 9 * 13.5, h: 16, own: null, kind: 'ring' });
    out.push({ t: '不是纽约清算所直接会员', x: P.zone[0], y: P.zone[1] - 4, w: 11 * 12.5, h: 16, own: null, kind: 'zone' });
    const used = {};
    MARKS.forEach(mk => {
      if (mk.s > step || (mk.until !== undefined && step >= mk.until)) return;
      // 每个机构只显示此刻最新的一个状态标记
      if (MARKS.some(o => o.node === mk.node && o.s > mk.s && o.s <= step && (o.until === undefined || step < o.until))) return;
      const b = B[mk.node], k = used[mk.node] = (used[mk.node] || 0) + 1;
      const w = textW(mk.text) * 12 + 16;
      const side = (P.markSide && P.markSide[mk.node]) || 'tr';
      const x = side === 'tl' ? b.x - b.w / 2 + w / 2 - 8 : b.x + b.w / 2 - w / 2 + 8;
      const y = b.y - b.h / 2 - 2 - (k - 1) * 22;
      out.push({ t: mk.text, x, y, w, h: 20, own: mk.node, kind: 'mark', s: mk.s });
    });
    return out;
  }
  // 清算代理线的文字：10-21 只标"已宣布"；10-22 起虚线，并注明实际停止时间未核实
  function edgeLabel(e, layout, step) {
    if (e.type !== 'agency') return null;
    if (e.end !== undefined && step >= e.end) return layout === 'narrow' ? ['已宣布终止', '（10-21）', '实际停止', '时间未核实'] : ['已宣布终止（10-21）', '实际停止时间未核实'];
    if (e.ann !== undefined && step >= e.ann) return layout === 'narrow' ? ['清算代理', '10-21', '已宣布终止'] : ['清算代理', '10-21 已宣布终止'];
    return ['清算代理'];
  }
  // 连线文字的占位框（字号 11；第 i 行基线在 y + 14i）
  function edgeLabelBoxes(layout, step) {
    const P = POS[layout], out = [];
    EDGES.forEach(e => {
      if (e.s > step) return;
      const lab = edgeLabel(e, layout, step), at = P.elab && P.elab[e.id];
      if (!lab || !at) return;
      const [lx, ly, anc] = at, w = Math.max(...lab.map(t => textW(t) * 11)) + 4;
      const x0 = anc === 'end' ? lx - w : anc === 'start' ? lx : lx - w / 2, top = ly - 11, h = 14 * (lab.length - 1) + 15;
      out.push({ t: lab.join(''), x: x0 + w / 2, y: top + h / 2, w, h, own: null, kind: 'edge', edge: e.id });
    });
    return out;
  }
  // 坐标：桌面（宽）与手机（窄）两套
  const POS = {
    wide: { w: 700, h: 700, ring: { x: 200, y: 345, r: 165 }, zone: [470, 132],
      CH: [200, 232], MER: [125, 300], NBC: [278, 330], NCB: [122, 390], FNB: [266, 404], OMB: [172, 455],
      KNI: [470, 190], TCA: [470, 282], LIN: [470, 380], OTC: [470, 475], BRK: [470, 590],
      PPL: [80, 110], BAR: [640, 180], JPM: [625, 320], SYN: [625, 425], BRT: [625, 660],
      TRE: [80, 640], EXC: [250, 640], SPARE: [330, 555], via: {}, vy: 70,
      elab: { ag1: [388, 190, 'end'], ag2: [548, 612, 'start'] } },
    narrow: { w: 380, h: 990, ring: { x: 190, y: 300, r: 165 }, zone: [282, 500],
      CH: [190, 185], NCB: [112, 262], MER: [270, 262], NBC: [112, 335], FNB: [268, 335], OMB: [232, 405],
      KNI: [96, 545], TCA: [290, 545], JPM: [96, 650], BAR: [230, 640], LIN: [96, 745], SYN: [290, 745],
      OTC: [290, 845], BRK: [96, 855], BRT: [290, 950],
      TRE: [90, 40], PPL: [290, 40], EXC: [190, 95], SPARE: [322, 466],
      via: { i1: [[10, 300], [10, 650]] },
      elab: { ag1: [90, 456, 'end'], ag2: [100, 916, 'start'] } }
  };
  // 连线：type = agency（清算代理）| aid（直接援助）| aidi（间接援助）| person（人事关联）| loan（信贷）
  // from/to 节点；s = 从第几步出现；end = 第几步起显示为"已宣布终止"
  const EDGES = [
    { id: 'p1', type: 'person', from: 'PPL', to: 'MER', s: 0, src: ['TM90'], tip: '海因策任商业国民银行行长；莫尔斯与之关系密切' },
    { id: 'p2', type: 'person', from: 'BAR', to: 'KNI', s: 0, src: ['FRH'], tip: '巴尼任尼克博克总裁' },
    { id: 'p3', type: 'person', from: 'BAR', to: 'TCA', s: 0, src: ['TM90'], tip: '巴尼也是美国信托公司的董事' },
    { id: 'ag1', type: 'agency', from: 'KNI', to: 'NBC', s: 0, ann: 6, end: 7, src: ['SPR', 'FRH'], tip: '尼克博克经国民商业银行间接清算' },
    { id: 'ag2', type: 'agency', from: 'BRT', to: 'BRK', s: 0, src: ['OCC'], tip: '布鲁克林第一国民银行是这两家信托公司的清算代理' },
    { id: 'c1', type: 'aid', from: 'NBC', to: 'KNI', s: 4, src: ['FRH'], tip: '10-18：国民商业银行为尼克博克提供信贷，应付提款' },
    { id: 'a1', type: 'aid', from: 'CH', to: 'MER', s: 3, src: ['TM90', 'FHZ'], tip: '10-17 起：清算所支持商业国民银行；10-20 设立援助基金' },
    { id: 'a2', type: 'aid', from: 'JPM', to: 'TCA', s: 8, src: ['TM90'], tip: '10-23：摩根组织的救助，为美国信托公司调集约 300 万美元' },
    { id: 'a3', type: 'aid', from: 'TRE', to: 'RING', s: 9, src: ['TM90'], tip: '10-24：财政部存款，直接只能进入国民银行' },
    { id: 'a4', type: 'aid', from: 'RING', to: 'EXC', s: 9, src: ['TM90'], tip: '10-24、10-25：银行出资的交易所资金池' },
    { id: 'i1', type: 'aidi', from: 'RING', to: 'JPM', s: 9, src: ['FHZ', 'TM90'], tip: '间接：摩根组织的救助「部分由财政部资金支持」（FHZ）' },
    { id: 'i2', type: 'aidi', from: 'OMB', to: 'SPARE', s: 11, src: ['T-CHLC'], tip: '间接：凭证腾出的现金增强了会员银行支援他人的余力；不画具体去向' },
    { id: 'a5', type: 'aid', from: 'SYN', to: 'TCA', s: 12, src: ['TM90', 'SPR'], tip: '11 月初：信托公司联合体' },
    { id: 'a6', type: 'aid', from: 'SYN', to: 'LIN', s: 12, src: ['TM90', 'SPR'], tip: '11 月初：信托公司联合体' },
    { id: 'i3', type: 'aidi', from: 'OTC', to: 'SYN', s: 12, src: ['TM90'], tip: '间接：实力较强的信托公司出资组成联合体' }
  ];
  // 节点上的事件标记：在第 s 步出现
  const MARKS = [
    { node: 'MER', s: 2, text: '挤兑' },
    { node: 'MER', s: 6, text: '挤兑停止' },
    { node: 'KNI', s: 4, text: '提款' },
    { node: 'KNI', s: 6, text: '✕ 清算所拒绝援助', until: 7 },
    { node: 'KNI', s: 7, text: '暂停营业' },
    { node: 'TCA', s: 8, text: '挤兑' },
    { node: 'LIN', s: 9, text: '挤兑' },
    { node: 'BRK', s: 10, text: '关门' },
    { node: 'CH', s: 11, text: '贷款凭证 · 只发给会员' }
  ];
  const GSTEPS = [
    { label: '关系总览', what: '圈只表示一件事：是不是纽约清算所的直接会员。', why: '会员才能直接交换支票，危机时才有资格得到会员之间的集体援助。', learn: '圈外的信托公司普遍不是直接会员；有没有清算代理，是另一件事，单独标注。' },
    { label: '10-14', what: '人事关联：投机者与商业国民银行。', why: '海因策在 1907 年 2 月当上了它的行长。', learn: '点线只表示人事关系，不表示资金往来。' },
    { label: '10-16', what: '商业国民银行出现挤兑。', why: '存款人担心投机者挪用了存款。', learn: '第一波冲击落在圈内。' },
    { label: '10-17', what: '清算所支持商业国民银行。', why: '它掌握会员的账，能很快判断。', learn: '紫色实线箭头 = 直接援助。' },
    { label: '10-18', what: '国民商业银行为尼克博克提供信贷。', why: '尼克博克开始出现提款。', learn: '代理银行也可以是援助者。' },
    { label: '10-19～20', what: '清算所对涉事会员银行开出条件、设立基金。', why: '把投机者逐出会员银行。', learn: '保护圈对圈内有效。' },
    { label: '10-21', what: '国民商业银行宣布不再担任尼克博克的清算代理；当晚清算所拒绝援助。', why: '资源要留给会员。', learn: '这一步只标「已宣布终止」。代理线仍画实线，不画切断时刻。' },
    { label: '10-22', what: '尼克博克暂停营业。代理线改为灰色虚线，标「已宣布终止（10-21）· 实际停止时间未核实」。', why: '三小时付出约 800 万美元后，中午刚过停业。', learn: '「宣布」与「停业」是两件事，图中不连成因果箭头。虚线只表示「已宣布」，不表示代理服务在哪一刻真正停止。' },
    { label: '10-23', what: '挤兑转到美国信托公司；摩根组织的救助直接送到它手里。', why: '斯特朗查账后认为它基本健康。', learn: '美国信托公司的清算代理关系未确立：灰色标签不等于「没有」。' },
    { label: '10-24', what: '财政部存款进入国民银行；银行出资的交易所资金池；林肯信托被挤兑。', why: '法律只允许财政部把钱存进国民银行。', learn: '虚线箭头 = 间接：部分财政部资金经国民银行进入摩根组织的救助。' },
    { label: '10-25', what: '布鲁克林第一国民银行关门。', why: '它是两家已倒闭信托公司的清算代理。', learn: '它是否为纽约清算所会员，本课没有核实，所以单独放在图边。' },
    { label: '10-26', what: '贷款凭证只出现在圈内。', why: '凭证只发给会员。', learn: '凭证腾出的现金可能间接支持圈外机构，图中只画指向「会员银行余力」的虚线。' },
    { label: '11 月初', what: '信托公司联合体支持美国信托公司和林肯信托。', why: '实力较强的信托公司出资互助。', learn: '直接救助被挤兑信托公司的主要渠道，是摩根组织的、多方出资的救助。' }
  ];

  root.S0903History = { LANES, CATS, T, STEPS, RATES, DEPOSITS, NODES, POS, EDGES, MARKS, GSTEPS, nodeLines, boxOf, edgeGeom, labelBoxes, edgeLabel, edgeLabelBoxes };
  if (typeof module === 'object' && module.exports) module.exports = root.S0903History;
}(typeof self !== 'undefined' ? self : this));
