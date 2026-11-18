/* S02-04 的数字。本课不调用撮合引擎，全部是固定的算术。 */
(function () {
  'use strict';
  window.S0204Data = {
    // N1：小林 600 股的逐档成交，与 S02-02 图 3 相同（价格单位：美分）
    fills: [[5002, 200], [5003, 300], [5004, 100]],
    // N6：券商甲当天在北岭电池上的三笔交易（虚构）；side +1 买入、−1 卖出；金额单位：美分
    trades: [
      { who: '小林', side: 1, qty: 600, cents: 3001700 },
      { who: '另一位客户', side: -1, qty: 1000, cents: 5005000 },
      { who: '第三位客户', side: 1, qty: 300, cents: 1501200 }
    ],
    // N2：SEC 2021 年 10 月报告，2021-01-27 的日内保证金追缴（单位：亿美元）
    call: { members: 36, total: 69, mtm: 21, special: 48, specialMembers: 18, required: 255 }
  };
})();
