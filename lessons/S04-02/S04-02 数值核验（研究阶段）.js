// S04-02 数值核验（研究阶段）
// 用法：node "lessons/S04-02/S04-02 数值核验（研究阶段）.js" <原始数据目录>
// 原始数据目录里应有（下载方法见《S04-02 来源登记与证据核验表》）：
//   par_1990.csv … par_2026.csv   财政部 Daily Treasury Par Yield Curve Rates（每年一个 CSV）
//   real_2021.csv、real_2023.csv、real_2026.csv   财政部 Daily Treasury Par Real Yield Curve Rates
//   acm_daily.csv   纽约联储 ACMTermPremium.xls 的「ACM Daily」工作表另存为 CSV（日期格式 14-Jun-1961）
//   feds200533.csv  联储理事会 Kim–Wright 数据文件
//   nyf_yield.csv   纽约联储「The Yield Curve as a Leading Indicator」页面所用数据（assets/data/yield.csv）
// 作用：从原始日数据重算课文用到的全部官方数据派生数，并生成
//   《S04-02 财政部收益率月平均 1990-2026.csv》（生产阶段脚本据此复算图 4，不再需要原始日数据）
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = process.argv[2];
if (!DIR) { console.log('请给出原始数据目录'); process.exit(1); }
let pass = 0, fail = 0;
const ok = (id, c, m) => { if (c) pass++; else { fail++; console.log('失败 ' + id + '：' + m); } };
const r2 = x => Math.round(x * 100 + 1e-9) / 100;

