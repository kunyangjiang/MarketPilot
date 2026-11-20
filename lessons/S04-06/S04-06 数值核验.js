// S04-06 数值核验：重算课文与图与交互方案中的每个关键数字，并断言它们确实出现在这两份文件里。
// 运行：node "S04-06 数值核验.js"（在本目录或任何目录均可）。不依赖网络与 scratchpad。
'use strict';
const fs = require('fs');
const path = require('path');

const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r/g, '');
const lesson = read('S04-06 课文 v1 候选.md');
const figs = read('S04-06 图与交互方案 v1 候选.md');

let pass = 0, fail = 0;
function ok(name, cond, note) {
  if (cond) pass++; else { fail++; console.log('失败：' + name + (note ? '（' + note + '）' : '')); }
}
// 四舍五入（半数进位），避免浮点把 11.825 舍成 11.82
const fx = (x, d = 2) => (Math.round(x * 10 ** d + 1e-7) / 10 ** d).toFixed(d);
const pct = (x, d = 1) => fx(x * 100, d);
const inL = s => lesson.includes(s);
const inF = s => figs.includes(s);
function eq(name, got, want) { ok(name + ' = ' + want, got === want, '算得 ' + got); }

// ---------- 教学模型 ----------
const ROIC = 0.15, R0 = 100, SHARES = 5, T = 5;
function value({ g, m, r, gt }, opt = {}) {
  const roic = opt.roic || ROIC, noReinv = !!opt.noReinv;
  let pv = 0; const rows = [];
  for (let t = 1; t <= T; t++) {
    const rev = R0 * (1 + g) ** t, np = rev * m, gNext = t < T ? g : gt;
    const inv = noReinv ? 0 : np * gNext / roic, fcf = np - inv, d = fcf / (1 + r) ** t;
    pv += d; rows.push({ t, rev, np, inv, fcf, d });
  }
  const np6 = R0 * (1 + g) ** T * (1 + gt) * m;
  const fcf6 = np6 * (1 - (noReinv ? 0 : gt / roic));
  const tv = fcf6 / (r - gt), pvtv = tv / (1 + r) ** T, v = pv + pvtv;
  return { rows, pv, np6, fcf6, tv, pvtv, v, ps: v / SHARES, share: pvtv / v, pe: v / rows[0].np };
}
const M = { g: 0.075, m: 0.11, r: 0.09, gt: 0.025 };
const A = { g: 0.10, m: 0.12, r: 0.08, gt: 0.03 };
const B = { g: 0.05, m: 0.10, r: 0.10, gt: 0.02 };

// ---------- A 组：中间情景逐年表 ----------
const vm = value(M);
const expectRows = [
  ['107.50', '11.83', '5.91', '5.91', '5.42'],
  ['115.56', '12.71', '6.36', '6.36', '5.35'],
  ['124.23', '13.67', '6.83', '6.83', '5.28'],
  ['133.55', '14.69', '7.35', '7.35', '5.20'],
  ['143.56', '15.79', '2.63', '13.16', '8.55'],
];
vm.rows.forEach((r, i) => {
  const got = [r.rev, r.np, r.inv, r.fcf, r.d].map(x => fx(x));
  eq('中间情景第 ' + r.t + ' 年', got.join('|'), expectRows[i].join('|'));
  ok('课文含第 ' + r.t + ' 年行', inL('> | ' + r.t + ' | ' + got.join(' | ') + ' |'));
});
eq('前 5 年现值合计', fx(vm.pv), '29.81'); ok('课文含 29.81', inL('| 29.81 |'));
eq('再投资比例 7.5% ÷ 15%', fx(0.075 / 0.15), '0.50'); ok('课文：利润的一半', inL('今年利润的一半'));
eq('终值期再投资比例 2.5% ÷ 15% = 1/6', fx(0.025 / 0.15 * 6), '1.00'); ok('课文：六分之一', inL('利润的六分之一') && inL('扣掉六分之一的再投资'));
eq('第 6 年利润', fx(vm.np6), '16.19'); ok('课文含 16.19', inL('15.79 × 1.025 ≈ 16.19'));
eq('第 6 年自由现金流', fx(vm.fcf6), '13.49'); ok('课文含 13.49', inL('自由现金流约 13.49'));
eq('终值', fx(vm.tv), '207.52'); ok('课文含终值算式', inL('13.49 ÷（9% − 2.5%）≈ 207.52'));
eq('终值现值', fx(vm.pvtv), '134.88'); ok('课文含 134.88', inL('207.52 ÷ 1.09⁵ ≈ 134.88'));
eq('公司价值', fx(vm.v), '164.68'); ok('课文含 164.68', inL('约 164.68 亿美元'));
eq('每股价值', fx(vm.ps), '32.94'); ok('课文含 $32.94', inL('每股约 **$32.94**'));
eq('终值占比', pct(vm.share), '81.9'); ok('课文含 81.9%', inL('约 81.9%'));
// 两种算法互证：用 1/6 比例手算第 6 年
ok('手算 16.19 × 5/6 ≈ 13.49', fx(+fx(vm.np6) * 5 / 6) === '13.49');

