// S03-01 数值核验 · 2026-11-20
// 运行：node "lessons/S03-01/S03-01 数值核验.js"
// 读取《S03-01 课文 v1 候选.md》和《S03-01 图与交互方案 v1 候选.md》，对每个关键数字：先重算，再断言它确实出现在文件里。
// 不依赖网络或临时目录。单位：美元；亿 = 1e8，万 = 1e4。
// 基础设定（设定表）：1,000 万股、债务 3 亿、公司价值 8 亿、定期股息每季每股 $0.25、小林 600 股 $30,017。
// 本课独立假设：清算 12/8/4/2 亿；现金 1 亿；特别股息 5,000 万；同额股票回购 @$50；增发 @$50、@$40；股权激励 50 万股。
// 模型假设：一期、无税、无交易成本、股价不因公告本身变动；每股价值 = 股东所得 ÷ 股数。
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const lesson = fs.readFileSync(path.join(dir, 'S03-01 课文 v1 候选.md'), 'utf8');
const figs = fs.readFileSync(path.join(dir, 'S03-01 图与交互方案 v1 候选.md'), 'utf8');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.log('失败：' + msg); } }
const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const inL = (s, msg) => ok(lesson.includes(s), '课文缺「' + s + '」' + (msg ? '（' + msg + '）' : ''));
const inF = (s, msg) => ok(figs.includes(s), '图方案缺「' + s + '」' + (msg ? '（' + msg + '）' : ''));
const inBoth = (s, msg) => { inL(s, msg); inF(s, msg); };
const Y = 1e8, W = 1e4;
const fmt = n => n.toLocaleString('en-US');                 // 30000 -> 30,000
const yi = n => String(+(n / Y).toFixed(2)) + ' 亿';          // 7.5e8 -> 7.5 亿
const wan = n => fmt(+(n / W).toFixed(0)) + ' 万';            // 5e7 -> 5,000 万

// ---------- 基础设定 ----------
const N0 = 1000 * W, D = 3 * Y, V0 = 8 * Y, XL = 600, COST = 30017, QDIV = 0.25;
inBoth('1,000 万股'); inBoth('600 股'); inL('$30,017'); inBoth('3 亿'); inBoth('8 亿'); inL('$0.25'); inF('$0.25');
const E0 = V0 - D, P0 = E0 / N0;
ok(close(E0, 5 * Y) && close(P0, 50), '起点：股东 5 亿、每股 $50');
inL('剩下 5 亿，正好是 1,000 万股乘以每股 $50');
ok(close(XL / N0, 0.00006), '600 / 1,000 万 = 万分之零点六');
inBoth('万分之零点六');

// ---------- A. 清算（第 3 节、图 1） ----------
const eq = V => Math.max(V - D, 0), debt = V => Math.min(V, D);
const rows = [[12, 3, 9, 90, 54000], [8, 3, 5, 50, 30000], [4, 3, 1, 10, 6000], [2, 2, 0, 0, 0]];
for (const [v, d, e, ps, xl] of rows) {
  const V = v * Y;
  ok(close(debt(V), d * Y) && close(eq(V), e * Y) && close(eq(V) / N0, ps) && close(eq(V) / N0 * XL, xl), `清算 ${v} 亿重算`);
  ok(eq(V) >= 0, `清算 ${v} 亿：股东所得非负（有限责任）`);
  const sharesTxt = e === 0 ? '0' : e + ' 亿';
  const line = `| ${v} 亿 | ${d} 亿 | ${sharesTxt} | $${ps} | $${fmt(xl)} |`;
  inL(line, '课文清算表');
  const recov = (debt(V) / D * 100);
  const recTxt = recov === 100 ? '100%' : recov.toFixed(1) + '%';
  inF(`| ${v} 亿 | ${d} 亿 | ${recTxt} | ${sharesTxt} | $${ps} | $${fmt(xl)} |`, '图 1 读数表');
}
ok(close((50 - 10) / 50, 0.8) && close((8 - 4) / 8, 0.5), '公司价值跌一半、每股跌八成');
inL('跌了一半'); inL('跌了八成');
// 有限责任反事实：缺口 1 亿 × 万分之零点六 = $6,000
ok(close((D - 2 * Y) * XL / N0, 6000), '反事实分摊 $6,000');
inL('小林就得再拿出 $6,000（1 亿乘以万分之零点六）');
// 折线斜率：每增加 1 亿，每股增加 $10
ok(close(1 * Y / N0, 10), '折线斜率每亿 $10'); inF('每增加 1 亿、每股增加 $10');
// 小题 1：2.5 亿清算
ok(close(eq(2.5 * Y), 0) && close(debt(2.5 * Y), 2.5 * Y), '小题 1：股东 0，债权人 2.5 亿');
ok(close((D - 2.5 * Y) * XL / N0, 3000), '小题 1 选项 A：0.5 亿 × 万分之零点六 = $3,000');
inL('全部资产卖得 2.5 亿美元'); inL('缺口 0.5 亿按持股比例分摊，他要再付 $3,000');