function load(prefix, years) {
  const rows = [];
  for (const y of years) {
    const t = fs.readFileSync(path.join(DIR, prefix + y + '.csv'), 'utf8').trim().split(/\r?\n/);
    const h = t[0].split(',').map(s => s.replace(/"/g, ''));
    for (const l of t.slice(1)) {
      const v = l.split(','); const [m, d, yy] = v[0].split('/');
      const o = { date: `${yy}-${m}-${d}` };
      h.slice(1).forEach((k, i) => { o[k] = v[i + 1] === '' || v[i + 1] === undefined ? null : +v[i + 1]; });
      rows.push(o);
    }
  }
  return rows.sort((a, b) => (a.date < b.date ? -1 : 1));
}
const years = []; for (let y = 1990; y <= 2026; y++) years.push(y);
const P = load('par_', years);
const byDate = Object.fromEntries(P.map(r => [r.date, r]));

// A. 三天的曲线（图 2）
const MAT = ['3 Mo', '6 Mo', '1 Yr', '2 Yr', '3 Yr', '5 Yr', '7 Yr', '10 Yr', '20 Yr', '30 Yr'];
const CURVES = {
  '2021-12-31': [0.06, 0.19, 0.39, 0.73, 0.97, 1.26, 1.44, 1.52, 1.94, 1.90],
  '2023-05-04': [5.26, 5.04, 4.59, 3.75, 3.47, 3.29, 3.32, 3.37, 3.80, 3.73],
  '2026-11-12': [4.32, 4.42, 4.65, 4.86, 4.90, 4.95, 5.02, 5.10, 5.48, 5.43],
};
for (const [d, vals] of Object.entries(CURVES)) MAT.forEach((m, i) => ok('A ' + d + ' ' + m, byDate[d][m] === vals[i], `数据 ${byDate[d][m]}，常量 ${vals[i]}`));
ok('A 2022-10-25 3 个月', byDate['2022-10-25']['3 Mo'] === 4.14, '');
ok('A 2022-10-25 10 年', byDate['2022-10-25']['10 Yr'] === 4.10, '');

// B. 连续倒挂的交易日
const sp = P.filter(r => r['10 Yr'] != null && r['3 Mo'] != null).map(r => ({ date: r.date, s: r2(r['10 Yr'] - r['3 Mo']) }));
let runs = [], cur = null;
for (const r of sp) { if (r.s < 0) { if (!cur) cur = { start: r.date, end: r.date, n: 0, min: r.s, mind: r.date }; cur.end = r.date; cur.n++; if (r.s < cur.min) { cur.min = r.s; cur.mind = r.date; } } else if (cur) { runs.push(cur); cur = null; } }
if (cur) runs.push(cur);
const big = runs.find(x => x.start === '2022-10-25');
ok('B 连续倒挂起止', big && big.end === '2024-12-12', JSON.stringify(big));
ok('B 534 个交易日', big && big.n === 534, big && big.n);
ok('B 最深一天', big && big.mind === '2023-05-04' && big.min === -1.89, big && big.mind + ' ' + big.min);
const prev = sp[sp.findIndex(x => x.date === '2022-10-25') - 1];
ok('B 10-25 前一交易日不倒挂', prev.s >= 0, JSON.stringify(prev));

// C. 月平均（图 4），并写出月平均 CSV
const mon = {};
for (const r of P) { if (r['10 Yr'] == null || r['3 Mo'] == null) continue; const k = r.date.slice(0, 7); (mon[k] = mon[k] || { n: 0, a: 0, b: 0 }); mon[k].n++; mon[k].a += r['10 Yr']; mon[k].b += r['3 Mo']; }
const M = Object.keys(mon).sort().map(k => ({ m: k, n: mon[k].n, y10: mon[k].a / mon[k].n, y3: mon[k].b / mon[k].n }));
const out = ['月份,10年期月平均,3个月期月平均,交易日数'].concat(M.map(r => `${r.m},${r.y10.toFixed(6)},${r.y3.toFixed(6)},${r.n}`));
fs.writeFileSync(path.join(__dirname, 'S04-02 财政部收益率月平均 1990-2026.csv'), out.join('\n') + '\n');
ok('C 月份数', M[0].m === '1990-01' && M[M.length - 1].m === '2026-11', M[0].m + '…' + M[M.length - 1].m);

// D. 实际收益率（通胀补偿表）
const R = load('real_', [2021, 2023, 2026]); const rb = Object.fromEntries(R.map(r => [r.date, r]));
const REAL = { '2021-12-31': [-1.61, -1.04], '2023-05-04': [1.16, 1.18], '2026-11-12': [2.64, 2.86] };
for (const [d, [r5, r10]] of Object.entries(REAL)) { ok('D ' + d + ' 实际 5 年', rb[d]['5 YR'] === r5, rb[d]['5 YR']); ok('D ' + d + ' 实际 10 年', rb[d]['10 YR'] === r10, rb[d]['10 YR']); }

// E. ACM 与 Kim–Wright
const mon3 = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const A = {};
{ const t = fs.readFileSync(path.join(DIR, 'acm_daily.csv'), 'utf8').trim().split(/\r?\n/); const h = t[0].split(',');
  for (const l of t.slice(1)) { const v = l.split(','); const [d, m, y] = v[0].split('-'); const k = `${y}-${mon3[m]}-${d.padStart(2, '0')}`; A[k] = {}; h.forEach((x, i) => (A[k][x] = +v[i])); } }
const K = {};
{ const t = fs.readFileSync(path.join(DIR, 'feds200533.csv'), 'utf8').trim().split(/\r?\n/); const i0 = t.findIndex(l => l.startsWith('Date,')); const h = t[i0].split(',');
  for (const l of t.slice(i0 + 1)) { const v = l.split(','); K[v[0]] = {}; h.forEach((x, i) => (K[v[0]][x] = v[i] === 'NA' ? null : +v[i])); } }
const TP = { // 日期：[ACM 拟合, ACM 预期, ACM 溢价, KW 拟合, KW 预期, KW 溢价]（课文图 3）
  '2021-12-31': [1.59, 2.26, -0.68, 1.67, 1.73, -0.06],
  '2023-05-04': [3.40, 3.99, -0.60, 3.37, 3.53, -0.16],
  '2026-11-12': [5.07, 4.39, 0.68, 5.10, 4.13, 0.97],
};
for (const [d, v] of Object.entries(TP)) {
  const a = A[d], k = K[d];
  ok('E ' + d + ' ACM', r2(a.ACMY10) === v[0] && r2(a.ACMRNY10) === v[1] && r2(a.ACMTP10) === v[2], [a.ACMY10, a.ACMRNY10, a.ACMTP10].join(' '));
  const ky = k['THREEFY1000.B'], kt = k['THREEFYTP1000.B'];
  ok('E ' + d + ' KW', r2(ky) === v[3] && r2(ky - kt) === v[4] && r2(kt) === v[5], [ky, kt].join(' '));
}
ok('E 2022-10-25 ACM −0.35', r2(A['2022-10-25'].ACMTP10) === -0.35, A['2022-10-25'].ACMTP10);
ok('E 2022-10-25 KW +0.54', r2(K['2022-10-25']['THREEFYTP1000.B']) === 0.54, K['2022-10-25']['THREEFYTP1000.B']);
function avg(o, f, from, to) { let s = 0, n = 0; for (const d in o) if (d >= from && d <= to) { const x = f(o[d]); if (x != null && !isNaN(x)) { s += x; n++; } } return s / n; }
ok('E ACM 倒挂期平均 −0.32', r2(avg(A, r => r.ACMTP10, '2022-11-01', '2024-11-30')) === -0.32, avg(A, r => r.ACMTP10, '2022-11-01', '2024-11-30'));
ok('E KW 倒挂期平均 +0.24', r2(avg(K, r => r['THREEFYTP1000.B'], '2022-11-01', '2024-11-30')) === 0.24, avg(K, r => r['THREEFYTP1000.B'], '2022-11-01', '2024-11-30'));

// F. 纽约联储模型的概率（参数见 Prob_Rec.pdf：α = −0.5333，β = −0.6330）
const Phi = x => { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const dd = 0.3989423 * Math.exp(-x * x / 2); const p = dd * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };
const NY = fs.readFileSync(path.join(DIR, 'nyf_yield.csv'), 'utf8').trim().split(/\r?\n/).map(l => l.split(','));
const row = d => NY.find(r => r[0] === d);
ok('F 2023-05 利差 −1.71', +row('5/31/2023')[4] === -1.71, row('5/31/2023'));
ok('F 2024-05 概率 70.85%', row('5/31/2024')[5] === '70.85%', row('5/31/2024'));
ok('F 重算约 71%', Math.round(Phi(-0.5333 - 0.6330 * -1.71) * 100) === 71, Phi(-0.5333 - 0.6330 * -1.71));
ok('F 2026-10 利差 0.98', +row('10/31/2026')[4] === 0.98, row('10/31/2026'));
ok('F 2027-10 概率约 12%', Math.round(Phi(-0.5333 - 0.6330 * 0.98128) * 100) === 12, Phi(-0.5333 - 0.6330 * 0.98128));
ok('F NBER 列 2020-05 以后全为 0', NY.filter(r => /\/(202[0-6])$/.test(r[0]) && r[6] !== '' && r[6] !== undefined).filter(r => { const [m, , y] = r[0].split('/'); return (+y > 2020 || (+y === 2020 && +m >= 5)) && r[6] !== '0'; }).length === 0, '');

console.log(`研究阶段：通过 ${pass}，失败 ${fail}`);
process.exit(fail ? 1 : 0);
