// S02-03 数值核验脚本（候选材料，不进入发布目录）
// 运行：node "lessons/S02-03/S02-03 数值核验.js"
// 只调用共享引擎 site/engine/orderbook.js，不修改引擎。所有订单簿都是本课新构造的教学数据，
// 公司“远帆科技”为虚构。恢复例子是本轮用引擎重新构造的，不是原 v4 课文中的数字。
'use strict';
const path = require('path');
const assert = require('assert');
const OB = require(path.join(__dirname, '..', '..', 'site', 'engine', 'orderbook.js'));

const ASKS = [[10002, 200], [10012, 200], [10028, 200], [10045, 200], [10063, 200]];
const BIDS = [[9998, 300], [9990, 400], [9975, 500]];
function book() {
  return OB.create({
    asks: ASKS.map((a, i) => ({ id: 'A' + i, owner: 'S' + i, price: a[0], qty: a[1], time: i })),
    bids: BIDS.map((b, i) => ({ id: 'B' + i, owner: 'P' + i, price: b[0], qty: b[1], time: i })),
    last: { price: 10000, qty: 100 }
  });
}
let seq = 0;
function order(state, side, type, qty, price) {
  const o = { id: 'R' + (++seq), owner: 'reader', side, type, qty };
  if (price != null) o.price = price;
  return OB.submit(state, o);
}
const out = [];
function rec(id, label, value, expect) {
  assert.deepStrictEqual(value, expect, id + ' ' + label);
  out.push(id + '\t' + label + '\t' + JSON.stringify(value));
}
const avg4 = r => +(r.totalCents / r.filledQty / 100).toFixed(4);

// B1 / B2 开场：市价买 1,000 股
let r = order(book(), 'buy', 'market', 1000).report;
rec('B1', '市价买1000 合计(分)', r.totalCents, 10030000);
rec('B1', '平均价', avg4(r), 100.3);
rec('B1', '买完后最新价(分)', r.lastAfter.price, 10063);
rec('B2', '每股: 价差一半 + 冲击 (分)', [10002 - 10000, 10030 - 10002], [2, 28]);

// B3 / B4 订单规模与平均价
const sizes = {};
for (let q = 100; q <= 1000; q += 100) sizes[q] = avg4(order(book(), 'buy', 'market', q).report);
rec('B4', '规模→平均价', sizes, { 100: 100.02, 200: 100.02, 300: 100.0533, 400: 100.07, 500: 100.112, 600: 100.14, 700: 100.1843, 800: 100.2175, 900: 100.2633, 1000: 100.3 });

// B5 市价卖 1,000 股
r = order(book(), 'sell', 'market', 1000).report;
rec('B5', '市价卖1000 合计(分)', r.totalCents, 9987900);
rec('B5', '卖完后最新价(分)', r.lastAfter.price, 9975);

// B6 来回一趟 100 股（两次都从初始订单簿出发）
const buy100 = order(book(), 'buy', 'market', 100).report.totalCents;
const sell100 = order(book(), 'sell', 'market', 100).report.totalCents;
rec('B6', '买100 / 卖100 / 差(分)', [buy100, sell100, buy100 - sell100], [1000200, 999800, 400]);

// B7 限价 $100.10 买 1,000 股
r = order(book(), 'buy', 'limit', 1000, 10010).report;
rec('B7', '限价100.10 成交股数 / 合计(分) / 挂单剩余', [r.filledQty, r.totalCents, r.rested && r.rested.qty], [200, 2000400, 800]);

// B9 恢复（本轮重新构造）：先买 500，订单簿部分恢复后再买 500
// 情形甲：等待期间，卖方新挂出 $100.06 × 200、$100.12 × 200
let s = book();
let first = order(s, 'buy', 'market', 500); s = first.state;
rec('B9', '第一批500 合计(分) / 最新价', [first.report.totalCents, first.report.lastAfter.price], [5005600, 10028]);
let sA = OB.submit(s, { id: 'N1', owner: 'S5', side: 'sell', type: 'limit', price: 10006, qty: 200 }).state;
sA = OB.submit(sA, { id: 'N2', owner: 'S6', side: 'sell', type: 'limit', price: 10012, qty: 200 }).state;
const secondA = order(sA, 'buy', 'market', 500).report;
rec('B9', '甲 第二批500 合计(分)', secondA.totalCents, 5006400);
rec('B9', '甲 两批合计(分) / 平均', [first.report.totalCents + secondA.totalCents, (first.report.totalCents + secondA.totalCents) / 1000 / 100], [10012000, 100.12]);
// 情形乙：没有人补挂，第二批照原订单簿剩下的档位成交
const secondB = order(s, 'buy', 'market', 500).report;
rec('B9', '乙 第二批500 合计(分)', secondB.totalCents, 5024400);
rec('B9', '乙 两批合计(分)', first.report.totalCents + secondB.totalCents, 10030000);
rec('B9', '甲比一次买完少付(分)', 10030000 - (first.report.totalCents + secondA.totalCents), 18000);

// SL1 滑点例子：别人先买走卖一 200 股，小林的 100 股随后到达
let sl = order(book(), 'buy', 'market', 200).state;
const late = order(sl, 'buy', 'market', 100).report;
rec('SL1', '小林100股 合计(分) / 比预期多(分)', [late.totalCents, late.totalCents - 1000200], [1001200, 1000]);

// C1 成本换算：卖出 1,000 股相对中间价的拆分；买卖各 1,000 股的来回成本
rec('C1', '卖1000: 价差一半 / 冲击 (分)', [(10000 - 9998) * 1000, 9998 * 1000 - 9987900], [2000, 10100]);
rec('C1', '买+卖1000 来回成本(分) / 占本金(%)', [10030000 - 9987900, +((10030000 - 9987900) / 10000000 * 100).toFixed(2)], [42100, 0.42]);
rec('C1', '买1000 成本占本金(%)', +((10030000 - 10000000) / 10000000 * 100).toFixed(2), 0.3);

// F1 SEC 第 31 条费用示意：卖出成交额 × 20.60 / 1,000,000（2026-04-04 起适用的费率）
const sale = 9987900; // 分，即 B5 的 $99,879.00
rec('F1', '第31条费用示意(分)', Math.round(sale * 20.60 / 1e6), 206);

// S02-02 场景 6（只复核引用的数字，数据照抄 S02-02 交互方案第 185–186 行）
const thick = OB.create({ asks: [{ id: 'a', owner: 'x', price: 5001, qty: 3000, time: 0 }], bids: [], last: { price: 5000, qty: 100 } });
const thin = OB.create({ asks: [[5005, 100], [5020, 200], [5040, 300], [5080, 400]].map((a, i) => ({ id: 't' + i, owner: 'y' + i, price: a[0], qty: a[1], time: i })), bids: [], last: { price: 5000, qty: 100 } });
const tA = order(thick, 'buy', 'market', 1000).report, tB = order(thin, 'buy', 'market', 1000).report;
rec('B8', '场景6 A/B 合计(分) / B 最新价', [tA.totalCents, tB.totalCents, tB.lastAfter.price], [5001000, 5048500, 5080]);

console.log(out.join('\n'));
console.log('\n全部 ' + out.length + ' 项断言通过');
