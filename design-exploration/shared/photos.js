/* 第 1 轮 · 第二批方向共用的开放授权照片。
   全部来自 Wikimedia Commons，直接热链 upload.wikimedia.org（没有下载到本地）。
   授权信息取自 Commons API 的 LicenseShortName 字段（2026-11-16 查询）；
   作者、拍摄日期等未逐张核对的信息标 ◐。照片说明只描述画面，不新增史实。 */
(function () {
  const C = 'https://upload.wikimedia.org/wikipedia/commons/';
  const P = {
    panic1907: {
      src: C + '1/18/1907_Panic.png',
      page: 'https://commons.wikimedia.org/wiki/File:1907_Panic.png',
      lic: 'Public domain', who: '◐ 作者未核',
      cap: '华尔街上的人群（Commons 文件名标注为 1907 年恐慌；拍摄日期未独立核实 ◐）'
    },
    curb1902: {
      src: C + 'thumb/6/6c/Curb_market_at_Broad_Street_1902.jpg/1280px-Curb_market_at_Broad_Street_1902.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Curb_market_at_Broad_Street_1902.jpg',
      lic: 'Public domain', who: '◐ 作者未核',
      cap: '布罗德街上的露天"路边市场"，1902 年（据文件名）'
    },
    floorA: {
      src: C + 'thumb/8/80/New_York_Stock_Exchange_trading_floor_on_Wall_Street%2C_New_York%2C_New_York_LCCN2011634218.tif/lossy-page1-1280px-New_York_Stock_Exchange_trading_floor_on_Wall_Street%2C_New_York%2C_New_York_LCCN2011634218.tif.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:New_York_Stock_Exchange_trading_floor_on_Wall_Street,_New_York,_New_York_LCCN2011634218.tif',
      lic: 'Public domain', who: '美国国会图书馆藏（LCCN 2011634218）',
      cap: '纽约证券交易所交易大厅，满是屏幕的现代场景（年代见原页面 ◐）'
    },
    floorB: {
      src: C + 'thumb/a/ab/Trading_floor%2C_New_York_Stock_Exchange%2C_New_York%2C_New_York_LCCN2011630168.tif/lossy-page1-1280px-Trading_floor%2C_New_York_Stock_Exchange%2C_New_York%2C_New_York_LCCN2011630168.tif.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Trading_floor,_New_York_Stock_Exchange,_New_York,_New_York_LCCN2011630168.tif',
      lic: 'Public domain', who: '美国国会图书馆藏（LCCN 2011630168）',
      cap: '纽约证券交易所交易大厅（竖幅；年代见原页面 ◐）'
    },
    sweeping: {
      src: C + '9/98/Men_sweeping_up_the_floor_of_the_stock_exchange_LCCN2013646362.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Men_sweeping_up_the_floor_of_the_stock_exchange_LCCN2013646362.jpg',
      lic: 'Public domain', who: '美国国会图书馆藏（LCCN 2013646362）',
      cap: '收市后，工人清扫交易所地板上的纸片'
    },
    tuna: {
      src: C + 'thumb/f/f6/Tuna_auction_at_Tsukiji_Fish_Market%2C_Tokyo%3B_2014.jpg/1280px-Tuna_auction_at_Tsukiji_Fish_Market%2C_Tokyo%3B_2014.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Tuna_auction_at_Tsukiji_Fish_Market,_Tokyo;_2014.jpg',
      lic: 'CC0', who: 'Joe deSousa',
      cap: '东京筑地市场的金枪鱼拍卖，2014 年'
    },
    nyseSign: {
      src: C + 'thumb/7/71/Sign_of_the_New_York_Stock_Exchange%2C_Broad_Street.jpg/1280px-Sign_of_the_New_York_Stock_Exchange%2C_Broad_Street.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Sign_of_the_New_York_Stock_Exchange,_Broad_Street.jpg',
      lic: 'CC0', who: '◐ 作者见原页面',
      cap: '布罗德街上的纽约证券交易所招牌'
    },
    pike1907: {
      src: C + 'thumb/6/63/Market_vendors_gathering_on_Pike_Place%2C_ca._1907_-_DPLA_-_f62ac740d22b6ca81f281666c4c52882_%28page_1%29.jpg/1280px-Market_vendors_gathering_on_Pike_Place%2C_ca._1907_-_DPLA_-_f62ac740d22b6ca81f281666c4c52882_%28page_1%29.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Market_vendors_gathering_on_Pike_Place,_ca._1907_-_DPLA_-_f62ac740d22b6ca81f281666c4c52882_(page_1).jpg',
      lic: 'Public domain', who: 'DPLA ◐',
      cap: '西雅图派克街上聚集的摊贩，约 1907 年'
    },
    ticker: {
      src: C + '2/2c/Stock_ticker.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Stock_ticker.jpg',
      lic: 'Public domain', who: '◐ 作者未核',
      cap: '几个人围着收报机查看纸带行情（年代未核 ◐；小图 208×271）'
    },
    frankfurt: {
      src: C + 'thumb/9/9d/Frankfurt_Stock_Exchange_%28Ank_Kumar%29_03.jpg/1280px-Frankfurt_Stock_Exchange_%28Ank_Kumar%29_03.jpg',
      page: 'https://commons.wikimedia.org/wiki/File:Frankfurt_Stock_Exchange_(Ank_Kumar)_03.jpg',
      lic: 'CC BY-SA 4.0', who: 'Ank Kumar',
      cap: '法兰克福证券交易所'
    }
  };
  window.PH = P;
  /* 页面底部的照片来源清单 */
  window.PH.credits = function (keys, cls) {
    return '<div class="' + (cls || 'credits') + '"><b>照片来源</b> ' + keys.map(k => {
      const p = P[k];
      return p.cap + ' · ' + p.who + ' · ' + p.lic + ' · <a href="' + p.page + '" target="_blank" rel="noopener">Commons</a>';
    }).join('；') + '。照片经裁切、去色或调色处理。</div>';
  };
})();
