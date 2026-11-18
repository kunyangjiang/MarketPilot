/* 站点外壳（首页、课程目录）使用的照片：从设计样稿 design-exploration/shared/photos*.js 原样摘出用到的 7 张。
 * 另加首页 S09-03 卡片与故事栏目用的 2 张（panic1907、strand1915），共 9 张。
 * 全部来自 Wikimedia Commons，热链 upload.wikimedia.org 的缩略图（没有下载到本地）。
 * 授权取自 Commons 的 LicenseShortName；标 ◐ 的是 Commons 标为公有领域、本站未另行核实的。
 * tone:"color" 表示早期彩色工艺或彩色原片，不去色；其余统一去色。照片只作氛围，不承载史实。 */
(function () {
  const P = {
    tuna: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Tuna_auction_at_Tsukiji_Fish_Market%2C_Tokyo%3B_2014.jpg/1280px-Tuna_auction_at_Tsukiji_Fish_Market%2C_Tokyo%3B_2014.jpg", "page":"https://commons.wikimedia.org/wiki/File:Tuna_auction_at_Tsukiji_Fish_Market,_Tokyo;_2014.jpg", "lic":"CC0", "who":"Joe deSousa", "cap":"东京筑地市场的金枪鱼拍卖，2014 年", "tone":"color"},
    curbSignal: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Signalling_to_offices%2C_curb_market%2C_New_York_City_LCCN97517154.jpg/1280px-Signalling_to_offices%2C_curb_market%2C_New_York_City_LCCN97517154.jpg", "page":"https://commons.wikimedia.org/wiki/File:Signalling_to_offices,_curb_market,_New_York_City_LCCN97517154.jpg", "lic":"Public domain", "who":"Bain News Service", "cap":"路边市场的经纪人向楼上的办公室打手势，纽约，1916 年"},
    abbottRoof: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Wall_Street%2C_showing_East_River_from_roof_of_Irving_Trust_building%2C_Manhattan_%28NYPL_b13668355-482666%29.jpg/1280px-Wall_Street%2C_showing_East_River_from_roof_of_Irving_Trust_building%2C_Manhattan_%28NYPL_b13668355-482666%29.jpg", "page":"https://commons.wikimedia.org/wiki/File:Wall_Street,_showing_East_River_from_roof_of_Irving_Trust_building,_Manhattan_(NYPL_b13668355-482666).jpg", "lic":"Public domain", "who":"Berenice Abbott", "cap":"Berenice Abbott，从欧文信托大楼楼顶俯瞰华尔街，1938 年"},
    melons: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Prokudin-Gorskii-15.jpg/1280px-Prokudin-Gorskii-15.jpg", "page":"https://commons.wikimedia.org/wiki/File:Prokudin-Gorskii-15.jpg", "lic":"Public domain", "who":"Sergei Prokudin-Gorskii", "cap":"撒马尔罕集市上的瓜贩，Prokudin-Gorskii 三色分色摄影，1905–1915 年间", "tone":"color"},
    abbottSkyline: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Manhattan_Skyline_I_South_Street_and_Jones_Lane_Manhattan_by_Berenice_Abbott_March_26_1936.jpg/1280px-Manhattan_Skyline_I_South_Street_and_Jones_Lane_Manhattan_by_Berenice_Abbott_March_26_1936.jpg", "page":"https://commons.wikimedia.org/wiki/File:Manhattan_Skyline_I_South_Street_and_Jones_Lane_Manhattan_by_Berenice_Abbott_March_26_1936.jpg", "lic":"Public domain", "who":"Berenice Abbott", "cap":"Berenice Abbott，从东河 11 号码头看曼哈顿下城，1936 年"},
    crowd29c: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Crowds_gathering_outside_New_York_Stock_Exchange_%283%29.jpg/1280px-Crowds_gathering_outside_New_York_Stock_Exchange_%283%29.jpg", "page":"https://commons.wikimedia.org/wiki/File:Crowds_gathering_outside_New_York_Stock_Exchange_(3).jpg", "lic":"Public domain ◐", "who":"Associated Press", "cap":"1929 年 10 月 24 日，交易所对面国库分署台阶上的人群"},
    chicagoTrains: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/No_Known_Restrictions_Trains_and_Chicago_Skyline_by_Jack_Delano%2C_1943_%28LOC%29_%28471324544%29.jpg/1280px-No_Known_Restrictions_Trains_and_Chicago_Skyline_by_Jack_Delano%2C_1943_%28LOC%29_%28471324544%29.jpg", "page":"https://commons.wikimedia.org/wiki/File:No_Known_Restrictions_Trains_and_Chicago_Skyline_by_Jack_Delano,_1943_(LOC)_(471324544).jpg", "lic":"Public domain", "who":"Jack Delano（美国国会图书馆）", "cap":"货运列车与芝加哥天际线，柯达克罗姆，1943 年 4 月", "tone":"color"}
,
    panic1907: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/1907_Panic.png/960px-1907_Panic.png", "page":"https://old-digitalcollections.nypl.org/items/510d47dd-5b2c-a3d9-e040-e00a18064a99", "via":"NYPL", "lic":"", "who":"纽约公共图书馆馆藏", "cap":"华尔街金融恐慌时期的人群，1907 年（馆藏推定）"},
    strand1915: {"src":"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Paul_Strand%2C_Wall_Street%2C_New_York_City%2C_1915.jpg/1280px-Paul_Strand%2C_Wall_Street%2C_New_York_City%2C_1915.jpg", "page":"https://commons.wikimedia.org/wiki/File:Paul_Strand,_Wall_Street,_New_York_City,_1915.jpg", "lic":"Public domain", "who":"Paul Strand", "cap":"Paul Strand《华尔街》，1915 年"}
  };
  window.PH = P;
  /* 页脚的照片来源清单 */
  P.credits = function (keys) {
    return "<p class=\"credits\"><b>照片来源</b> " + keys.map(k => {
      const p = P[k];
      return p.cap + " · " + p.who + (p.lic ? " · " + p.lic : "") + " · <a href=\"" + p.page + "\" target=\"_blank\" rel=\"noopener\">" + (p.via || "Commons") + "</a>";
    }).join("；") + "。照片经裁切、去色或调色处理，只作氛围。</p>";
  };
})();
