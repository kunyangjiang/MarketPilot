// S01-06 数值核验脚本 · 内部文档，不进入发布目录
// 运行：node "lessons/S01-06/S01-06 数值核验.js"
// 无依赖。2026-11-19 课文写作时重写：只覆盖《S01-06 课文 v1 候选》里实际出现的数值关系；
// 研究阶段的储备管理购买合计、EFFR 在区间中的百分位置、SOFR − EFFR、回购认购比例等课文不用的断言已删除。
// 来源：2026-10-28 实施说明（LC01）；2026-09-16 声明与实施说明（LC02、LC03）；FRED EFFR、SOFR、DPRIME、DGS3MO、
// IORB、IOER、RRPONTSYAWARD、DFEDTARU、DFEDTARL（LC18）；NY Fed Markets API（LC10、LC75）；FEDS Notes（LC13）；
// H.4.1 2026-11-11 周三数（R04，与 S01-01 同口径）；S01-05 的两套期限溢价（LC26、LC33）。
// 每个期望值都是手写的独立数字（四舍五入到课文要用的位数），不由被检验的公式生成。
'use strict';
const assert = require('node:assert');

const out = [];
function near(id, label, value, expect, tol) {
  assert.ok(Number.isFinite(value) && Math.abs(value - expect) <= tol,
    id + ' ' + label + ': got ' + value + ', expected ' + expect);
  out.push(id + '\t' + label + '\t' + value.toFixed(6) + ' ≈ ' + expect);
}
function is(id, label, cond) { assert.ok(cond, id + ' ' + label); out.push(id + '\t' + label + '\t成立'); }
const P = 0.005;

// ---------- 一、2026-11-12 的框与框里的成交价（图 1、开场、小题 1、小题 4） ----------
const NOW = { lower: 3.75, upper: 4.00, iorb: 3.90, onrrp: 3.75, srp: 4.00, primary: 4.00, effr: 3.88, bill3m: 4.32, prime: 7.00 };
near('A1', 'ON RRP = 区间下限', NOW.onrrp - NOW.lower, 0.00, P);
near('A1', '常设回购操作利率 = 区间上限', NOW.srp - NOW.upper, 0.00, P);
near('A1', '一级信贷利率 = 区间上限', NOW.primary - NOW.upper, 0.00, P);
near('A1', '区间宽度', NOW.upper - NOW.lower, 0.25, P);
is('A2', 'EFFR 3.88 落在区间内（开场「正好落在区间里」）', NOW.effr >= NOW.lower && NOW.effr <= NOW.upper);
near('A2', 'IORB − EFFR（「低 0.02 个百分点」）', NOW.iorb - NOW.effr, 0.02, P);
near('A3', '3 个月国债 − 区间上限（「高出 0.32 个百分点」）', NOW.bill3m - NOW.upper, 0.32, P);
// 2026-11-19 独立审阅 C1：EFFR 按 360 天年化（H.15 脚注 3），DGS3MO 为 365 天债券等价收益率（LC93、B30），换成 360 天再比
near('A3', '4.32 × 360 ÷ 365（「约是 4.26%」）', NOW.bill3m * 360 / 365, 4.26, P);
near('A3', '换算后仍高于上限约 0.26', NOW.bill3m * 360 / 365 - NOW.upper, 0.26, P);
near('A4', '优惠利率 − 区间上限（观察到的惯例，非规则）', NOW.prime - NOW.upper, 3.00, P);
is('A5', '图 1 刻度 3.70–4.05 容得下全部数值', [NOW.lower, NOW.upper, NOW.iorb, NOW.effr].every(v => v >= 3.70 && v <= 4.05));

// ---------- 二、2026-09-16 → 09-17（图 2） ----------
const D16 = { lower: 3.50, upper: 3.75, iorb: 3.65, onrrp: 3.50, effr: 3.63, sofr: 3.62, prime: 6.75 };
const D17 = { lower: 3.75, upper: 4.00, iorb: 3.90, onrrp: 3.75, effr: 3.88, sofr: 3.85, prime: 7.00 };
const CHG = { lower: 0.25, upper: 0.25, iorb: 0.25, onrrp: 0.25, effr: 0.25, sofr: 0.23, prime: 0.25 };
for (const k of Object.keys(CHG)) near('B1', '9/16 → 9/17 ' + k, D17[k] - D16[k], CHG[k], P);
near('B2', 'EFFR 在框里的位置不变：(EFFR − 下限) 前后之差', (D17.effr - D17.lower) - (D16.effr - D16.lower), 0.00, P);

// ---------- 三、2019 年 9 月（图 3） ----------
const R19 = { upper: 2.25, ioer: 2.10, upperAfter: 2.00, ioerAfter: 1.80 };
const EFFR19 = { '09-13': 2.14, '09-16': 2.25, '09-17': 2.30, '09-18': 2.25, '09-19': 1.90, '09-20': 1.90 };
const SOFR19 = { '09-13': 2.20, '09-16': 2.43, '09-17': 5.25, '09-18': 2.55, '09-19': 1.95, '09-20': 1.86 };
near('C1', '9/17 EFFR 越出上限', EFFR19['09-17'] - R19.upper, 0.05, P);
is('C1', '图 3 中只有 9/17 的 EFFR 高于当日上限', Object.entries(EFFR19).filter(([d, v]) => v > (d >= '09-19' ? R19.upperAfter : R19.upper)).map(([d]) => d).join() === '09-17');
is('C2', 'SOFR 9/17 是一周最高，9/19 起回到新区间上限之下', SOFR19['09-17'] === Math.max(...Object.values(SOFR19)) && SOFR19['09-19'] < R19.upperAfter && SOFR19['09-20'] < R19.upperAfter);
near('C3', '9/19 起 IOER 在上限下方 0.20', R19.upperAfter - R19.ioerAfter, 0.20, P);
near('C3', '区间下调 0.25', R19.upper - R19.upperAfter, 0.25, P);
is('C4', '回购操作：提供 530 亿 ≤ 上限 750 亿', 53 <= 75);

// ---------- 四、长端的简化算术与 S01-05 引用 ----------
near('E1', '只高 1 年、其余 9 年不变：10 年简单平均上升', (0.25 * 1 + 0 * 9) / 10, 0.025, 1e-9);
near('E1', '整整 10 年都高 0.25：简单平均上升', (0.25 * 10) / 10, 0.25, 1e-9);
near('E2', 'ACM 期限溢价四舍五入（S01-05）', Math.round(0.67514217 * 100) / 100, 0.68, 1e-9);
near('E2', 'KW 期限溢价四舍五入（S01-05）', Math.round(0.9656 * 100) / 100, 0.97, 1e-9);

// ---------- 五、准备金与成交量（只陈述，不做比率） ----------
const RES_WED_20261111 = 2969977; // 百万美元，H.4.1 周三数（R04），与 S01-01 相同；FRED WRESBAL 2,960,603 是周均，不用
near('F1', '准备金约 2.97 万亿美元', Math.round(RES_WED_20261111 / 1e4) / 100, 2.97, 1e-9);

// ---------- 六、小题答案 ----------
is('Q', '小题答案：1 B、2 B、3 错、4 C', ['B', 'B', '错', 'C'].join('') === 'BB错C');

console.log(out.join('\n'));
console.log('\n全部 ' + out.length + ' 项断言通过');
