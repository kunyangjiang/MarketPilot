// S04-01 数值核验（生产阶段）：node "lessons/S04-01/S04-01 数值核验.js"
// 读取《S04-01 课文 v1 候选.md》与《S04-01 图与交互方案 v1 候选.md》，
// 对课文与图中出现的每个关键数字：先独立重算，再断言它确实以课文里的写法出现。
// 不依赖网络与临时目录。英国国债的面值金额、日期与美国联邦法规例题的参数以常量写在下面，出处见《S04-01 核验记录》。
'use strict';
const fs = require('fs');
const path = require('path');

const LESSON = fs.readFileSync(path.join(__dirname, 'S04-01 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const FIG = fs.readFileSync(path.join(__dirname, 'S04-01 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');

let pass = 0, fail = 0;
function ok(id, cond, msg) { if (cond) pass++; else { fail++; console.log('失败 ' + id + '：' + (msg || '')); } }
const fmt = (x, dp) => x.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
// got 四舍五入到 dp 位应等于 want；want 的写法（默认带千分位）须出现在课文 / 图方案里
function num(id, got, want, dp, o = {}) {
  const r = Number(got.toFixed(dp));
  ok(id + ' 重算', Math.abs(r - want) < 1e-9, `重算 ${got} → ${r}，应为 ${want}`);
  const s = o.text || fmt(want, dp);
  if (o.lesson !== false) ok(id + ' 课文出现', LESSON.includes(s), `课文里没有「${s}」`);
  if (o.fig) ok(id + ' 图方案出现', FIG.includes(o.figText || s), `图方案里没有「${o.figText || s}」`);
}
const inL = (id, s) => ok(id + ' 课文出现', LESSON.includes(s), `课文里没有「${s}」`);
const inF = (id, s) => ok(id + ' 图方案出现', FIG.includes(s), `图方案里没有「${s}」`);

const pv = (c, r, t) => c / Math.pow(1 + r, t);
const ann = (r, n) => (1 - Math.pow(1 + r, -n)) / r;           // 年金系数（闭式）
const annSum = (r, n) => { let s = 0; for (let k = 1; k <= n; k++) s += pv(1, r, k); return s; }; // 逐笔相加
const sumTo = (f, n) => { let s = 0; for (let k = 1; k <= n; k++) s += f(k); return s; };

// ---------- A. 开场：英国不定期限国债（官方文件中的数字，见核验记录 S0401-R01–R07） ----------
const CONSOL_NOMINAL_MN = 161.2;   // 2½% Consolidated Stock，2015-03-16 后在外面值（DMO 2015-03-13、03-27）；2014-10 为 162.1
const WAR_LOAN_MN = 1938.6;        // 3½% War Loan
num('A1 统一公债约 1.6 亿英镑', CONSOL_NOMINAL_MN / 100, 1.6, 1, { text: '约 1.6 亿英镑' });
ok('A1b 2014 年数字也约 1.6 亿', Math.abs(162.1 / 100 - 1.6) < 0.05);
ok('A2 战争债 19 亿多', WAR_LOAN_MN >= 1900 && WAR_LOAN_MN < 2000); inL('A2b', '19 亿多英镑');
inL('A3 赎回日', '2015 年 7 月 5 日'); inL('A4 财政部公告日', '2015 年 3 月 27 日');
inL('A5 1752', '1752 年'); inL('A6 1888', '1888 年'); inL('A7 1853', '1853 年'); inL('A8 1720', '1720 年');
inL('A9 近 70 年', '近 70 年'); inL('A10 三个月通知', '提前三个月');
num('A11 每年利息', 100 * 0.025, 2.50, 2, { text: '£2.50' });

// ---------- B. 10 年期教学国债（假设：面值 100，票面 4%，年付息，折现率 5%） ----------
const r5 = 0.05;
const cpnPV = [3.81, 3.63, 3.46, 3.29, 3.13, 2.98, 2.84, 2.71, 2.58, 2.46];
cpnPV.forEach((w, k) => num('B1.' + (k + 1) + ' 第 ' + (k + 1) + ' 年票息现值', pv(4, r5, k + 1), w, 2, { text: '$' + w.toFixed(2), fig: true, figText: w.toFixed(2) }));
const prinPV = pv(100, r5, 10);
num('B2 本金现值', prinPV, 61.39, 2, { text: '$61.39', fig: true, figText: '61.39' });
const cpnSum = sumTo(k => pv(4, r5, k), 10);
num('B3 票息现值合计', cpnSum, 30.89, 2, { text: '$30.89', fig: true, figText: '30.89' });
num('B4 价格（逐笔）', cpnSum + prinPV, 92.28, 2, { text: '$92.28', fig: true, figText: '92.28' });
inL('B5 合同合计', '$140'); inF('B5b', '$140');
num('B6 图 1 第 2 步累计', pv(4, r5, 1) + pv(4, r5, 2), 7.44, 2, { lesson: false, fig: true, figText: '7.44' });
num('B7 图 1 第 3 步累计', sumTo(k => pv(4, r5, k), 3), 10.89, 2, { lesson: false, fig: true, figText: '10.89' });
inL('B8 与 S03-02 一致', '期限表里那一行的价格');

// ---------- C. 永续 ----------
num('C1 £2.50 按 5%', 2.5 / 0.05, 50, 2, { text: '£50.00' });
inL('C1b', '£2.50 ÷ 5% = £50');
const share = n => 1 - Math.pow(1.05, -n);
[[10, 19.30, 38.6], [30, 38.43, 76.9], [50, 45.64, 91.3], [100, 49.62, 99.2]].forEach(([n, v, s]) => {
  num('C2 前 ' + n + ' 年现值', 50 * share(n), v, 2, { text: '£' + v.toFixed(2) });
  num('C2b 前 ' + n + ' 年占比', share(n) * 100, s, 1, { text: s.toFixed(1) + '%' });
  ok('C2c 逐笔相加一致 ' + n, Math.abs(2.5 * annSum(0.05, n) - 50 * share(n)) < 1e-9);
});
num('C3 一百年以后', 50 * Math.pow(1.05, -100), 0.38, 2, { text: '£0.38' });
ok('C3b 前 10 年不到四成', share(10) < 0.4); inL('C3c', '不到四成');
[[0.02, 125], [0.025, 100], [0.04, 62.5], [0.05, 50]].forEach(([r, v]) => num('C4 永续 @' + r, 2.5 / r, v, 2, { text: '£' + v.toFixed(2) }));
ok('C5 5% → 2.5% 翻倍', Math.abs((2.5 / 0.025) / (2.5 / 0.05) - 2) < 1e-12); inL('C5b', '翻倍到 £100');
// 机会成本段：£60、£40 只是示例价格，须在 £50 两侧
inL('C6', '付 £60'); inL('C6b', '按 £40'); ok('C6c', 60 > 50 && 40 < 50);
// 图 2 不增长标签页
num('C7 图 2 £50 加利息', 50 * 1.05, 52.50, 2, { lesson: false, fig: true, figText: '£52.50' });
inF('C7b', '£50 × 5% = £2.50'); inL('C7c', '£50 × 5% = £2.50');
// 小题 1
num('Q1 正确答案', 2.5 / 0.04, 62.50, 2, { text: 'B. £62.50' });
num('Q1 A 选项（2.5%）', 2.5 / 0.025, 100, 2, { text: 'A. £100.00' });
num('Q1 C 选项（1%）', 2.5 / 0.01, 250, 2, { text: 'C. £250.00' });
num('Q1 D 选项（5%）', 2.5 / 0.05, 50, 2, { text: 'D. £50.00' });

// ---------- D. 年金与债券 ----------
num('D1 从明年起的永续', 4 / 0.05, 80, 0, { text: '$4 ÷ 5% = $80' });
num('D2 第 11 年起的永续折回今天', 80 / Math.pow(1.05, 10), 49.11, 2, { text: '$49.11' });
num('D3 两者相减', 80 - 80 / Math.pow(1.05, 10), 30.89, 2, { text: '$80 − $49.11 = $30.89' });
ok('D3b 永续相减 = 逐笔相加', Math.abs((80 - 80 / 1.05 ** 10) - cpnSum) < 1e-9);
num('D4 年金系数 5% 10 年', ann(0.05, 10), 7.7217, 4, { text: '7.7217' });
ok('D4b 闭式 = 逐笔', Math.abs(ann(0.05, 10) - annSum(0.05, 10)) < 1e-12);
num('D5 $4 × 年金系数', 4 * ann(0.05, 10), 30.89, 2, { text: '$4 × 7.7217 ≈ $30.89' });
inL('D5b 年金系数总比期数小', '今天只值约 $7.72');
inL('D6 两步', '$30.89 + $61.39 = $92.28');
num('D7 年金系数 5% 30 年', ann(0.05, 30), 15.3725, 4, { text: '15.3725' });
num('D8 30 年票息部分', 4 * ann(0.05, 30), 61.49, 2, { text: '$61.49' });
num('D9 30 年本金', pv(100, 0.05, 30), 23.14, 2, { text: '$23.14' });
num('D10 30 年价格', 4 * ann(0.05, 30) + pv(100, 0.05, 30), 84.63, 2, { text: '$84.63' });
inL('D10b 三十一笔', '三十一笔');
// 半年付息
num('D11 年金系数 2.5% 20 期', ann(0.025, 20), 15.5892, 4, { text: '15.5892' });
num('D12 半年付息价格', 2 * ann(0.025, 20) + pv(100, 0.025, 20), 92.21, 2, { text: '$92.21' });
// 少拿票息
num('D13 少拿票息现值', 1 * ann(0.05, 10), 7.72, 2, { text: '$1 × 7.7217 ≈ $7.72' });
num('D14 100 − 7.72', 100 - ann(0.05, 10), 92.28, 2, { text: '$100 − $7.72 = $92.28' });
// 31 CFR 356 附录 B 例题：8¾%，30 年，收益率 8.84%，半年一期，n = 59（发行日是付息日）
const C = 8.75, i = 0.0884, h = i / 2;
const v59 = Math.pow(1 + h, -59), a59 = (1 - v59) / h;
ok('D15 法规中间值 v^59', Math.abs(v59 - 0.0779403508) < 1e-10, String(v59));
ok('D16 法规中间值 a59', Math.abs(a59 - 20.8610780353) < 1e-9, String(a59));
const Preg = (C / 2 + (C / 2) * a59 + 100 * v59) / (1 + h);          // 法规写法（r/s = 1）
const P60 = (C / 2) * ann(h, 60) + 100 * Math.pow(1 + h, -60);        // 本课写法：60 期年金 + 本金
num('D17 法规写法价格', Preg, 99.057893, 6, { text: '$99.057893' });
ok('D18 两种写法相同', Math.abs(Preg - P60) < 1e-9, Preg + ' vs ' + P60);
num('D19 半年票息', C / 2, 4.375, 3, { text: '$4.375' });
num('D20 半年折现率', h * 100, 4.42, 2, { text: '4.42%' });
num('D21 票息部分', (C / 2) * ann(h, 60), 91.59, 2, { text: '$91.59' });
num('D22 本金部分', 100 * Math.pow(1 + h, -60), 7.46, 2, { text: '$7.46' });
ok('D23 本金不到十分之一', 100 * Math.pow(1 + h, -60) / P60 < 0.1);
ok('D24 票息九成以上', (C / 2) * ann(h, 60) / P60 > 0.9);
inL('D25 8¾%', '8¾%'); inL('D26 8.84%', '8.84%'); inL('D27 六十笔', '六十笔');
// 等额还款
const pay = 10000 / ann(0.05, 5);
num('D28 年金系数 5% 5 年', ann(0.05, 5), 4.3295, 4, { text: '4.3295' });
num('D29 每年还款', pay, 2309.75, 2, { text: '$2,309.75' });
num('D30 第 1 年末加利息', 10000 * 1.05, 10500, 0, { text: '$10,500' });
num('D31 第 1 年末余欠', 10000 * 1.05 - pay, 8190.25, 2, { text: '$8,190.25' });
let bal = 10000; for (let y = 0; y < 5; y++) bal = bal * 1.05 - pay;
ok('D32 第 5 年末还清', Math.abs(bal) < 1e-8, String(bal));
// 小题 2
num('Q2 5 年后 $100 现值', pv(100, 0.05, 5), 78.35, 2, { text: '$78.35' });
num('Q2 票息部分', 6 * ann(0.05, 5), 25.98, 2, { text: '$25.98' });
num('Q2 正确答案', 6 * ann(0.05, 5) + pv(100, 0.05, 5), 104.33, 2, { text: 'C. $104.33' });
num('Q2 B 选项（方向反了）', 100 - (6 * ann(0.05, 5) + pv(100, 0.05, 5) - 100), 95.67, 2, { text: 'B. $95.67' });
num('Q2 D 选项（不折现）', 6 * 5 + 100, 130, 2, { text: 'D. $130.00' });

// ---------- E. 增长永续 ----------
num('E1 $100 ÷ (8% − 3%)', 100 / (0.08 - 0.03), 2000, 2, { text: '$2,000.00' });
let acct = 2000;
const rows = [[2160.00, 100.00, 2060.00], [2224.80, 103.00, 2121.80], [2291.54, 106.09, 2185.45]];
rows.forEach(([b, w, e], y) => {
  const withdraw = 100 * Math.pow(1.03, y);
  const before = acct * 1.08; const after = before - withdraw;
  num('E2.' + (y + 1) + ' 加利息', before, b, 2, { text: '$' + fmt(b, 2), fig: true, figText: fmt(b, 2) });
  num('E2.' + (y + 1) + ' 取出', withdraw, w, 2, { text: '$' + fmt(w, 2) });
  num('E2.' + (y + 1) + ' 年末', after, e, 2, { text: '$' + fmt(e, 2), fig: true, figText: fmt(e, 2) });
  ok('E2.' + (y + 1) + ' 余额按 3% 增长', Math.abs(after - 2000 * Math.pow(1.03, y + 1)) < 1e-9);
  ok('E2.' + (y + 1) + ' 取走年初余额的 5%', Math.abs(withdraw / acct - 0.05) < 1e-12);
  acct = after;
});
inL('E3', '$100 ÷ $2,000，$103 ÷ $2,060'); inF('E3b', '取走的是年初余额的 5%');
[[0, '1,250.00'], [0.03, '2,000.00'], [0.05, '3,333.33'], [0.07, '10,000.00']].forEach(([g, s]) =>
  num('E4 g=' + g, 100 / (0.08 - g), Number(s.replace(/,/g, '')), 2, { text: '$' + s }));
ok('E5 5% → 7% 三倍', Math.abs((100 / 0.01) / (100 / 0.03) - 3) < 1e-9); inL('E5b', '三倍');
num('E6 负增长', 100 / (0.08 + 0.02), 1000, 0, { text: '$100 ÷ (8% + 2%) = $1,000' });
// 增长永续公式与逐笔相加（截到很远）一致
ok('E7 公式 = 逐笔相加（3000 年）', Math.abs(sumTo(k => pv(100 * Math.pow(1.03, k - 1), 0.08, k), 3000) - 2000) < 1e-6);
// 小题 3
num('Q3 正确答案', 50 / (0.09 - 0.04), 1000, 2, { text: 'B. $1,000.00' });
num('Q3 A 选项', 50 / 0.09, 555.56, 2, { text: 'A. $555.56' });
num('Q3 C 选项', 50 * 1.04 / 0.05, 1040, 2, { text: 'C. $1,040.00' });
num('Q3 D 选项', 50 / 0.13, 384.62, 2, { text: 'D. $384.62' });

// ---------- F. 终值与终值占比 ----------
function twoStage(r, g1, g2, N = 10, c1 = 100) {
  let first = 0; for (let t = 1; t <= N; t++) first += pv(c1 * Math.pow(1 + g1, t - 1), r, t);
  const cNext = c1 * Math.pow(1 + g1, N - 1) * (1 + g2);
  const tv = cNext / (r - g2), ptv = pv(tv, r, N);
  return { first, cNext, tv, ptv, total: first + ptv, share: ptv / (first + ptv) };
}
const base = twoStage(0.08, 0.03, 0.03);
const yr = [[100.00, 92.59], [103.00, 88.31], [106.09, 84.22], [109.27, 80.32], [112.55, 76.60], [115.93, 73.05], [119.41, 69.67], [122.99, 66.45], [126.68, 63.37], [130.48, 60.44]];
yr.forEach(([c, p], k) => {
  const cf = 100 * Math.pow(1.03, k);
  num('F1.' + (k + 1) + ' 现金流', cf, c, 2, { text: '| ' + (k + 1) + ' | $' + c.toFixed(2) + ' | $' + p.toFixed(2) + ' |' });
  num('F1.' + (k + 1) + ' 现值', pv(cf, 0.08, k + 1), p, 2, { lesson: false });
});
num('F2 前 10 年合计', base.first, 755.01, 2, { text: '$755.01', fig: true, figText: '$755.01' });
num('F3 第 11 年现金流', base.cNext, 134.39, 2, { text: '$134.39' });
num('F4 终值', base.tv, 2687.83, 2, { text: '$2,687.83' });
num('F5 终值现值', base.ptv, 1244.99, 2, { text: '$1,244.99', fig: true, figText: '$1,244.99' });
num('F6 合计', base.total, 2000, 2, { text: '$755.01 + $1,244.99 = $2,000.00', fig: true, figText: '$2,000.00' });
num('F7 前 10 年占比', (1 - base.share) * 100, 37.8, 1, { text: '37.8%', fig: true });
num('F8 终值占比', base.share * 100, 62.2, 1, { text: '62.2%', fig: true });
ok('F9 闭式 [(1+g)/(1+r)]^10', Math.abs(Math.pow(1.03 / 1.08, 10) - base.share) < 1e-12);
num('F10 2000 × 62.2%', 2000 * Math.pow(1.03 / 1.08, 10), 1245, 0, { text: '≈ $1,245' });
// 3 × 3 表（课文）与 6 × 6 表（图方案）
const R = [0.06, 0.07, 0.08, 0.09, 0.10, 0.12], G = [0, 0.01, 0.02, 0.03, 0.04, 0.05];
const lessonRows = { 0.06: [55.8, 75.0, 91.0], 0.08: [46.3, 62.2, 75.4], 0.10: [38.6, 51.8, 62.8] };
for (const r of [0.06, 0.08, 0.10]) {
  const got = [0, 0.03, 0.05].map(g => Number((twoStage(r, g, g).share * 100).toFixed(1)));
  ok('F11 课文 3×3 行 r=' + r, got.every((x, k) => Math.abs(x - lessonRows[r][k]) < 1e-9), got.join(','));
  inL('F11b 行 r=' + r, '| ' + Math.round(r * 100) + '% | ' + lessonRows[r].map(x => x.toFixed(1) + '%').join(' | ') + ' |');
}
let figCells = 0;
for (const r of R) {
  const cells = G.map(g => { const s = twoStage(r, g, g); ok('F12 g<r', g < r); return (s.share * 100).toFixed(1) + '%（' + fmt(Math.round(s.total), 0) + '）'; });
  const row = '| ' + Math.round(r * 100) + '% | ' + cells.join(' | ') + ' |';
  ok('F12 图方案 6×6 行 r=' + r, FIG.includes(row), '图方案缺「' + row + '」'); figCells += 6;
}
ok('F13 36 格', figCells === 36); inF('F13b', '36 种组合');
num('F14 g=0 r=8% 终值现值', twoStage(0.08, 0, 0).ptv, 578.99, 2, { text: '$578.99' });
num('F15 g=0 r=8% 总现值', twoStage(0.08, 0, 0).total, 1250, 0, { text: '总现值 $1,250' });
num('F16 1 ÷ 1.08^10', Math.pow(1.08, -10) * 100, 46.3, 1, { text: '1 ÷ 1.08¹⁰ ≈ 46.3%' });
// 两段不同增长率
const ts = twoStage(0.08, 0.10, 0.03);
num('F17 前 10 年（10% 增长）', ts.first, 1007.02, 2, { text: '$1,007.02' });
num('F18 终值现值', ts.ptv, 2249.90, 2, { text: '$2,249.90' });
num('F19 总现值', ts.total, 3256.93, 2, { text: '$3,256.93' });
num('F20 终值占比', ts.share * 100, 69.1, 1, { text: '69.1%' });
// 切点
num('F21 切在第 5 年', Math.pow(1.03 / 1.08, 5) * 100, 78.9, 1, { text: '78.9%' });
num('F22 切在第 20 年', Math.pow(1.03 / 1.08, 20) * 100, 38.7, 1, { text: '38.7%' });
ok('F23 切点不改总数', Math.abs(twoStage(0.08, 0.03, 0.03, 5).total - 2000) < 1e-9 && Math.abs(twoStage(0.08, 0.03, 0.03, 20).total - 2000) < 1e-9);
// 图 3 最大值
num('F24 图 3 最大总现值', twoStage(0.06, 0.05, 0.05).total, 10000, 0, { lesson: false, fig: true, figText: '$10,000' });

// ---------- G. 结尾：赎回的模型推演 ----------
inL('G1', '£2.50 ÷ r');
num('G2 r=2%', 2.5 / 0.02, 125, 0, { text: '它值 £125' });
num('G3 r=4%', 2.5 / 0.04, 62.5, 2, { text: '它只值 £62.50' });
ok('G4 r=2.5% 恰为面值', Math.abs(2.5 / 0.025 - 100) < 1e-12);

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
