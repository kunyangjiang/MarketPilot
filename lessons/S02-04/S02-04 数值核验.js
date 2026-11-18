// S02-04 数值核验脚本（候选材料，不进入发布目录）
// 运行：node "lessons/S02-04/S02-04 数值核验.js"
// 本课不需要撮合引擎，全部为算术。小林 600 股的逐档成交照抄 S02-02 v5 课文图 3 的表格。
'use strict';
const path = require('path');
const assert = require('assert');
const out = [];
function rec(id, label, value, expect) { assert.deepStrictEqual(value, expect, id + ' ' + label); out.push(id + '\t' + label + '\t' + JSON.stringify(value)); }

// N1 小林 600 股：S02-02 v5 课文图 3（第 168–178 行）：B 200@$50.02；C 100、G 200@$50.03；D 100@$50.04
const fills = [[5002, 200], [5003, 300], [5004, 100]];
const total = fills.reduce((a, [p, q]) => a + p * q, 0);
rec('N1', '小林 600 股合计(分)', [fills.reduce((a, f) => a + f[1], 0), total], [600, 3001700]);

// N6 净额轧差（虚构）
const trades = [{ who: '小林', side: +1, qty: 600, cents: 3001700 }, { who: '客户二', side: -1, qty: 1000, cents: 5005000 }, { who: '客户三', side: +1, qty: 300, cents: 1501200 }];
const netQty = trades.reduce((a, t) => a + t.side * t.qty, 0);
const netCash = trades.reduce((a, t) => a - t.side * t.cents, 0);
rec('N6', '净股数 / 净金额(分)', [netQty, netCash], [-100, 502100]);
rec('N6', '不轧差时：收进股 / 交出股 / 付出(分) / 收进(分)', [900, 1000, 3001700 + 1501200, 5005000], [900, 1000, 4502900, 5005000]);

// CCP 连线数：双边 n(n-1)/2 对，中央对手方 n 条
const pairs = n => n * (n - 1) / 2;
rec('CCP', '双边对数 4/10/100', [pairs(4), pairs(10), pairs(100)], [6, 45, 4950]);

// N7 结算日：周四→周五；周五→下周一（不考虑假日）
function tPlus1(d) { const x = new Date(d); do { x.setUTCDate(x.getUTCDate() + 1); } while ([0, 6].includes(x.getUTCDay())); return x.toISOString().slice(0, 10); }
rec('N7', '2026-11-19(周四)→ / 2026-11-20(周五)→', [tPlus1('2026-11-19'), tPlus1('2026-11-20')], ['2026-11-20', '2026-11-23']);

// N2–N4 SEC 2021 报告第 31 页（静态卡数字，单位：亿美元）
rec('N2', '追缴合计 = 重估 + 特别收费', 21 + 48, 69);

console.log(out.join('\n'));
console.log('\n全部 ' + out.length + ' 项断言通过');
