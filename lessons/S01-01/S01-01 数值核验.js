// S01-01 数值核验：课文与图里用到的每一个数字。内部文件，不进入发布目录
// 运行：node "lessons/S01-01/S01-01 数值核验.js"
// 期望值是手写的；计算部分用简单的账户模型独立算一遍，两边对上才算通过
'use strict';
const assert = require('node:assert/strict');

/* ---------- 一、真实数据（来源与日期见核验记录 D1–D6） ---------- */
// H.4.1，2026-11-11（周三）数，百万美元
const H41 = { currencyInCirculation: 2496094, fedNotesNet: 2444177, reserveBalances: 2969977, treasuryCurrency: 53508 };
// H.6，2026 年 9 月，季调，十亿美元
const H6 = { M1: 20061.2, currency: 2397.2, demand: 7219.9, otherLiquid: 10444.1 };

// M1 = 现金 + 活期存款 + 其他流动性存款（H.6 表 2 的口径）
assert.equal(+(H6.currency + H6.demand + H6.otherLiquid).toFixed(1), H6.M1);
// 课文：M1 里现金约占 12%，存款约占 88%
const cashShare = H6.currency / H6.M1;
assert.equal(Math.round(cashShare * 100), 12);
assert.equal(Math.round((1 - cashShare) * 100), 88);
// 课文：流通中的现金约 2.50 万亿美元；其中联储券约 2.44 万亿；准备金约 2.97 万亿
assert.equal(+(H41.currencyInCirculation / 1e6).toFixed(2), 2.50);
assert.equal(+(H41.fedNotesNet / 1e6).toFixed(2), 2.44);
assert.equal(+(H41.reserveBalances / 1e6).toFixed(2), 2.97);
// 流通中的现金与联储券的差额约 520 亿美元：课文只说「一小部分是财政部发行的通货，硬币就在其中」，不给数字，也不说差额主要是硬币
assert.equal(Math.round((H41.currencyInCirculation - H41.fedNotesNet) / 1000), 52);
// 课文：M1 约 20.06 万亿美元，其中现金约 2.40 万亿
assert.equal(+(H6.M1 / 1000).toFixed(2), 20.06);
assert.equal(+(H6.currency / 1000).toFixed(2), 2.40);
// 三种钱的表：存款（活期 + 其他流动性存款）约 17.66 万亿美元
assert.equal(+((H6.demand + H6.otherLiquid) / 1000).toFixed(2), 17.66);

/* ---------- 二、Foley v Hill（1848）的数字 ---------- */
// £6,117 10s = £6,117.5；年息 3%
const foley = 6117 + 10 / 20;
assert.equal(foley, 6117.5);
assert.equal(+(foley * 0.03).toFixed(3), 183.525); // 课文：每年约 183 英镑利息
// 1829 年 4 月转入，1838 年 1 月起诉，1848 年 8 月上议院判决
assert.equal(1838 - 1829, 9);
assert.equal(1848 - 1838, 10);

/* ---------- 三、账户模型：小林、河岸银行、松石银行、联储（美元） ---------- */
// 每个主体是 {资产: {...}, 负债: {...}}；权益（小林为净资产，银行为股东权益）放进负债一侧，保证两边相等
function book() {
  return {
    xiaolin: { a: { cash: 0, depositRiver: 500 }, l: { equity: 500 } },
    employer: { a: { depositRiver: 50000 }, l: { equity: 50000 } },
    landlord: { a: { depositPine: 0 }, l: { equity: 0 } },
    river: { a: { reserves: 120e6, vaultCash: 10e6, securities: 270e6, loans: 600e6 }, l: { deposits: 900e6, equity: 100e6 } },
    pine: { a: { reserves: 80e6, vaultCash: 6e6, securities: 150e6, loans: 364e6 }, l: { deposits: 540e6, equity: 60e6 } },
    fed: { a: { securitiesEtc: 0 }, l: { notes: 0, reservesRiver: 120e6, reservesPine: 80e6 } }
  };
}
const sum = o => Object.values(o).reduce((x, y) => x + y, 0);
const balanced = b => { for (const k of Object.keys(b)) if (k !== 'fed') assert.equal(sum(b[k].a), sum(b[k].l), k + ' 不平'); };
const B = book();
B.fed.a.securitiesEtc = sum(B.fed.l); // 联储资产一侧在这里只记一个合计
balanced(B);
assert.equal(sum(B.river.a), 1000e6); // 图 3：河岸银行总资产 10 亿美元
assert.equal(sum(B.pine.a), 600e6);

