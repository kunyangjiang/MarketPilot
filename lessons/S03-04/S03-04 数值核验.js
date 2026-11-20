// S03-04 数值核验（生产阶段）：node "lessons/S03-04/S03-04 数值核验.js"
// 读取《S03-04 课文 v1 候选.md》与《S03-04 图与交互方案 v1 候选.md》，
// 对课文与图中出现的每个关键数字：先重算，再断言它确实以课文里的写法出现。
// 不依赖网络与临时目录；官方数字（SEC、BIS、论文、上交所）以常量写在下面，出处编号见《S03-04 核验记录》。
'use strict';
const fs = require('fs');
const path = require('path');

const LESSON = fs.readFileSync(path.join(__dirname, 'S03-04 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const FIG = fs.readFileSync(path.join(__dirname, 'S03-04 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');

let pass = 0, fail = 0;
function ok(id, cond, msg) { if (cond) pass++; else { fail++; console.log('失败 ' + id + '：' + msg); } }
function inL(id, s) { ok(id + ' 课文出现', LESSON.includes(s), `课文里没有「${s}」`); }
function inF(id, s) { ok(id + ' 图方案出现', FIG.includes(s), `图方案里没有「${s}」`); }
function notL(id, s) { ok(id + ' 课文不出现', !LESSON.includes(s), `课文里不应出现「${s}」`); }
function notF(id, s) { ok(id + ' 图方案不出现', !FIG.includes(s), `图方案里不应出现「${s}」`); }
const fmt = (x, dp = 2) => x.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const money = (x, dp = 2) => (x < 0 ? '−' : '+') + '$' + fmt(Math.abs(x), dp);
// 重算值四舍五入后应等于 want；want 的写法（text）须出现在课文 / 图方案
function num(id, got, want, dp, where = '', text) {
  const r = Number(got.toFixed(dp));
  ok(id + ' 重算', Math.abs(r - want) < 1e-9, `重算 ${got} → ${r}，应为 ${want}`);
  const s = text || String(want);
  if (where.includes('L')) inL(id, s);
  if (where.includes('F')) inF(id, s);
}
const r2 = x => Math.round(x * 100) / 100;

// ---------- A. 开场与 SEC 回测（S0304-R05 表 2 与脚注 359–360） ----------
const SEC2018 = { total: 2046, alternative: 11, intlEquity: 20, sectorEquity: 2, taxableBond: 1, usEquity: 15 };
const over2 = SEC2018.alternative + SEC2018.intlEquity + SEC2018.sectorEquity + SEC2018.taxableBond + SEC2018.usEquity;
num('A1 回测触发 2% 披露的 ETF', over2, 49, 0, 'LF', '49 只');
inL('A2 总数', '2,046 只');
inL('A3 门槛 5%', '把门槛提到 5%，只剩 5 只'); inL('A4 门槛 10%', '提到 10%，一只也没有');
inL('A5 应税债券 1 只', '投资应税债券的只有 1 只');
inL('A6 7 个交易日 / 2%', '连续超过 7 个交易日'); inL('A6b', '2% 以上');
inL('A7 回测措辞', '用 2018 年的数据做了一次回测'); inF('A7b 图方案措辞', 'SEC 用 2018 年数据回测时会触发披露的数量');
ok('A8 占比', Math.abs(over2 / SEC2018.total - 0.024) < 0.001, '49 / 2,046 ≈ 2.4%');
inL('A9 2008–2018 占比区间', '1.5% 到 10%');
// BIS Bulletin No. 6（S0304-R01）：3 月 19 日，久期 < 3 年的 IG ETF 6.9% vs 平均 5.3%；样本：欧洲和美国
inL('A10 5.3%', '5.3%'); inL('A11 6.9%', '6.9%'); inF('A10b', '5.3%'); inF('A11b', '6.9%');
inL('A12 样本含欧洲', '欧洲和美国的公司债交易所交易基金');
notL('A13 不写美国投资级平均', '美国投资级公司债 ETF 平均'); notL('A13b', '美国投资级 ETF 平均');
ok('A14 6.9 > 5.3', 6.9 > 5.3, '短久期折价应大于平均');

// ---------- B. 第 2 节：溢价公式的例子 ----------
const prem = (25.10 - 25.00) / 25.00 * 100;
num('B1 溢价 0.40%', prem, 0.40, 2, 'LF', '0.40%');
inL('B2 美东 4 点', '美东时间下午 4 点');

// ---------- C. 模型 A（第 3–5 节；图 1、图 2） ----------
const N = 50000, FEE = 500, SEC31 = 20.60 / 1e6;
const basket = [{ n: '股票甲', q: 10000, p: 50, hs: 0.01 }, { n: '股票乙', q: 5000, p: 100, hs: 0.02 }, { n: '股票丙', q: 12500, p: 20, hs: 0.01 }];
const B = basket.reduce((s, x) => s + x.q * x.p, 0);
const HS = basket.reduce((s, x) => s + x.q * x.hs, 0);
num('C1 篮子市值', B, 1250000, 0, 'L', '$1,250,000');
basket.forEach((x, i) => { num('C2.' + i + ' ' + x.n + ' 市值', x.q * x.p, x.q * x.p, 0, 'L', '$' + fmt(x.q * x.p, 0)); inL('C2b.' + i, x.n); });
num('C3 每份净值', B / N, 25, 2, 'LF', '$25.00');
num('C4 篮子半价差合计', HS, 325, 2, '');
num('C5 买篮子', B + HS, 1250325, 2, 'L', '$1,250,325.00');
num('C6 表面利润', N * (25.10 - 25.00), 5000, 2, 'L', '$5,000');
const sellETF = N * 25.09;
num('C7 卖 50,000 份', sellETF, 1254500, 2, 'L', '+$1,254,500.00');
const fee31a = r2(sellETF * SEC31);
num('C8 第 31 条费用（申购套利）', fee31a, 25.84, 2, 'L', '$25.84');
const netA = sellETF - fee31a - (B + HS) - FEE;
num('C9 溢价 0.40% 净利润', netA, 3649.16, 2, 'LF', '3,649.16');
inL('C9b 净利润写法', '**+$3,649.16**'); inL('C10 申购费', '$500');
inL('C11 申购费区间', '$250 到 $1,000'); inL('C12 费率', '$20.60'); inL('C12b 费率生效日', '2026 年 4 月 4 日');
// 折价 0.40%
const askD = 24.90 + 0.01, buyETF = N * askD, sellBasket = B - HS, fee31d = r2(sellBasket * SEC31);
num('C13 折价情形卖一', askD, 24.91, 2, 'LF', '$24.91');
num('C14 买 50,000 份', buyETF, 1245500, 0, 'L', '$1,245,500');
num('C15 卖篮子', sellBasket, 1249675, 0, 'L', '$1,249,675');
num('C16 第 31 条（赎回套利）', fee31d, 25.74, 2, 'L', '$25.74');
const netD = sellBasket - fee31d - buyETF - FEE;
num('C17 折价 0.40% 净利润', netD, 3649.26, 2, 'LF', '$3,649.26');
inL('C18 中间价 24.90', '$24.90'); inF('C18b', '$24.90');
// 图 1 的数字
['$25.10', '$25.09', '50,000', '10,000 股', '5,000 股', '12,500 股'].forEach((s, i) => inF('C19.' + i, s));
// 无套利区间
function band(k) {
  const hs = HS * k;
  const bid = (B + hs + FEE) / (N * (1 - SEC31));
  const ask = ((B - hs) * (1 - SEC31) - FEE) / N;
  return { bid, midUp: bid + 0.01, up: ((bid + 0.01) / 25 - 1) * 100, down: ((ask - 0.01) / 25 - 1) * 100 };
}
const b1 = band(1), b5 = band(5);
num('C20 盈亏平衡买一', b1.bid, 25.017, 3, 'LF', '$25.017');
num('C21 盈亏平衡中间价', b1.midUp, 25.027, 3, 'LF', '$25.027');
num('C22 区间上沿', b1.up, 0.11, 2, 'LF', '0.11%');
num('C23 区间下沿', b1.down, -0.11, 2, 'L', '−0.11%');
num('C23b 区间三位小数（图方案）', b1.up, 0.108, 3, 'F', '0.108%');
inL('C24 区间写法', '±0.11%'); inF('C24b', '±0.11%');
num('C25 篮子更难买时区间', b5.up, 0.21, 2, 'LF', '±0.21%');
num('C25b 三位小数', b5.up, 0.212, 3, 'F', '±0.212%');
num('C25c 下沿对称', -b5.down, 0.21, 2, '');
num('C26 半价差 ×5', HS * 5, 1625, 0, 'F', '$1,625');
num('C27 第 31 条约十万分之二', SEC31 * 1e5, 2.06, 2, 'L', '十万分之二');
// 图 2 九个点（开关关 / 开）
function point(p, k) {
  const hs = HS * k, mid = 25 * (1 + p / 100), bid = mid - 0.01, ask = mid + 0.01;
  const cre = N * bid - r2(N * bid * SEC31) - (B + hs) - FEE;
  const red = (B - hs) - r2((B - hs) * SEC31) - N * ask - FEE;
  return { cre: r2(cre), red: r2(red) };
}
function cell(p, k) {
  const { cre, red } = point(p, k);
  if (cre > 0) return '申购 ' + money(cre);
  if (red > 0) return '赎回 ' + money(red);
  if (Math.abs(cre - red) < 0.05) return '不动（' + money(cre) + '）';
  return p < 0 ? '不动（赎回 ' + money(red) + '）' : '不动（申购 ' + money(cre) + '）';
}
const pts = [-1, -0.4, -0.15, -0.1, 0, 0.1, 0.11, 0.4, 1];
const label = p => (p === 0 ? '0' : (p > 0 ? '+' : '−') + Math.abs(p).toFixed(2) + '%');
pts.forEach(p => {
  const row = '| ' + label(p) + ' | ' + cell(p, 1) + ' | ' + cell(p, 5) + ' |';
  ok('C28 图 2 表行 ' + label(p), FIG.includes(row), `图方案缺这一行：${row}`);
});
ok('C29 +0.10% 不动、+0.11% 申购', point(0.1, 1).cre < 0 && point(0.11, 1).cre > 0, '区间边界应在 0.10% 与 0.11% 之间');
ok('C30 −0.10% 不动、−0.15% 赎回', point(-0.1, 1).red < 0 && point(-0.15, 1).red > 0, '折价边界');

// ---------- D. 第 3、6、7 节的文字数字 ----------
inL('D1 活跃 AP', '3 到 5 个'); inL('D2 申赎频率', '每 2 到 4 天'); inL('D3 二级市场九成', '约九成');
inL('D4 最低交易额', '$100,000'); inL('D5 17 倍', '17 倍'); inL('D6 5 倍', '约为 5 倍'); inL('D7 3%', '不到它实际持有债券的 3%');
inL('D8 HY > 9%', '有的超过 9%'); inL('D9 > 5%', '折价超过 5%');
inL('D10 价差', '1.75 到 2 个百分点'); inL('D11 此前价差', '0.1 到 0.2 个百分点');
const mfOut = 2550, etfOut = 210;   // 亿美元（SEC DERA：$255bn、$21bn）
num('D12 共同基金净流出', mfOut / 10, 255, 0, 'L', '2,550 亿美元');
num('D13 债券 ETF 净流出', etfOut / 10, 21, 0, 'L', '210 亿美元');
inL('D14 AP 赎回 300 亿', '约 300 亿美元');
inL('D15 32 只 / 5 只', '有 32 只 ETF 出现赎回，只有 5 只有申购');
inL('D16 HMM 10% / 5%', '最高约 10%，平均峰值约 5%');
['3 月 12 日', '3 月 15 日', '3 月 18 日', '3 月 19 日', '3 月 23 日', '4 月 9 日', '上午 8 点'].forEach((s, i) => { inL('D17.' + i, s); inF('D17b.' + i, s); });
inF('D18 图 3 样本说明', '欧洲和美国');

// ---------- E. 模型 B（第 8 节；图 4） ----------
const NAVb = 100, bidB = 94.95, askB = 95.05, NB = 50000, FEEB = 1000;
const midB = (bidB + askB) / 2;
num('E1 中间价折价 5%', (1 - midB / NAVb) * 100, 5, 2, 'LF', '5%');
inL('E1b 买一卖一', '$94.95 和 $95.05'); inF('E1c', '$94.95 / $95.05');
const cost = NB * askB, navV = NB * NAVb;
num('E2 买入 50,000 份', cost, 4752500, 0, 'LF', '$4,752,500');
num('E3 按净值算', navV, 5000000, 0, 'LF', '$5,000,000');
inL('E4 赎回费', '$1,000'); inF('E4b', '$1,000');
const realize = s => navV * (1 - s / 100);
const netB = s => realize(s) - cost - FEEB;
const s1 = 0 + 1 + 1.5 + 2, s2 = 4 + 1 + 0 + 0;
num('E5 读法一能变现', realize(s1), 4775000, 0, 'LF', '$4,775,000');
num('E6 读法一净利润', netB(s1), 21500, 0, 'LF', '+$21,500');
num('E7 读法一再加 0.5 个百分点', netB(s1 + 0.5), -3500, 0, 'L', '−$3,500');
inL('E7b', '再多 0.5 个百分点'); inF('E7c 图方案 2.5%', '持有成本调到 2.5% → −$3,500');
num('E8 读法二能变现', realize(s2), 4750000, 0, 'LF', '$4,750,000');
num('E9 读法二净利润', netB(s2), -3500, 0, 'LF', '−$3,500');
num('E10 盈亏平衡四项之和', (1 - (cost + FEEB) / navV) * 100, 4.93, 2, 'F', '4.93%');
num('E11 读法一盈亏平衡卖一', (realize(s1) - FEEB) / NB, 95.48, 2, 'F', '$95.48');
num('E12 对应中间价折价', (1 - ((realize(s1) - FEEB) / NB - 0.05) / NAVb) * 100, 4.57, 2, 'F', '4.57%');
num('E13 读法二盈亏平衡卖一', (realize(s2) - FEEB) / NB, 94.98, 2, 'F', '$94.98');
num('E14 对应中间价折价', (1 - ((realize(s2) - FEEB) / NB - 0.05) / NAVb) * 100, 5.07, 2, 'F', '5.07%');
num('E15 分解条 $4.95', NAVb - askB, 4.95, 2, 'F', '$4.95');
num('E16 半价差约为 1.75–2 个百分点的一半', (1.75 + 2) / 2 / 2, 0.94, 2);  // ≈ 0.94，课文取 1%，写「大约一半」
inL('E16b', '大约一半');
inL('E17 示意声明', '不对应任何真实的 ETF 或任何一天'); inF('E17b', '示意，不对应任何真实 ETF 或任何一天');

// ---------- F. 中国对照（S0304-R18 第十六、二十二、三十、三十一条） ----------
inL('F1 细则版本', '2020 年第二次修订');
inL('F2 第二十二条（一）（四）', '当日买入的股票同日可以用于申购；当日申购的份额同日可以卖出');
inL('F3 跨境 ETF', '当日申购的份额要等清算交收完成后才能卖出和赎回');
inL('F4 限额', '超出部分的申报无效');
notL('F5 不写深交所', '深交所'); notL('F5b', '深圳证券交易所');

// ---------- G. 数据与命名约束 ----------
['LQD', 'HYG', 'HYD', 'iShares', 'IHYG', '北岭', '远帆'].forEach((s, i) => { notL('G1.' + i, s); });
['LQD', 'HYG', 'IHYG'].forEach((s, i) => notF('G2.' + i, s));
notL('G3 不写 3.4%', '3.4%'); notL('G4 不写 LQD 单日 5.08%', '5.08%');
notL('G5 不把工作论文称期刊', 'Pan 和 Zeng 发表');
inL('G6 Pan & Zeng 写工作论文', 'Pan 和 Zeng 的工作论文');

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
