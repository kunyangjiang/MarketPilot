// S03-06 数值核验：node "lessons/S03-06/S03-06 数值核验.js"
// 读取《S03-06 课文 v1 候选.md》与《S03-06 图与交互方案 v1 候选.md》，对每个关键数字既重算、又断言它出现在文件里。
// 不依赖网络或临时目录。真实数据（CFTC 报告、EIA 数据表与文章）按来源登记中的读数抄录于此。
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const lesson = fs.readFileSync(path.join(dir, 'S03-06 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const figs = fs.readFileSync(path.join(dir, 'S03-06 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');

let pass = 0, fail = 0;
function ok(id, desc, cond) { if (cond) pass++; else { fail++; console.log('失败 ' + id + '：' + desc); } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.005 : tol);
const inL = s => lesson.includes(s);
const inF = s => figs.includes(s);
function num(id, desc, value, expected, tol, strs, where) {
  ok(id, desc + ' 重算 ' + value + ' ≈ ' + expected, near(value, expected, tol));
  for (const s of strs || []) ok(id, desc + ' 出现「' + s + '」于' + (where === 'F' ? '图方案' : where === 'LF' ? '课文与图方案' : '课文'),
    where === 'F' ? inF(s) : where === 'LF' ? (inL(s) && inF(s)) : inL(s));
}
const usd = x => (x < 0 ? '−' : '') + '$' + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 });

// A 农户套保（课文第 3–4 节；图 1；小题 1）
const Q = 10000, F0 = 6.00, basis = -0.20;
const scen = { 跌: { fut: 5.00, cash: 4.80 }, 涨: { fut: 7.00, cash: 6.80 } };
for (const [k, s] of Object.entries(scen)) {
  const sale = Q * s.cash, futPL = Q * (F0 - s.fut), tot = sale + futPL;
  num('A-' + k, '情景「' + k + '」卖粮收入', sale, k === '跌' ? 48000 : 68000, 1e-9, [usd(sale)], 'LF');
  num('A-' + k, '情景「' + k + '」期货盈亏', futPL, k === '跌' ? 10000 : -10000, 1e-9, [], 'L');
  num('A-' + k, '情景「' + k + '」合计', tot, 58000, 1e-9, ['$58,000'], 'LF');
  num('A-' + k, '情景「' + k + '」本地价 = 期货 + 基差', s.cash, s.fut + basis, 1e-9, [usd(s.fut), usd(s.cash)], 'LF');
}
ok('A1', '期货盈亏 ±$10,000 出现于课文与图方案', inL('$10,000') && inF('+$10,000') && inF('−$10,000'));
num('A2', '锁定价 = 期货价 + 基差', F0 + basis, 5.80, 1e-9, ['$5.80', '$6.00', '−$0.20'], 'LF');
num('A3', '不套保：涨了每蒲式耳', 6.80, scen.涨.cash, 1e-9, ['$6.80'], 'F');
const cashB = scen.跌.fut - 0.35;
num('A4', '基差 −$0.35 时本地价', cashB, 4.65, 1e-9, ['$0.35', '$4.65']);
num('A5', '基差 −$0.35 时合计每蒲式耳', cashB + (F0 - scen.跌.fut), 5.65, 1e-9, ['$5.65', '$1.00']);
num('A6', '比预想少', 5.80 - 5.65, 0.15, 1e-9, ['$0.15']);
num('A7', '期货价在两个秋天之间相差', scen.涨.fut - scen.跌.fut, 2.00, 1e-9, ['$2.00']);
num('A8', '小题 1：$5.30 + ($6.00 − $5.50)', 5.30 + (F0 - 5.50), 5.80, 1e-9, ['$5.50', '$5.30', '$0.50']);
num('A9', '小题 1 的基差仍是 −$0.20', 5.30 - 5.50, -0.20, 1e-9, ['$0.20']);
num('A10', '基差例：$4.80 − $5.00', 4.80 - 5.00, -0.20, 1e-9, ['$4.80 − $5.00 = −$0.20']);