// ---------- B. 特别股息（第 4 节、图 2） ----------
const DIV = 0.5 * Y, CASH = 1 * Y;
ok(DIV <= CASH, '特别股息不超过假设的现金 1 亿');
inL('账上有 1 亿美元现金'); inF('现金 1 亿');
const dps = DIV / N0, V1 = V0 - DIV, E1 = eq(V1), P1 = E1 / N0;
ok(close(dps, 5) && close(V1, 7.5 * Y) && close(E1, 4.5 * Y) && close(P1, 45), '特别股息重算');
inBoth(wan(DIV)); inL('每股 $5'); inBoth(yi(V1)); inBoth(yi(E1)); inBoth('$45');
ok(close(P1 * XL, 27000) && close(dps * XL, 3000) && close(P1 * XL + dps * XL, 30000), '小林 27,000 + 3,000 = 30,000');
inBoth('$27,000'); inBoth('$3,000'); inBoth('$30,000');
ok((V0 / D).toFixed(2) === '2.67' && close(V1 / D, 2.5), '覆盖倍数 2.67 → 2.5');
inL('2.67 倍'); inL('2.5 倍');

// ---------- C. 同额股票回购 ----------
const bb = (price) => { const n = DIV / price, N1 = N0 - n; return { n, N1, P: E1 / N1 }; };
const f = bb(50);
ok(close(f.n, 100 * W) && close(f.N1, 900 * W) && close(f.P, 50), '回购 @$50 重算');
inBoth('100 万股'); inBoth('900 万');
ok((XL / f.N1 * 1e4).toFixed(2) === '0.67', '600 / 900 万 ≈ 万分之零点六七');
inBoth('万分之零点六七');
// 自制分红
const sold = XL * (f.n / N0);
ok(close(sold, 60) && close(sold * 50, 3000) && close((XL - sold) * f.P, 27000) && close((XL - sold) / f.N1, XL / N0), '自制分红 60 股');
inBoth('60 股'); inBoth('540 股');
// 高价回购 $62.50
const h = bb(62.5);
ok(close(h.n, 80 * W) && close(h.N1, 920 * W) && h.P.toFixed(2) === '48.91', '回购 @$62.50 重算');
inBoth('$62.50'); inBoth('80 万股'); inBoth('920 万'); inBoth('$48.91');
const gainSellers = h.n * (62.5 - 50), lossStayers = h.N1 * (50 - h.P);
ok(close(gainSellers, 1000 * W) && close(lossStayers, 1000 * W, 1e-3), '价值转移 1,000 万');
ok((50 - h.P).toFixed(2) === '1.09', '留下的股东每股少约 $1.09');
inL('$12.50'); inL('$1.09'); inL('一共多拿 1,000 万'); inF('转移 1,000 万');

// ---------- D. 稀释（第 5 节、图 3、小题 3） ----------
const issue = (n, price) => { const N1 = N0 + n, E = eq(V0 + n * price); return { N1, E, P: E / N1 }; };
const i50 = issue(100 * W, 50);
ok(close(i50.E, 5.5 * Y) && close(i50.N1, 1100 * W) && close(i50.P, 50) && close(V0 + DIV, 8.5 * Y), '增发 @$50 重算');
inL('8.5 亿'); inL('5.5 亿'); inBoth('1,100 万');
ok((XL / i50.N1 * 1e4).toFixed(2) === '0.55', '600 / 1,100 万 ≈ 万分之零点五五'); inBoth('约万分之零点五五');
ok(Math.round((1 - (XL / i50.N1) / (XL / N0)) * 100) === 9, '比例下降约 9%'); inL('下降约 9%');
const i40 = issue(100 * W, 40);
ok(close(i40.E, 5.4 * Y) && i40.P.toFixed(2) === '49.09' && Math.round(i40.P * XL) === 29455, '增发 @$40 重算');
inL('5.4 亿'); inBoth('$49.09'); inBoth('$29,455'); inBoth('4,000 万');
const newGets = 100 * W * i40.P, transfer = newGets - 4000 * W;
ok(Math.round(newGets / W) === 4909 && Math.round(transfer / W) === 909 && close(transfer, N0 * (50 - i40.P), 1e-3), '新股东约值 4,909 万，转移约 909 万');
inL('约值 4,909 万'); inL('约 909 万');
const Nesop = N0 + 50 * W, Pesop = E0 / Nesop;
ok(Pesop.toFixed(2) === '47.62' && Math.round(Pesop * XL) === 28571 && (XL / Nesop * 1e4).toFixed(2) === '0.57', '股权激励 50 万股重算');
inBoth('50 万股'); inBoth('1,050 万'); inBoth('$47.62'); inF('$28,571'); inBoth('约万分之零点五七');
const Pcash = eq(V0 - 0.25 * Y) / N0;
ok(close(Pcash, 47.5) && close(eq(V0 - 0.25 * Y), 4.75 * Y), '对照：付现金 2,500 万');
inL('2,500 万美元现金工资'); inL('4.75 亿'); inL('$47.50');
inF('$50.00');

// ---------- 法规中的数字 ----------
inL('1% 征收消费税'); inL('2023 年起');
inL('10% 列入法定公积金'); inL('注册资本的 50% 以上'); inL('不得超过已发行股份的 10%'); inL('三年内转让或注销');
inL('连续 20 个交易日内收盘价累计跌幅达到 20%'); inL('六个月内分配');

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
