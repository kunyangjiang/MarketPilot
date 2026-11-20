// S04-04 数值核验（生产阶段）：node "lessons/S04-04/S04-04 数值核验.js"
// 读取《S04-04 课文 v1 候选.md》与《S04-04 图与交互方案 v1 候选.md》，
// 对课文与图中出现的每个关键数字：先重算，再断言它确实以课文里的写法出现。
// 不依赖网络与临时目录。Delta Apparel 的报表数字（千美元）以常量写在下面，出处见《S04-04 来源登记与证据核验表》。
'use strict';
const fs = require('fs');
const path = require('path');

const LESSON = fs.readFileSync(path.join(__dirname, 'S04-04 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const FIG = fs.readFileSync(path.join(__dirname, 'S04-04 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');

let pass = 0, fail = 0;
function ok(id, cond, msg) { if (cond) pass++; else { fail++; console.log('失败 ' + id + '：' + msg); } }
function inL(id, s) { ok(id + ' 课文出现', LESSON.includes(s), `课文里没有「${s}」`); }
function inF(id, s) { ok(id + ' 图方案出现', FIG.includes(s), `图方案里没有「${s}」`); }
function eq(id, got, want) { ok(id + ' 重算', Math.abs(got - want) < 1e-9, `重算 ${got}，应为 ${want}`); }
// 千美元 → 万美元，四舍五入到整数（与课文口径一致）
const wan = k => Math.round(Math.abs(k) / 10) * Math.sign(k);
const fmt = n => Math.abs(n).toLocaleString('en-US');
// 重算后断言课文里出现「x 万」的写法
function wanL(id, k, want, opts = {}) {
  eq(id, wan(k), want);
  const s = opts.text || (fmt(want) + ' 万');
  inL(id, s);
  if (opts.fig) inF(id, opts.figText || fmt(want));
}

// ---------- A. 假设的小批发商（教学假设） ----------
const OWNER = 120000, VAN = 30000, LIFE = 5, PURCH = 200000, COGS = 160000, SALES = 240000, AR = 60000, OPEX = 50000;
const DEP = VAN / LIFE;
const INV = PURCH - COGS;
const NI = SALES - COGS - OPEX - DEP;
const COLLECT = SALES - AR;
const OCF_direct = COLLECT - PURCH - OPEX;
const OCF_indirect = NI + DEP - AR - INV;
const CASH_END = OWNER - VAN + OCF_direct;
eq('A1 折旧', DEP, 6000); inL('A1', '$6,000'); inF('A1', '$6,000');
eq('A2 年底存货', INV, 40000); inL('A2', '$40,000');
eq('A3 净利润', NI, 24000); inL('A3', '**$24,000**'); inF('A3', '$24,000');
eq('A4 收回货款', COLLECT, 180000); inL('A4', '$180,000');
eq('A5 直接法经营现金流', OCF_direct, -70000); inL('A5', '−$70,000'); inF('A5', '−$70,000');
eq('A6 间接法 = 直接法', OCF_indirect, OCF_direct);
eq('A7 年末现金', CASH_END, 20000); inL('A7', '年末现金 $20,000'); inF('A7', '年末现金 $20,000');
eq('A8 现金少了', OWNER - CASH_END, 100000); inL('A8', '少了 $100,000');
const VAN_NET = VAN - DEP; eq('A9 车净值', VAN_NET, 24000); inL('A9', '送货车净值 $24,000');
const ASSETS = CASH_END + AR + INV + VAN_NET; eq('A10 资产合计', ASSETS, 144000);
eq('A11 权益 = 投入 + 利润', OWNER + NI, ASSETS);
inL('A10', '$20,000 + $60,000 + $40,000 + $24,000 = $144,000'); inF('A10', '$144,000');
// 分步累计
eq('A12 第 2 步累计', NI + DEP, 30000); inF('A12', '累计 $30,000'); inL('A12', '累计 $30,000');
eq('A13 第 3 步累计', NI + DEP - AR, -30000); inL('A13', '累计 −$30,000'); inF('A13', '累计 −$30,000');
eq('A14 第 4 步累计', NI + DEP - AR - INV, -70000); inL('A14', '累计 −$70,000');
// 滑块读数
const ocf = (ar, inv) => NI + DEP - ar - inv;
const cash = (ar, inv) => OWNER - VAN + ocf(ar, inv);
eq('A15 应收 0 时经营现金流', ocf(0, INV), -10000); inL('A15', '经营现金流就是 −$10,000');
eq('A16 应收 0 时年末现金', cash(0, INV), 80000); inL('A16', '年底现金 $80,000');
eq('A17 应收 10 万时经营现金流', ocf(100000, INV), -110000); inL('A17', '−$110,000');
eq('A18 应收 10 万时年末现金', cash(100000, INV), -20000); inL('A18', '年底现金是 −$20,000');
inF('A15-18 图方案读数', '应收 $100,000 → 经营现金流 −$110,000、年末现金 −$20,000');
eq('A19 年末现金公式常数', OWNER - VAN, 90000); inF('A19', '90,000 + 经营现金流');
// 小题 2
eq('A20 小题 2', ocf(20000, INV), -30000); inL('A20', '$24,000 + $6,000 − $20,000 − $40,000 = −$30,000');
// 进货 = 销售成本 + 年底存货
eq('A21 进货', COGS + INV, PURCH);

// ---------- B. Delta Apparel 2022 财年 10-K（S0404-R01），千美元 ----------
const D22 = {
  sales: 484859, sales21: 436750, cogs: 376016, gross: 108843, sga: 79455, otherInc: 2393, opInc: 31781,
  interest: 7732, pretax: 24049, tax: 4307, niCons: 19742, niAttr: 19740, eps: 2.84, epsDil: 2.80,
  wShares: 6953, wDil: 7047,
  dep: 12636, amort: 2396, defFin: 336, defTax: 2988, mktRes: 1804, stock: 2913, lossDisp: 354, earnout: -1897, otherNet: -848,
  ar: -1438, inv: -88639, prepaid: 1593, otherNC: 624, ap: 30435, accrued: -415, lease: 342, taxes: -1992, otherLiab: -1049,
  ocf: -20115, capexCash: 12378, invest: -13052, debtIn: 542613, debtOut: -504851, fin: 24091,
  cash0: 9376, cash1: 300, inv0: 161703, inv1: 248538, ltd0: 101680, ltd1: 136750, re0: 146860, re1: 166600,
  capexMDA: 19.9, leaseFin: 10.4, unpaid: 1.0,
};
// 利润表的楼梯
eq('B1 毛利', D22.sales - D22.cogs, D22.gross);
eq('B2 营业利润', D22.gross - D22.sga + D22.otherInc, D22.opInc);
eq('B3 税前', D22.opInc - D22.interest, D22.pretax);
eq('B4 净利润', D22.pretax - D22.tax, D22.niCons);
inL('B5 净销售额', '4.85 亿'); eq('B5', Math.round(D22.sales / 1e3) / 100, 4.85);
inL('B6 成本', '3.76 亿'); eq('B6', Math.round(D22.cogs / 1e3) / 100, 3.76);
inL('B7 毛利', '1.09 亿'); eq('B7', Math.round(D22.gross / 1e3) / 100, 1.09);
wanL('B8 营业利润', D22.opInc, 3178);
wanL('B9 利息', D22.interest, 773);
wanL('B10 税前', D22.pretax, 2405);
wanL('B11 所得税', D22.tax, 431);
wanL('B12 净利润（合并与归属均为 1,974 万）', D22.niCons, 1974, { fig: true });
eq('B12b 归属于股东', wan(D22.niAttr), 1974);
eq('B13 销售增长 11%', Math.round((D22.sales / D22.sales21 - 1) * 100), 11); inL('B13', '增长 11%');
// 每股收益
eq('B14 基本每股收益', Math.round(D22.niAttr / D22.wShares * 100) / 100, D22.eps); inL('B14', '每股 $2.84');
eq('B15 稀释后', Math.round(D22.niAttr / D22.wDil * 100) / 100, D22.epsDil); inL('B15', '$2.80');
eq('B16 加权股数（万股）', D22.wShares / 10, 695.3); inL('B16', '695.3 万股');
// 留存收益：净利润进入股东权益（当年未派股息）
eq('B17 留存收益衔接', D22.re0 + D22.niAttr, D22.re1);

// ---------- C. 图 3：经营现金流的归并 ----------
const DA = D22.dep + D22.amort;
const otherNC = D22.defFin + D22.defTax + D22.mktRes + D22.stock + D22.lossDisp + D22.earnout + D22.otherNet;
const otherWC = D22.prepaid + D22.otherNC + D22.accrued + D22.lease + D22.taxes + D22.otherLiab;
eq('C1 折旧摊销', DA, 15032); wanL('C1', DA, 1503, { fig: true });
eq('C2 其他非现金', otherNC, 5650); wanL('C2', otherNC, 565, { fig: true });
wanL('C3 存货', D22.inv, -8864, { fig: true });
wanL('C4 应付账款', D22.ap, 3044, { fig: true });
wanL('C5 应收账款', D22.ar, -144, { text: '−144 万', fig: true });
eq('C6 其他营运', otherWC, -897); wanL('C6', otherWC, -90, { text: '−90 万', fig: true });
const sumK = D22.niCons + DA + otherNC + D22.inv + D22.ap + D22.ar + otherWC;
eq('C7 千美元合计 = 经营现金流', sumK, D22.ocf);
const sumW = wan(D22.niCons) + wan(DA) + wan(otherNC) + wan(D22.inv) + wan(D22.ap) + wan(D22.ar) + wan(otherWC);
eq('C8 万美元七项相加', sumW, -2012); eq('C8b 经营现金流四舍五入', wan(D22.ocf), -2012);
inL('C8', '2,012 万'); inF('C8', '−2,012 万');
ok('C9 存货占用约为利润四倍多', D22.inv / -D22.niCons > 4 && D22.inv / -D22.niCons < 5 || -D22.inv / D22.niCons > 4 && -D22.inv / D22.niCons < 5, '倍数 ' + (-D22.inv / D22.niCons).toFixed(2));
inL('C9', '四倍多');
eq('C10 存货变动差额 = 准备金计提', -D22.inv - (D22.inv1 - D22.inv0), D22.mktRes); inF('C10', '86,835');
inL('C11 存货期初', '1.62 亿'); eq('C11', Math.round(D22.inv0 / 1e3) / 100, 1.62);
inL('C12 存货期末', '2.49 亿'); eq('C12', Math.round(D22.inv1 / 1e3) / 100, 2.49);

// ---------- D. 投资、融资与现金 ----------
wanL('D1 现金期初', D22.cash0, 938);
wanL('D2 现金期末', D22.cash1, 30, { text: '只剩 30 万' });
eq('D3 现金减少 900 多万', wan(D22.cash0 - D22.cash1), 908); inL('D3', '少了 900 多万');
wanL('D4 购买设备付现', D22.capexCash, 1238);
wanL('D5 投资活动', D22.invest, -1305, { text: '1,305 万' });
eq('D6 经营 + 投资流出', wan(-(D22.ocf + D22.invest)), 3317); inL('D6', '3,317 万');
eq('D7 净借入', wan(D22.debtIn + D22.debtOut), 3776); inL('D7', '3,776 万');
wanL('D8 融资活动', D22.fin, 2409);
eq('D9 现金衔接（千美元）', D22.cash0 + D22.ocf + D22.invest + D22.fin, D22.cash1);
eq('D10 现金衔接（万美元，课文那句）', 938 - 2012 - 1305 + 2409, 30);
inL('D11 资本开支口径', '1,990 万'); eq('D11', D22.capexMDA * 100, 1990);
inL('D12', '1,040 万'); eq('D12', D22.leaseFin * 100, 1040);
inL('D13', '100 万到年底还没付款');
inL('D14 长期借款', '约 1.02 亿增加到约 1.37 亿');
eq('D14', Math.round(D22.ltd0 / 1e3) / 100, 1.02); eq('D14b', Math.round(D22.ltd1 / 1e3) / 100, 1.37);

// ---------- E. 2023 财年 10-K（S0404-R02）、2024 年 10-Q（R03）与 8-K（R04、R05） ----------
const D23 = { sales: 415351, niAttr: -33213, gw: 9200, interest: 14194, ocf: 11217, inv: 38079, ar0: 68215, ar1: 45130, cash1: 187, fin: -12957 };
eq('E1 销售额', Math.round(D23.sales / 1e3) / 100, 4.15); inL('E1', '4.15 亿');
eq('E2 下降 14.3%', Math.round((1 - D23.sales / D22.sales) * 1000) / 10, 14.3); inL('E2', '14.3%');
wanL('E3 净亏损', D23.niAttr, -3321, { text: '3,321 万' });
wanL('E4 商誉减值', D23.gw, 920);
wanL('E5 利息', D23.interest, 1419);
wanL('E6 经营现金流', D23.ocf, 1122);
wanL('E7 存货释放', D23.inv, 3808);
wanL('E8 应收期初', D23.ar0, 6822); wanL('E9 应收期末', D23.ar1, 4513);
wanL('E10 现金期末', D23.cash1, 19, { text: '只有 19 万' });
wanL('E11 融资活动', D23.fin, -1296, { text: '1,296 万' });
// 10-Q：2024 年 3 月 30 日
inL('E12 循环贷款余额', '9,580 万'); eq('E12', 95.8 * 100, 9580);
inL('E13 平均利率', '9.1%');
inL('E14 现金加额度', '1,180 万'); eq('E14', 11.8 * 100, 1180);
// 8-K：2024-09-24
inL('E15 Salt Life', '3,594 万'); eq('E15', Math.round(35.94 * 100), 3594);
inL('E16 Soffe', '1,530 万'); eq('E16', 15.3 * 100, 1530);
// 时间
inL('E17 申请日', '2024 年 6 月 30 日'); inL('E18 年报日', '2022 年 11 月 21 日');
const months = (new Date('2024-06-30') - new Date('2022-11-21')) / (1000 * 3600 * 24 * 30.44);
ok('E19 「一年半多」', months > 18 && months < 24, '相隔 ' + months.toFixed(1) + ' 个月'); inL('E19', '一年半多以后');
const weeks = (new Date('2024-06-30') - new Date('2024-05-09')) / (1000 * 3600 * 24 * 7);
ok('E20 季报到申请「不到两个月」', weeks < 8.7, '相隔 ' + weeks.toFixed(1) + ' 周'); inL('E20', '不到两个月后');

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