// B 逐日盯市（课文第 5 节；图 2；小题 3）
const size = 1000, IM = 6000, MM = 5000, P0 = 60.00;
const settle = [61.20, 59.80, 58.50, 59.10, 57.90];
let bal = IM, prev = P0, deposit = IM, vmSum = 0;
const expect = [
  { vm: 1200, bal: 7200 }, { vm: -1400, bal: 5800 }, { vm: -1300, bal: 4500, call: 1500 }, { vm: 600, bal: 6600 }, { vm: -1200, bal: 5400 },
];
settle.forEach((p, i) => {
  const vm = Math.round((p - prev) * size * 100) / 100;
  bal += vm; vmSum += vm;
  num('B' + (i + 1), '第 ' + (i + 1) + ' 天变动保证金', vm, expect[i].vm, 1e-6, [usd(p)], 'LF');
  num('B' + (i + 1), '第 ' + (i + 1) + ' 天余额（补钱前）', bal, expect[i].bal, 1e-6, [usd(expect[i].bal)], 'LF');
  ok('B' + (i + 1), '第 ' + (i + 1) + ' 天变动保证金写法出现于课文表', inL((vm > 0 ? '+' : '−') + '$' + Math.abs(vm).toLocaleString('en-US')));
  if (bal < MM) { const call = IM - bal; num('B' + (i + 1), '追加保证金', call, expect[i].call, 1e-6, ['$1,500'], 'LF'); bal = IM; deposit += call; }
  else ok('B' + (i + 1), '未触发追缴时不应有补钱', !expect[i].call);
  prev = p;
});
num('B6', '五天变动保证金合计', vmSum, -2100, 1e-6, ['−$2,100'], 'LF');
num('B7', '合计 = 价格变化 × 1,000', (settle[4] - P0) * size, -2100, 1e-6, ['$2.10', '$57.90']);
num('B8', '一共放进', deposit, 7500, 1e-9, ['$7,500'], 'LF');
num('B9', '放进 − 剩下 = 亏损', deposit - bal, 2100, 1e-6, ['$5,400', '$2,100'], 'LF');
num('B10', '合约价值', P0 * size, 60000, 1e-9, ['$60,000', '1,000 桶']);
num('B11', '保证金占合约价值', IM / (P0 * size) * 100, 10, 1e-9, ['10%']);
num('B12', '价格变动 1% 相当于押金变动', P0 * size * 0.01 / IM * 100, 10, 1e-9, ['1%']);
ok('B13', '初始 / 维持保证金出现于课文与图方案', inL('$6,000') && inL('$5,000') && inF('$6,000') && inF('$5,000'));
// 小题 3
const vm6 = Math.round((57.40 - settle[4]) * size * 100) / 100, bal6 = bal + vm6;
num('B14', '小题 3：第 6 天变动保证金', vm6, -500, 1e-6, ['$57.40', '−$500'], 'L');
num('B15', '小题 3：余额', bal6, 4900, 1e-6, ['$4,900'], 'LF');
num('B16', '小题 3：补回初始', IM - bal6, 1100, 1e-6, ['$1,100'], 'LF');
num('B17', '小题 3：每桶跌', settle[4] - 57.40, 0.50, 1e-9, ['$0.50']);

// C 收敛（课文第 6 节；图 3）
const conv = [[58.00, 59.20, -1.20], [57.40, 58.00, -0.60], [59.30, 59.50, -0.20], [58.80, 58.80, 0]];
conv.forEach(([s, f, b], i) => num('C' + (i + 1), '基差 ' + (i + 1), s - f, b, 1e-9, [usd(s), usd(f), b === 0 ? '$0' : usd(b)], 'LF'));
ok('C5', '基差逐步收窄', conv.every((r, i) => i === 0 || Math.abs(r[2]) < Math.abs(conv[i - 1][2])));
num('C6', '套利：$59.50 − $58.80', 59.50 - 58.80, 0.70, 1e-9, ['$59.50', '$58.80', '$0.70']);
num('C7', '套利：一份合约', (59.50 - 58.80) * size, 700, 1e-6, ['$700']);

// D 持有成本（课文第 7 节）
const S = 4000, r = 0.04, t = 3 / 12, storeYr = 20;
num('D1', '三个月利息', S * r * t, 40, 1e-9, ['$4,000 × 4% × 3/12 = $40']);
num('D2', '三个月保管', storeYr * t, 5, 1e-9, ['$20', '$5']);
num('D3', '期货约等于', S + S * r * t + storeYr * t, 4045, 1e-9, ['$4,000 + $40 + $5 = $4,045']);
num('D4', '上一课换月价差', 60.30 - 60, 0.30, 1e-9, ['$0.30']);

