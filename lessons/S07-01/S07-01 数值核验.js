// S07-01 数值核验：重算课文与图方案里的每个关键数字，并断言它们确实出现在文件里。
// 运行：node "S07-01 数值核验.js"（在 lessons/S07-01 目录或任意目录下均可）。不依赖网络。
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r/g, '');
const lesson = read('S07-01 课文 v1 候选.md');
const figs = read('S07-01 图与交互方案 v1 候选.md');

let pass = 0, fail = 0;
function ok(name, cond, note) {
  if (cond) pass++; else { fail++; console.log('失败：' + name + (note ? '（' + note + '）' : '')); }
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const fmt = n => Math.abs(n).toLocaleString('en-US');
const inL = (s, name) => ok('课文含「' + s + '」' + (name ? '：' + name : ''), lesson.includes(s));
const inF = (s, name) => ok('图方案含「' + s + '」' + (name ? '：' + name : ''), figs.includes(s));
const money = x => '$' + x.toFixed(2);

// ---------- 一、规则（全部为本课假设） ----------
const SHARES_OUT = 10_000_000;          // 基础设定：已发行 1,000 万股
const V = 52, K = 1000, CAP = 10000;    // 价值型：估值、每 $1 偏离的股数、上限，不卖空
const value = p => Math.min(CAP, Math.max(0, K * (V - p)));
const TREND = 3000;                      // 趋势型：±3,000 股，回看一个月
const trend = (p, pPrev) => (p > pPrev ? TREND : -TREND);
const IDX_FRAC = 0.015;                  // 指数基金持有每家成分公司 1.5%
const INFLOW = 0.01;                     // 申购相当于基金规模 1%
const MID = 46.00, HALF = 0.02, SHADE = 0.02; // 做市商：参考中间价、半个价差、每 1,000 股存货的调整

// ---------- 二、开场：同一个 $46，五本账 ----------
const v50 = value(50), v46 = value(46), v44 = value(44);
ok('价值型 $50 时 2,000 股', v50 === 2000); ok('价值型 $46 时 6,000 股', v46 === 6000); ok('价值型 $44 时 8,000 股', v44 === 8000);
const valueTrade = v46 - v50; ok('价值型买 4,000', valueTrade === 4000);
ok('价值型 $52 及以上为 0', value(52) === 0 && value(55) === 0);
const trendBefore = trend(50, 48), trendNow = trend(46, 50);
ok('趋势型一个月前多头 3,000', trendBefore === 3000); ok('趋势型现在空头 3,000', trendNow === -3000);
const trendTrade = trendNow - trendBefore; ok('趋势型卖 6,000', trendTrade === -6000);
const idxHold = SHARES_OUT * IDX_FRAC; ok('指数基金持有 150,000 股', near(idxHold, 150000));
const idxTrade = idxHold * INFLOW; ok('申购 1% → 买 1,500 股', near(idxTrade, 1500));
const newFrac = IDX_FRAC * (1 + INFLOW); ok('持股比例 1.5% → 1.515%', near(newFrac, 0.01515));
const holder = -5000;
const mmTrade = -(valueTrade + trendTrade + idxTrade + holder); ok('做市商接下 5,500', near(mmTrade, 5500));
const buys = valueTrade + idxTrade + mmTrade, sells = -(trendTrade + holder);
ok('对账：买 11,000 = 卖 11,000', near(buys, 11000) && near(sells, 11000));
ok('做市商以外：买 5,500、卖 11,000', near(valueTrade + idxTrade, 5500) && near(-(trendTrade + holder), 11000));
const shift = (mmTrade / 1000) * SHADE; ok('下调 11 美分', near(shift, 0.11));
const bid0 = MID - HALF, ask0 = MID + HALF, bid1 = bid0 - shift, ask1 = ask0 - shift;
ok('平时报价 45.98 / 46.02', money(bid0) === '$45.98' && money(ask0) === '$46.02');
ok('调整后 45.87 / 45.91', money(bid1) === '$45.87' && money(ask1) === '$45.91');

for (const s of ['买进 4,000 股', '卖出 6,000 股', '买进 1,500 股', '卖出 5,000 股', '多 5,500 股', '11 美分',
  '持有 2,000 股，现在想持有 6,000 股', '从 $48 涨到了 $50，他持有 3,000 股', '还卖空了 3,000 股',
  '每股值 $52', '最多 10,000 股', '想持有 2,000 股；跌到 $46，想持有 6,000 股，于是买进 4,000 股',
  '持有 8,000 股，再买 2,000 股', '卖出 6,000 股：3,000 股是卖掉原来的持仓，另外 3,000 股是卖空',
  '1,000 万股，它就持有 15 万股', '从 1.5% 提高到 1.515%，北岭电池多买 1,500 股',
  '参考中间价是 $46.00，平时买价 $45.98、卖价 $46.02', '5.5 × 2 = 11 美分：买价 $45.87，卖价 $45.91',
  '买进 4,000 + 1,500 + 5,500 = 11,000 股，卖出 6,000 + 5,000 = 11,000 股',
  '一共买进 5,500 股，趋势型和老股东一共卖出 11,000 股，差出来的 5,500 股']) inL(s);
for (const s of ['买 4,000 股（2,000 → 6,000）', '卖 6,000 股（+3,000 → −3,000）', '买 1,500 股（150,000 → 151,500）',
  '卖 5,000 股', '买 5,500 股', '$45.98 / $46.02 → $45.87 / $45.91',
  '买进 4,000 + 1,500 + 5,500 = 11,000 股，卖出 6,000 + 5,000 = 11,000 股']) inF(s);
ok('150,000 + 1,500 = 151,500', near(idxHold + idxTrade, 151500));

// ---------- 三、图 2：价格路径与持仓 ----------
const path_ = [48, 50, 46, 44, 47, 52, 55, 53];
const vals = path_.slice(1).map(value);
const trs = path_.slice(1).map((p, i) => trend(p, path_[i]));
ok('价值型持股序列', vals.join(',') === '2000,6000,8000,5000,0,0,0', vals.join(','));
ok('趋势型持仓序列', trs.join(',') === '3000,-3000,-3000,3000,3000,3000,-3000', trs.join(','));
const dv = vals.slice(1).map((x, i) => x - vals[i]);
const dt = trs.slice(1).map((x, i) => x - trs[i]);
ok('价值型逐月变化 +4000,+2000,−3000,−5000,0,0', dv.join(',') === '4000,2000,-3000,-5000,0,0', dv.join(','));
ok('趋势型逐月变化 −6000,0,+6000,0,0,−6000', dt.join(',') === '-6000,0,6000,0,0,-6000', dt.join(','));
const pathStr = '一个月前 $48，然后 $50、$46、$44、$47、$52、$55、$53';
const valStr = '价值型 2,000、6,000、8,000、5,000、0、0、0 股';
const trStr = '趋势型 +3,000、−3,000、−3,000、+3,000、+3,000、+3,000、−3,000 股';
const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(n);
ok('序列字符串由计算生成（价值型）', valStr === '价值型 ' + vals.map(fmt).join('、') + ' 股');
ok('序列字符串由计算生成（趋势型）', trStr === '趋势型 ' + trs.map(sgn).join('、') + ' 股');
inL(pathStr, '图 2 价格路径'); inL(valStr, '图 2 价值型'); inL(trStr, '图 2 趋势型'); inL('指数基金一直是 150,000 股');
inF(pathStr); inF('2,000、6,000、8,000、5,000、0、0、0'); inF('+3,000、−3,000、−3,000、+3,000、+3,000、+3,000、−3,000'); inF('150,000 股不变');
inL('价值型卖出 3,000 股，趋势型买进 6,000 股'); inF('价值型卖出 3,000 股，趋势型买进 6,000 股');
inF('价值型 0（「卖 5,000」）'); inF('价值型 8,000（「买 2,000」）'); inF('价值型 5,000（「卖 3,000」），趋势型 +3,000（「买 6,000」）');
ok('第 4 个月 $47 > $44（趋势翻正）', path_[4] > path_[3]); ok('最后一月 $53 < $55（趋势翻负）', path_[7] < path_[6]);
ok('$53 高于估值 $52，价值型为 0', path_[7] > V && vals[6] === 0);
inF('从 8,000 股降到 5,000 股，卖出 3,000 股');
// 回看 12 个月的例子：一年前 $40 < $46，信号仍为正
ok('回看 12 个月例子：$46 > $40，仍为多头', trend(46, 40) === TREND); inL('一年前只有 $40');

// ---------- 四、小题 1：做市商空头 ----------
const inv = -3000, sh = (inv / 1000) * SHADE;
const mid2 = MID - sh, bid2 = mid2 - HALF, ask2 = mid2 + HALF;
ok('空头 3,000 → 上调 6 美分', near(-sh, 0.06));
ok('中间价 46.06，买价 46.04，卖价 46.08', money(mid2) === '$46.06' && money(bid2) === '$46.04' && money(ask2) === '$46.08');
inL('买价 $46.04，卖价 $46.08'); inL('3 × 2 = 6 美分，中间价变成 $46.06'); inL('3,000 股空头');

// ---------- 五、小题 2：市值加权 ----------
const capA = 5e8, capN0 = 5e8, capN1 = capN0 * 2;
const wIdx0 = capN0 / (capN0 + capA), wIdx1 = capN1 / (capN1 + capA);
const fundN1 = IDX_FRAC * capN1, fundA1 = IDX_FRAC * capA, wFund1 = fundN1 / (fundN1 + fundA1);
ok('指数权重 1/2 → 2/3', near(wIdx0, 0.5) && near(wIdx1, 2 / 3));
ok('基金里同样 2/3', near(wFund1, wIdx1));
ok('基金持有北岭电池市值是另一家的两倍', near(fundN1 / fundA1, 2));
inL('市值都是 5 亿美元'); inL('市值变成 10 亿美元'); inL('从一半升到三分之二'); inL('同样占三分之二');
// 开场：$50 → $46 时，指数里与基金里权重下降同样幅度（任取其余成分市值验证）
const others = 3e10; const wI = p => (SHARES_OUT * p) / (SHARES_OUT * p + others);
const wF = p => (idxHold * p) / (idxHold * p + IDX_FRAC * others);
ok('$50 与 $46 时基金权重 = 指数权重', near(wI(50), wF(50)) && near(wI(46), wF(46)));

// ---------- 六、文献与统计数字（课文转述，来源见核验记录） ----------
ok('MOP：24 + 12 + 9 + 13 = 58', 24 + 12 + 9 + 13 === 58);
inL('58 种流动性很好的期货和远期合约：24 种商品、12 个货币对、9 个股票指数和 13 种政府债券');
inL('1985 到 2009 年间'); inL('过去 12 个月的回报'); inL('回看 12 个月，持有 1 个月'); inL('2009 年 3 到 5 月'); inL('2008 年第四季度');
inL('1994 到 2005 年'); inL('大约 0.55 天就消化掉，最小的一组大约 2.11 天'); inL('约 0.55 天（大盘股）到 2.11 天（小盘股）');
ok('HM 半衰期：小盘股长于大盘股', 2.11 > 0.55);
inL('合计占美国长期基金资产的 52%（不含货币市场基金），2010 年底是 19%');
inL('持有美国股票总市值的 19%；主动管理的同类基金持有 11%');
ok('ICI 指数基金 19% + 主动 11% < 50%，其余为多数', 19 + 11 < 50);
inL('1997 年论证过'); inL('60%');

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