// 第 1 步：同行发工资 $3,200（雇主也在河岸银行开户）：只动存款，不动准备金
B.employer.a.depositRiver -= 3200; B.employer.l.equity -= 3200;
B.xiaolin.a.depositRiver += 3200; B.xiaolin.l.equity += 3200;
// 河岸银行：存款总额不变（从雇主名下移到小林名下）
balanced(B);
assert.equal(B.xiaolin.a.depositRiver, 3700);
assert.equal(B.river.a.reserves, 120e6);

// 第 2 步：取现 $200：小林的存款 −200、现金 +200；河岸银行的存款 −200、库存现金 −200
B.xiaolin.a.depositRiver -= 200; B.xiaolin.a.cash += 200;
B.river.l.deposits -= 200; B.river.a.vaultCash -= 200;
balanced(B);
assert.equal(B.xiaolin.a.depositRiver, 3500);
assert.equal(B.xiaolin.a.cash, 200);
assert.equal(sum(B.xiaolin.a), 3700); // 取现前后小林的资产总额不变，只是换了形式
assert.equal(sum(B.river.a), 1000e6 - 200); // 银行的资产负债表两边同时缩小 200

// 第 3 步：跨行付房租 $1,500 给松石银行的房东
B.xiaolin.a.depositRiver -= 1500; B.xiaolin.l.equity -= 1500;
B.landlord.a.depositPine += 1500; B.landlord.l.equity += 1500;
B.river.l.deposits -= 1500; B.river.a.reserves -= 1500;
B.pine.l.deposits += 1500; B.pine.a.reserves += 1500;
B.fed.l.reservesRiver -= 1500; B.fed.l.reservesPine += 1500;
balanced(B);
assert.equal(B.xiaolin.a.depositRiver, 2000);
assert.equal(B.river.a.reserves, 120e6 - 1500);
assert.equal(B.pine.a.reserves, 80e6 + 1500);
// 联储的准备金总额不变：只是从河岸名下移到松石名下
assert.equal(B.fed.l.reservesRiver + B.fed.l.reservesPine, 200e6);
// 联储账上的准备金 = 两家银行账上的准备金（同一笔钱，两边各记一次）
assert.equal(B.fed.l.reservesRiver, B.river.a.reserves);
assert.equal(B.fed.l.reservesPine, B.pine.a.reserves);

// 第 4 步：河岸银行用准备金向联储换 $50,000 现钞补充金库
B.river.a.reserves -= 50000; B.river.a.vaultCash += 50000;
B.fed.l.reservesRiver -= 50000; B.fed.l.notes += 50000;
balanced(B);
assert.equal(sum(B.river.a), 1000e6 - 200 - 1500); // 河岸银行总资产不变，只是准备金换成了现金
assert.equal(sum(B.fed.l), 200e6); // 联储总负债不变：准备金少 50,000，联储券多 50,000
assert.equal(B.river.a.vaultCash, 10e6 - 200 + 50000);

/* ---------- 四、图 3：一家银行的资产里有多少是现金和准备金 ---------- */
const R0 = book().river;
assert.equal((R0.a.reserves + R0.a.vaultCash) / sum(R0.a), 0.13); // 13%
assert.equal(R0.l.deposits / sum(R0.a), 0.9);   // 存款占负债和权益的 90%
assert.equal(R0.l.equity / sum(R0.a), 0.1);     // 股东权益 10%
// 如果存款人同一天要取走 20%（1.8 亿），现金加准备金 1.3 亿不够：课文只用这一句预告 S09-01，不展开
assert.ok(0.2 * R0.l.deposits > R0.a.reserves + R0.a.vaultCash);
assert.equal(0.2 * R0.l.deposits, 180e6);

/* ---------- 五、存款保险 ---------- */
const FDIC = 250000, CN = 500000;
const insured = (bal, cap) => Math.min(bal, cap);
assert.equal(insured(300000, FDIC), 250000);       // 小题：一家银行、一个个人账户 $300,000
assert.equal(300000 - insured(300000, FDIC), 50000);
assert.equal(insured(2000, FDIC), 2000);
assert.equal(insured(600000, CN), 500000);         // 中国对照：同一存款人在同一家投保机构，本息合计 60 万元
assert.equal(600000 - insured(600000, CN), 100000);

console.log('S01-01 数值核验：全部通过');