// E 2020 年 4 月（CFTC 报告；EIA RCLC1/RCLC2/RWTC；EIA 文章；EIA 周度库存）
const may20 = -37.63, low = -40.32, jun20 = 20.43, spot20 = -36.98, may21 = 10.01, may17 = 18.27, jun17 = 25.03, open = 17.73;
const cftcSpread20 = -58.06, cftcSpread17 = -6.76;
ok('E1', '结算价、盘中低点、6 月、现货、到期价出现于课文',
  [may20, low, jun20, spot20, may21, open].every(x => inL(usd(x))));
ok('E2', '图方案只写两个结算价', inF('−$37.63') && inF('$20.43'));
num('E3', '6 月 = 5 月 − CFTC 价差（两类来源交叉）', may20 - cftcSpread20, jun20, 1e-9, ['−$58.06']);
num('E4', '4 月 17 日价差（EIA 两个月份相减 = CFTC）', may17 - jun17, cftcSpread17, 1e-9, ['−$6.76', '$18.27']);
num('E5', '现货评估价与结算价之差', spot20 - may20, 0.65, 1e-9, ['$0.65']);
num('E6', '一天变动保证金（每桶）', may20 - may17, -55.90, 1e-9, ['（−$37.63 − $18.27）']);
num('E7', '一天变动保证金（每份）', (may20 - may17) * size, -55900, 1e-6, ['−$55,900']);
num('E8', '前一日合约价值', may17 * size, 18270, 1e-6, ['$18,270']);
num('E9', '当天从开盘到盘中低点（CFTC 写 $58.05）', open - low, 58.05, 1e-9);
const cush = { '03/13': 38445, '04/17': 59741 };
num('E10', '库欣 3 月 13 日那周（万桶）', cush['03/13'] / 10, 3844.5, 1e-9, ['3,845 万桶']);
num('E11', '库欣 4 月 17 日那周（万桶）', cush['04/17'] / 10, 5974.1, 1e-9, ['5,974 万桶'], 'LF');
num('E12', '罐区约 76%（EIA 文章口径：5,800 ÷ 7,600）', 58 / 76 * 100, 76.3, 0.05, ['76%'], 'LF');
num('E13', '6,000 − 200 = 5,800 万桶', 6000 - 200, 5800, 0, ['6,000 万桶', '200 万桶', '5,800 万桶']);
num('E14', '库容表 2020-03 与「约 7,600 万桶」', 76342 / 10, 7600, 40, ['7,600 万桶'], 'LF');
num('E15', '直接相除得 78.3%（口径不同，不进课文）', cush['04/17'] / 76342 * 100, 78.3, 0.05);
ok('E16', '图方案库存表包含 4 月 17 日与 3 月 13 日读数', inF('59,741') && inF('38,445') && inF('76,342'));
// 最后交易日：交割月前一月 25 日之前第 3 个营业日；25 日非营业日则第 4 个（CFTC 报告注 37）
const d25 = new Date(Date.UTC(2020, 3, 25)); const wk = d => d.getUTCDay() % 6 !== 0;
let n = wk(d25) ? 3 : 4, d = new Date(d25);
while (n > 0) { d.setUTCDate(d.getUTCDate() - 1); if (wk(d)) n--; }
ok('E17', '最后交易日推算为 2020-04-21（' + d.toISOString().slice(0, 10) + '）', d.toISOString().slice(0, 10) === '2020-04-21' && inL('4 月 21 日'));
ok('E18', '1983、2 点 08 分、2 点 29 分、2 点 30 分出现于课文', inL('1983') && inL('2 点 08 分') && inL('2 点 29 分') && inL('2 点 30 分'));
ok('E19', '约 1% 进入实物交割出现于课文', inL('约 1%'));

// F 中国对照
ok('F1', 'INE 合约条款：1,000 桶、±4%、5%', inL('每手 1,000 桶') && inL('±4%') && inL('合约价值的 5%'));
ok('F2', '原油宝罚款 5,050 万元', inL('5,050 万元'));
ok('F3', '期货和衍生品法施行日', inL('2022 年 8 月 1 日'));

console.log('通过 ' + pass + '，失败 ' + fail);
if (fail) process.exit(1);