// ---------- B 组：甲、乙、中间三栏表 ----------
const va = value(A), vb = value(B);
const tri = [[va, '244.04', '48.81', '88.8', '18.5'], [vm, '164.68', '32.94', '81.9', '13.9'], [vb, '118.21', '23.64', '74.1', '11.3']];
for (const [o, v, ps, sh, pe] of tri) {
  eq('公司价值', fx(o.v), v); eq('每股', fx(o.ps), ps); eq('终值占比', pct(o.share), sh); eq('市盈率', fx(o.pe, 1), pe);
}
ok('三栏表：公司价值行', inL('| 公司价值（亿美元） | 244.04 | 164.68 | 118.21 |'));
ok('三栏表：每股行', inL('| 每股价值 | $48.81 | $32.94 | $23.64 |'));
ok('三栏表：终值占比行', inL('| 终值占比 | 88.8% | 81.9% | 74.1% |'));
ok('三栏表：市盈率行', inL('| 按明年利润算的市盈率 | 18.5 倍 | 13.9 倍 | 11.3 倍 |'));
ok('市盈率与每股利润互证（甲）', fx(48.81 / (13.20 / 5), 1) === '18.5');
eq('甲是乙的倍数', fx(va.ps / vb.ps), '2.06'); ok('课文：两倍多', inL('甲算出的每股价值是乙的两倍多'));

// ---------- C 组：敏感度（每动 1 个百分点） ----------
const one = [['r', -0.01, '39.52', '20.0'], ['m', 0.01, '35.93', '9.1'], ['gt', 0.01, '35.44', '7.6'], ['g', 0.01, '33.81', '2.7']];
const base = value(M).ps;
const oneRes = {};
for (const [k, d, want, chg] of one) {
  const x = value({ ...M, [k]: M[k] + d }).ps; oneRes[k] = x;
  eq('只动 ' + k, fx(x), want); eq('只动 ' + k + ' 变化%', pct(x / base - 1), chg);
  ok('课文含 $' + want + ' 与 +' + chg + '%', inL('$' + want + ' | +' + chg + '%'));
}
ok('利润率：价值正比，12/11 − 1 = 9.1%', pct(12 / 11 - 1) === '9.1');
ok('课文：七倍多', inL('七倍多') && (oneRes.r / base - 1) / (oneRes.g / base - 1) > 7 && (oneRes.r / base - 1) / (oneRes.g / base - 1) < 8);
ok('分母 6.5 个百分点缩小约 15%', pct(1 / 6.5, 0) === '15' && inL('分母就缩小了约 15%'));

// 新投资回报率等于折现率
const roicR = [0.05, 0.10].map(g => value({ ...M, g }, { roic: 0.09 }).ps);
eq('ROIC 9%、g 5%', fx(roicR[0]), '25.67'); eq('ROIC 9%、g 10%', fx(roicR[1]), '26.89');
ok('课文含 $25.67 / $26.89', inL('约 $25.67 变到约 $26.89'));


// 增长若不用多投钱（再投资比例固定在中间情景）：g 5% → 10%
function freeGrowth(g) {
  const r = 0.09, gt = 0.025, m = 0.11; let pv = 0;
  for (let t = 1; t <= T; t++) { const np = R0 * (1 + g) ** t * m, gn = t < T ? 0.075 : gt; pv += (np - np * gn / ROIC) / (1 + r) ** t; }
  const np6 = R0 * (1 + g) ** T * (1 + gt) * m; return (pv + np6 * (1 - gt / ROIC) / (r - gt) / (1 + r) ** T) / SHARES;
}
eq('增长免费时多出', fx(freeGrowth(0.10) - freeGrowth(0.05)), '7.17');
eq('计入再投资时多出', fx(value({ ...M, g: 0.10 }).ps - value({ ...M, g: 0.05 }).ps), '4.33');
ok('课文含 $7.17 / $4.33', inL('每股价值会多出约 $7.17；把多投的钱算进去，只多出约 $4.33'));
// 忽略再投资时的终值增长率
const nr = [0.02, 0.03].map(gt => value({ ...M, gt }, { noReinv: true }).ps);
const wr = [0.02, 0.03].map(gt => value({ ...M, gt }).ps);
eq('忽略再投资 gT 2%', fx(nr[0]), '40.47'); eq('忽略再投资 gT 3%', fx(nr[1]), '45.79');
eq('忽略再投资涨幅', pct(nr[1] / nr[0] - 1), '13.2');
eq('计入再投资 gT 2%', fx(wr[0]), '31.95'); eq('计入再投资 gT 3%', fx(wr[1]), '34.08');
eq('计入再投资涨幅', pct(wr[1] / wr[0] - 1), '6.7');
ok('课文含 $40.47 / $45.79 / 13.1%', inL('约 $40.47 跳到约 $45.79，涨 13.2%'));
ok('课文含 $31.95 到 $34.08，涨 6.7%', inL('只从 $31.95 到 $34.08，涨 6.7%'));

