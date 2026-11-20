// S07-04 数值核验：重算课文与图方案里的每个关键数字，并断言它们确实出现在文件里。
// 运行：node "S07-04 数值核验.js"（任意目录均可）。不依赖网络，不依赖临时目录。
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r/g, '');
const lesson = read('S07-04 课文 v1 候选.md');
const figs = read('S07-04 图与交互方案 v1 候选.md');

let pass = 0, fail = 0;
function ok(name, cond, note) {
  if (cond) pass++; else { fail++; console.log('失败：' + name + (note ? '（' + note + '）' : '')); }
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const inL = s => ok('课文含「' + s + '」', lesson.includes(s));
const inF = s => ok('图方案含「' + s + '」', figs.includes(s));
const usd = (x, d = 2) => '$' + x.toFixed(d);
const sh = n => Math.abs(n).toLocaleString('en-US');

// ---------- 一、模型（全部为本课假设） ----------
const LAMBDA = 0.10 / 1000;   // 净买入每 1,000 股，价格 +$0.10
const V = 50, P0 = 52;        // 估值；第 0 天冲击后的价格
const SHOCK = 20000;          // 第 0 天的买单
ok('冲击：20,000 股 × $0.10/千股 = $2', near(SHOCK * LAMBDA, 2) && near(50 + SHOCK * LAMBDA, P0));

// 每天：价值型按前一天收盘价与估值的差距交易，趋势型按前一天的涨跌交易；
// capV：价值型最多可卖的股数（不卖空）；capT：趋势型最多持有的股数。
function run({ a = 0, b = 0, capV = null, capT = null, days }) {
  const P = [50, P0]; let soldV = 0, holdT = 0; const rows = [];
  for (let t = 1; t <= days; t++) {
    const p = P[P.length - 1], prev = P[P.length - 2];
    let v = -a * (p - V);
    if (capV != null && v < 0) v = -Math.min(-v, capV - soldV);
    let tr = b * (p - prev);
    if (capT != null) tr = Math.max(-holdT, Math.min(capT - holdT, tr));
    soldV += v < 0 ? -v : 0; holdT += tr;
    const np = p + LAMBDA * (v + tr);
    P.push(np); rows.push({ t, v, tr, p: np });
  }
  return rows;
}
const closes = rows => rows.map(r => r.p);
const eqArr = (x, y) => x.length === y.length && x.every((u, i) => near(u, y[i]));

// ---------- 二、负反馈：价值型，每 $1 差距 5,000 股 ----------
const neg = run({ a: 5000, days: 4 });
ok('负反馈收盘 51, 50.5, 50.25, 50.125', eqArr(closes(neg), [51, 50.5, 50.25, 50.125]), closes(neg).join(','));
ok('负反馈卖出 10,000 / 5,000 / 2,500 / 1,250', eqArr(neg.map(r => -r.v), [10000, 5000, 2500, 1250]));
const negSum = neg.reduce((s, r) => s - r.v, 0);
ok('四天合计卖出 18,750，差 1,250', near(negSum, 18750) && near(SHOCK - negSum, 1250));
const gNeg = LAMBDA * -5000; ok('负反馈增益 −0.5', near(gNeg, -0.5));
const negLong = run({ a: 5000, days: 60 });
ok('长期：价格回到 $50，合计卖出 20,000', near(negLong[59].p, 50, 1e-6) && near(negLong.reduce((s, r) => s - r.v, 0), 20000, 1e-3));
ok('开场：第四天约 $50.13', usd(neg[3].p) === '$50.13');
// 卖出上限 12,000
const negCap = run({ a: 5000, capV: 12000, days: 5 });
ok('上限 12,000：第 2 天卖 2,000，停在 $50.80', near(-negCap[1].v, 2000) && near(negCap[1].p, 50.8) && near(negCap[4].p, 50.8));
// 小题 1：每 $1 差距 15,000 股
const over = run({ a: 15000, days: 4 });
ok('小题 1：收盘 49, 50.5, 49.75, 50.125', eqArr(closes(over), [49, 50.5, 49.75, 50.125]), closes(over).join(','));
ok('小题 1：第 1 天卖 30,000，第 2 天买 15,000', near(-over[0].v, 30000) && near(over[1].v, 15000));
ok('小题 1：增益 −1.5，偏离每次减半', near(LAMBDA * -15000, -1.5) && near((over[0].p - V) / (P0 - V), -0.5));

for (const s of ['因为自己的原因买进 20,000 股', '把价格调高到 $52', '$51、$50.50、$50.25，第四天收在约 $50.13', '$53、$53.50、$53.75，第四天收在约 $53.88',
  '每 1,000 股，价格上调 $0.10', '价格每高于估值 $1，当天卖出 5,000 股', '③ 卖出 2 × 5,000 = 10,000 股', '价格下调 $1.00，收在 $51',
  '只卖 5,000 股，价格下调 $0.50，到 $50.50', '第 3 天卖 2,500 股，到 $50.25', '第 4 天卖 1,250 股，到 $50.125', '循环增益是 −0.5',
  '一共卖出 18,750 股', '正好是 20,000 股', '一共只有 12,000 股可卖', '只剩 2,000 股，价格停在 $50.80', '差距还有 $0.80',
  '当天卖出 15,000 股', '卖出 30,000 股，价格下调 $3，收在 $49', '买进 15,000 股，价格上调 $1.50，收在 $50.50', '循环增益是 −1.5',
  '$52、$49、$50.50、$49.75、$50.125']) inL(s);
for (const s of ['卖 10,000 股、收 $51.00', '卖 5,000 股、收 $50.50', '卖 2,500 股、收 $50.25', '卖 1,250 股、收 $50.125', '合计卖出 18,750 股', '还差 1,250 股', '他们最多只能卖 12,000 股', '只卖 2,000 股', '$50.80']) { inL(s); inF(s); }

// ---------- 三、正反馈：趋势型 ----------
const pos = run({ b: 5000, days: 4 });
ok('正反馈收盘 53, 53.5, 53.75, 53.875', eqArr(closes(pos), [53, 53.5, 53.75, 53.875]));
ok('正反馈买入 10,000 / 5,000 / 2,500 / 1,250', eqArr(pos.map(r => r.tr), [10000, 5000, 2500, 1250]));
ok('开场：第四天约 $53.88', usd(pos[3].p) === '$53.88');
const gPos = LAMBDA * 5000; ok('正反馈增益 +0.5', near(gPos, 0.5));
ok('总变动 2/(1−0.5) = $4，终点 $54', near(2 / (1 - gPos), 4) && near(run({ b: 5000, days: 80 })[79].p, 54, 1e-6));
const run15 = run({ b: 15000, days: 3 });
ok('增益 1.5 无上限：55, 59.5, 66.25；第 3 天买 67,500', eqArr(closes(run15), [55, 59.5, 66.25]) && near(run15[2].tr, 67500) && near(LAMBDA * 15000, 1.5));
const cap90 = run({ b: 15000, capT: 90000, days: 5 });
ok('上限 90,000：30,000 / 45,000 / 15,000 / 0', eqArr(cap90.map(r => r.tr), [30000, 45000, 15000, 0, 0]));
ok('上限 90,000：55, 59.5, 61, 61', eqArr(closes(cap90).slice(0, 4), [55, 59.5, 61, 61]));
ok('$61 比估值高 $11', near(cap90[2].p - V, 11));
const cap60 = run({ b: 15000, capT: 60000, days: 4 });
ok('小题 2：上限 60,000：30,000 / 30,000 / 0，停在 $58', eqArr(cap60.map(r => r.tr), [30000, 30000, 0, 0]) && near(cap60[3].p, 58));

for (const s of ['前一天每涨 $1，当天买进 5,000 股', '③ 买进 2 × 5,000 = 10,000 股', '价格上调 $1.00，收在 $53', '买 5,000 股，到 $53.50',
  '第 3 天买 2,500 股，到 $53.75', '第 4 天买 1,250 股，到 $53.875', '循环增益是 +0.5', '价格最后会走到 $54', '$2 + $1 + $0.50 + … = $4',
  '当天买进 15,000 股', '增益变成 +1.5', '第 1 天买 30,000 股，价格涨 $3，到 $55', '第 2 天买 45,000 股，涨 $4.50，到 $59.50',
  '第 3 天要买 67,500 股，涨 $6.75', '最多只能持有 90,000 股', '前两天已经买了 75,000 股，第 3 天只能再买 15,000 股，价格涨 $1.50，到 $61',
  '价格停在 $61', '$61 比估值高出 $11', '最多只能持有 60,000 股', '答案：** $58', '离上限只剩 30,000 股，只能买 30,000 股，涨 $3，到 $58']) inL(s);
for (const s of ['买 10,000 股、收 $53.00', '买 5,000 股、收 $53.50', '买 2,500 股、收 $53.75', '买 1,250 股、收 $53.875',
  '买 30,000 股、收 $55.00', '买 45,000 股、收 $59.50', '本该买 67,500 股，只能买 15,000 股、收 $61.00', '买 0 股、收 $61.00']) { inL(s); inF(s); }

// ---------- 四、两种循环同时在场 ----------
const both = run({ a: 5000, b: 5000, days: 8 });
const expV = [-10000, -10000, -5000, 0, 2500, 2500, 1250, 0], expT = [10000, 0, -5000, -5000, -2500, 0, 1250, 1250];
const expP = [52, 51, 50, 49.5, 49.5, 49.75, 50, 50.125];
ok('同时在场：价值型逐日', eqArr(both.map(r => r.v + 0), expV), both.map(r => r.v).join(','));
ok('同时在场：趋势型逐日', eqArr(both.map(r => r.tr + 0), expT), both.map(r => r.tr).join(','));
ok('同时在场：收盘', eqArr(closes(both), expP), closes(both).join(','));
// 摆动的峰值偏离：+2、−0.5、+0.125，每次缩小到四分之一
const devs = [P0, ...closes(run({ a: 5000, b: 5000, days: 40 }))].map(p => p - V);
const peaks = []; for (let i = 1; i < devs.length - 1; i++) if (Math.abs(devs[i]) > 1e-12 && Math.abs(devs[i]) >= Math.abs(devs[i - 1]) && Math.abs(devs[i]) >= Math.abs(devs[i + 1]) && (!peaks.length || Math.sign(peaks[peaks.length - 1]) !== Math.sign(devs[i]))) peaks.push(devs[i]);
ok('峰值偏离 +2（起点）、−0.5、+0.125、−0.03125', near(peaks[0], 2) && near(peaks[1], -0.5) && near(peaks[2], 0.125) && near(peaks[3], -0.03125), peaks.slice(0, 3).join(','));
// 研究简报中的边界检查（不进课文）：趋势型增益大于 1 时摆动放大
const unstable = [P0, ...closes(run({ a: 5000, b: 12000, days: 40 }))].map(p => Math.abs(p - V));
ok('边界：趋势型增益 1.2 时 40 天后的偏离大于起点', Math.max(...unstable.slice(30)) > 2);

for (const s of ['卖 10,000 股；趋势型看到前一天涨了 $2，买 10,000 股', '还是 $52', '价格降到 $51', '价值型卖 5,000 股；趋势型看到前一天跌了 $1，也卖 5,000 股。价格降到 $50',
  '接着卖 5,000 股。价格跌到 $49.50', '第 8 天到 $50.125', '从高出 $2，到低了 $0.50，再到高出 $0.125', '缩小到上一次的四分之一', '趋势型的循环增益只有 0.5']) inL(s);
for (const s of ['第 1 天 −10,000 / +10,000，合计 0，收 $52.00', '第 2 天 −10,000 / 0，收 $51.00', '第 3 天 −5,000 / −5,000，收 $50.00', '第 4 天 0 / −5,000，收 $49.50',
  '第 5 天 +2,500 / −2,500，合计 0，收 $49.50', '第 6 天 +2,500 / 0，收 $49.75', '第 7 天 +1,250 / +1,250，收 $50.00', '第 8 天 0 / +1,250，收 $50.125', '摆幅从 $2 缩到 $0.125']) { inL(s); inF(s); }

// ---------- 五、再平衡 ----------
const W = 100000, ws = 0.6;
const up = W * ws * 1.1, totUp = up + W * (1 - ws), shareUp = up / totUp, sellUp = up - ws * totUp;
ok('股票涨 10%：$66,000，总 $106,000，占比约 62.3%，卖 $2,400', near(up, 66000) && near(totUp, 106000) && (shareUp * 100).toFixed(1) === '62.3' && near(sellUp, 2400) && near(ws * totUp, 63600));
const dn = W * ws * 0.9, totDn = dn + W * (1 - ws), buyDn = ws * totDn - dn;
ok('股票跌 10%：买 $2,400', near(buyDn, 2400));
for (const s of ['$100,000 的 60%', '股票变成 $66,000，总资产 $106,000，股票占比升到约 62.3%', '股票应当是 $63,600，于是卖出 $2,400', '反过来买进 $2,400']) inL(s);

// ---------- 六、回指 S02-05 的假设账户（重算以防引错） ----------
const sharesMargin = 400, debt = 10000, pDown = 30, mm = 0.25;
const equity = sharesMargin * pDown - debt, req = mm * sharesMargin * pDown, gap = req - equity;
const sellShares = Math.ceil(gap / mm / pDown);
ok('S02-05：$30 时差 $1,000，强制卖出 134 股', near(gap, 1000) && sellShares === 134);
const after = { s: sharesMargin - sellShares }; after.debt = debt - sellShares * pDown; after.eq = after.s * pDown - after.debt;
ok('S02-05：卖完后权益 ≥ 维持要求', after.eq >= mm * after.s * pDown);
for (const s of ['融资买进 400 股，股价跌到 $30', '强制卖出约 134 股']) inL(s);

// ---------- 七、小题 3、4 的价格条件 ----------
ok('小题 3：$53 > 买入止损价 $52.50，高于估值 $50', 53 > 52.5 && 53 > 50);
for (const s of ['从 $50 涨到 $53', '在 $52.50 挂了一张买入止损单', '估值 $50', '在 $48、$47、$46 各挂了一批卖出止损单', '价格停在 $47.50']) inL(s);
ok('小题 4：$47.50 在 $48 之下、$47 之上', 47.5 < 48 && 47.5 > 47);

// ---------- 八、制度数字（来源：Investor.gov，S0704-R02；只断言出现，不重算） ----------
for (const s of ['7% 和 13%', '下午 3:25 之前', '暂停交易 15 分钟', '20%，当天余下的时间', '15 秒内', '暂停交易 5 分钟', '1996 到 1998 年', '2002 年']) inL(s);

console.log('通过 ' + pass + '，失败 ' + fail);
if (fail) process.exit(1);