// ---------- D 组：龙卷风图（乙值 / 甲值） ----------
const torn = [['r', '折现率（10% / 8%）', '28.12', '39.52', '11.40'], ['m', '税后利润率（10% / 12%）', '29.94', '35.93', '5.99'],
  ['g', '前 5 年增长率（5% / 10%）', '30.85', '35.18', '4.33'], ['gt', '终值增长率（2% / 3%）', '31.95', '34.08', '2.13']];
let sum = 0; let prev = Infinity;
for (const [k, label, lo, hi, d] of torn) {
  const l = value({ ...M, [k]: B[k] }).ps, h = value({ ...M, [k]: A[k] }).ps;
  eq(label + ' 乙端', fx(l), lo); eq(label + ' 甲端', fx(h), hi); eq(label + ' 相差', fx(h - l), d);
  ok('课文表行：' + label, inL('| ' + label + ' | $' + lo + ' | $' + hi + ' | $' + d + ' |'));
  ok('图方案含 ' + label + ' 两端', inF('$' + lo) && inF('$' + hi) && inF('$' + d));
  ok('按相差从大到小排', h - l < prev); prev = h - l; sum += +d;
}
eq('四根横条之和', fx(sum), '23.85'); eq('一起动的相差', fx(va.ps - vb.ps), '25.17');
ok('课文含 $23.85 与 $25.17', inL('$23.85') && inL('$25.17'));
ok('图方案含 $23.85 与 $25.17', inF('$23.85') && inF('$25.17'));

// 甲、乙各自折现率 +1 个百分点
const ar = value({ ...A, r: A.r + 0.01 }).ps, br = value({ ...B, r: B.r + 0.01 }).ps;
eq('甲 r+1', fx(ar), '39.78'); eq('甲跌幅', pct(1 - ar / va.ps), '18.5');
eq('乙 r+1', fx(br), '20.84'); eq('乙跌幅', pct(1 - br / vb.ps), '11.8');
ok('课文含甲乙 r+1', inL('降到约 $39.78，跌 18.5%') && inL('降到约 $20.84，跌 11.8%'));

// ---------- E 组：小题 ----------
eq('小题 1：r 8%', fx(value({ ...M, r: 0.08 }).ps), '39.52'); eq('小题 1：g 10%', fx(value({ ...M, g: 0.10 }).ps), '35.18');
ok('课文小题 1 答案', inL('调低折现率得到约 $39.52；调高增长率只得到约 $35.18'));
eq('小题 2：m 10%', fx(value({ ...M, m: 0.10 }).ps), '29.94'); eq('小题 2：比例法（用未四舍五入的价值）', fx(vm.ps * 10 / 11), '29.94');
ok('课文小题 2 答案', inL('乘以 10 ÷ 11，约 $29.94'));
ok('小题 2 选项 A', inL('$32.94 − $1 = $31.94'));

// ---------- F 组：市场价格 $33 ----------
eq('甲眼里便宜', pct(1 - 33 / va.ps, 0), '32'); // 现价比甲的估值低 32%：「便宜了三成多」
eq('乙眼里贵', pct(33 / vb.ps - 1, 0), '40');   // 现价比乙的估值高 39.6%：「贵了将近四成」
ok('课文：三成多 / 将近四成', inL('现价便宜了三成多') && inL('现价贵了将近四成'));

// ---------- G 组：戴尔判决书中的数 ----------
const cornell = 28.61, hubbard = 12.68, deal = 13.75, court = 17.62, shares = 1765369276;
eq('两位专家之比', fx(cornell / hubbard), '2.26'); ok('课文含 2.26 倍', inL('约 2.26 倍'));
eq('相差 %（以 $12.68 为基数）', pct(cornell / hubbard - 1, 0), '126'); ok('课文含 126%', inL('相差 126%'));
eq('相差金额（十亿美元）', fx((cornell - hubbard) * shares / 1e9, 0), '28'); ok('课文含 280 亿美元', inL('相差约 280 亿美元'));
eq('股数（亿）', fx(shares / 1e8), '17.65'); ok('课文含 17.65 亿股', inL('约有 17.65 亿股'));
eq('法院两套预测平均', fx((16.43 + 18.81) / 2), '17.62'); ok('课文含 $16.43、$18.81、$17.62', inL('$16.43') && inL('$18.81') && inL('**$17.62**'));
eq('法院判定高出合并价', pct(court / deal - 1, 0), '28'); ok('课文：高约 28%', inL('比合并价 $13.75 高约 28%'));
ok('股东专家估值超过合并价两倍', cornell / deal > 2);
ok('课文含税率、增长率、折现率各数', ['21%', '17.8%', '35.8%', '1.35', '1.31', '5.50%', '6.41%', '3.31%', '9.46%', '61.58 亿美元', '10 亿美元'].every(inL));
ok('课文含 78% / 16%', inL('高 78%') && inL('低 16%'));
ok('图方案含戴尔四个数', ['$13.75', '$12.68', '$28.61', '$17.62', '$16.43', '$18.81', '17.65 亿股'].every(inF));

// ---------- H 组：再平衡与基金赎回 ----------
ok('再平衡例子 60% → 80%', inL('股票占自己资产的 60%') && inL('股票涨到了 80%'));
ok('七天', inL('七天以上'));

// ---------- I 组：图 2 全部 625 组 ----------
const G = [0.03, 0.05, 0.075, 0.10, 0.12], Mg = [0.08, 0.10, 0.11, 0.12, 0.14], Rr = [0.07, 0.08, 0.09, 0.10, 0.11], Gt = [0.01, 0.02, 0.025, 0.03, 0.04];
let n = 0, good = 0, maxV = 0, minV = Infinity;
for (const g of G) for (const m of Mg) for (const r of Rr) for (const gt of Gt) {
  const o = value({ g, m, r, gt }); n++;
  const fine = isFinite(o.v) && o.v > 0 && r > gt && o.rows.every(x => x.fcf > 0) && o.share > 0 && o.share < 1;
  if (fine) good++; maxV = Math.max(maxV, o.ps); minV = Math.min(minV, o.ps);
}
eq('图 2 组合数', String(n), '625'); eq('图 2 全部组合有效', String(good), '625');
ok('图方案写 625 种组合', inF('625'));
ok('图 2 按钮取值写在方案里', ['3%、5%、7.5%、10%、12%', '8%、10%、11%、12%、14%', '7%、8%、9%、10%、11%', '1%、2%、2.5%、3%、4%'].every(s => inF(s) && inL(s)));
ok('最高再投资比例 80%', fx(0.12 / 0.15) === '0.80' && inF('最高 80%'));
ok('图方案关键状态', inF('每股 $32.94，公司价值 164.68 亿美元，终值占比 81.9%，市盈率 13.9 倍') &&
  inF('每股 $48.81，244.04 亿美元，88.8%，18.5 倍') && inF('每股 $23.64，118.21 亿美元，74.1%，11.3 倍'));
ok('图方案含小题对应值', inF('$39.52') && inF('$35.18') && inF('$29.94'));
console.log('图 2 每股价值范围：$' + fx(minV) + ' 至 $' + fx(maxV));

// ---------- J 组：边界测试 ----------
ok('g = gT 且两段一致时，等于单段增长永续（扣再投资）', (() => {
  const s = { g: 0.03, m: 0.1, r: 0.09, gt: 0.03 }, o = value(s);
  const np1 = R0 * 1.03 * 0.1, direct = np1 * (1 - 0.03 / ROIC) / (0.09 - 0.03);
  return Math.abs(o.v - direct) < 1e-9;
})());
ok('ROIC = r 且 g = gT 时，价值 = 明年利润 ÷ r', (() => {
  const s = { g: 0.03, m: 0.1, r: 0.09, gt: 0.03 }, o = value(s, { roic: 0.09 });
  return Math.abs(o.v - R0 * 1.03 * 0.1 / 0.09) < 1e-9;
})());
ok('价值与利润率成正比', Math.abs(value({ ...M, m: 0.22 }).v / vm.v - 2) < 1e-12);

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
