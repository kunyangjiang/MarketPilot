/* 照片审核第二版（2026-11-16）：真正的老式黑白照片；第三版加入早期彩色工艺名作（tone:'color'），与黑白交替。
   来源 Wikimedia Commons，热链 upload.wikimedia.org 的 1280px 缩略图，没有下载到本地。
   授权取自 LicenseShortName；作者和日期取自 Commons 元数据（Artist、DateTimeOriginal）。
   1929 年两张美联社照片、1932 年银行挤兑照片：Commons 标为 Public domain，本站未另行核实 ◐。 */
(function () {
  const C = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';
  const W = 'https://commons.wikimedia.org/wiki/File:';
  Object.assign(window.PH, {
    strand1915: {
      src: C + '7/7c/Paul_Strand%2C_Wall_Street%2C_New_York_City%2C_1915.jpg/1280px-Paul_Strand%2C_Wall_Street%2C_New_York_City%2C_1915.jpg',
      page: W + 'Paul_Strand,_Wall_Street,_New_York_City,_1915.jpg',
      lic: 'Public domain', who: 'Paul Strand',
      cap: 'Paul Strand《华尔街》，1915 年'
    },
    curbSignal: {
      src: C + '5/5d/Signalling_to_offices%2C_curb_market%2C_New_York_City_LCCN97517154.jpg/1280px-Signalling_to_offices%2C_curb_market%2C_New_York_City_LCCN97517154.jpg',
      page: W + 'Signalling_to_offices,_curb_market,_New_York_City_LCCN97517154.jpg',
      lic: 'Public domain', who: 'Bain News Service',
      cap: '路边市场的经纪人向楼上的办公室打手势，纽约，1916 年'
    },
    office1902: {
      src: C + '5/59/Wall_Street_guide_-_%281902%29_%2814781337751%29.jpg/1280px-Wall_Street_guide_-_%281902%29_%2814781337751%29.jpg',
      page: W + 'Wall_Street_guide_-_(1902)_(14781337751).jpg',
      lic: 'No restrictions', who: 'J.L. McLean & Co.',
      cap: '《华尔街指南》里的经纪行营业室，1902 年'
    },
    abbottRoof: {
      src: C + '3/3a/Wall_Street%2C_showing_East_River_from_roof_of_Irving_Trust_building%2C_Manhattan_%28NYPL_b13668355-482666%29.jpg/1280px-Wall_Street%2C_showing_East_River_from_roof_of_Irving_Trust_building%2C_Manhattan_%28NYPL_b13668355-482666%29.jpg',
      page: W + 'Wall_Street,_showing_East_River_from_roof_of_Irving_Trust_building,_Manhattan_(NYPL_b13668355-482666).jpg',
      lic: 'Public domain', who: 'Berenice Abbott',
      cap: 'Berenice Abbott，从欧文信托大楼楼顶俯瞰华尔街，1938 年'
    },
    abbottWatts: {
      src: C + '8/80/John_Watts_statue%2C_from_Trinity_Churchyard_looking_toward_One_Wall_Street%2C_Manhattan_%28NYPL_b13668355-482661%29.jpg/1280px-John_Watts_statue%2C_from_Trinity_Churchyard_looking_toward_One_Wall_Street%2C_Manhattan_%28NYPL_b13668355-482661%29.jpg',
      page: W + 'John_Watts_statue,_from_Trinity_Churchyard_looking_toward_One_Wall_Street,_Manhattan_(NYPL_b13668355-482661).jpg',
      lic: 'Public domain', who: 'Berenice Abbott',
      cap: 'Berenice Abbott，从三一教堂墓园望向华尔街 1 号，1938 年'
    },
    abbottSkyline: {
      src: C + '2/2a/Manhattan_Skyline_I_South_Street_and_Jones_Lane_Manhattan_by_Berenice_Abbott_March_26_1936.jpg/1280px-Manhattan_Skyline_I_South_Street_and_Jones_Lane_Manhattan_by_Berenice_Abbott_March_26_1936.jpg',
      page: W + 'Manhattan_Skyline_I_South_Street_and_Jones_Lane_Manhattan_by_Berenice_Abbott_March_26_1936.jpg',
      lic: 'Public domain', who: 'Berenice Abbott',
      cap: 'Berenice Abbott，从东河 11 号码头看曼哈顿下城，1936 年'
    },
    abbottRooftops: {
      src: C + '5/5b/Financial_district_rooftops_III_in_Manhattan_in_1938.jpg/1280px-Financial_district_rooftops_III_in_Manhattan_in_1938.jpg',
      page: W + 'Financial_district_rooftops_III_in_Manhattan_in_1938.jpg',
      lic: 'Public domain', who: 'Berenice Abbott',
      cap: 'Berenice Abbott，金融区屋顶，1938 年'
    },
    unionBank: {
      src: C + 'f/f8/Bank_Run_on_American_Union_Bank.jpeg/1280px-Bank_Run_on_American_Union_Bank.jpeg',
      page: W + 'Bank_Run_on_American_Union_Bank.jpeg',
      lic: 'Public domain ◐', who: '◐ 作者未核',
      cap: '纽约美国联合银行关门后，储户聚在门前，1932 年 4 月 26 日'
    },
    crowd29a: {
      src: C + '3/3f/Crowds_gathering_outside_New_York_Stock_Exchange.jpg/1280px-Crowds_gathering_outside_New_York_Stock_Exchange.jpg',
      page: W + 'Crowds_gathering_outside_New_York_Stock_Exchange.jpg',
      lic: 'Public domain ◐', who: 'Associated Press',
      cap: '1929 年 10 月 24 日，纽约证券交易所外聚集的人群'
    },
    /* ---- 彩色：只用历史彩色摄影的好作品（三色分色、奥托克罗姆、柯达克罗姆），tone:'color' 表示不去色 ---- */
    melons: {
      src: C + 'a/a6/Prokudin-Gorskii-15.jpg/1280px-Prokudin-Gorskii-15.jpg',
      page: W + 'Prokudin-Gorskii-15.jpg',
      lic: 'Public domain', who: 'Sergei Prokudin-Gorskii',
      cap: '撒马尔罕集市上的瓜贩，Prokudin-Gorskii 三色分色摄影，1905–1915 年间', tone: 'color'
    },
    bourse1920: {
      src: C + 'c/ca/L%27emprunt_national_de_1920_%C3%A0_la_Bourse_de_Paris%2C_palais_Brongniart_-_A20230S.jpg/1280px-L%27emprunt_national_de_1920_%C3%A0_la_Bourse_de_Paris%2C_palais_Brongniart_-_A20230S.jpg',
      page: W + "L'emprunt_national_de_1920_à_la_Bourse_de_Paris,_palais_Brongniart_-_A20230S.jpg",
      lic: 'CC0', who: 'Léon Auguste（Albert Kahn《星球档案》）',
      cap: '巴黎证券交易所门前的"国债认购"横幅，奥托克罗姆彩色干版，1920 年 3 月 13 日', tone: 'color'
    },
    chicagoTrains: {
      src: C + '5/56/No_Known_Restrictions_Trains_and_Chicago_Skyline_by_Jack_Delano%2C_1943_%28LOC%29_%28471324544%29.jpg/1280px-No_Known_Restrictions_Trains_and_Chicago_Skyline_by_Jack_Delano%2C_1943_%28LOC%29_%28471324544%29.jpg',
      page: W + 'No_Known_Restrictions_Trains_and_Chicago_Skyline_by_Jack_Delano,_1943_(LOC)_(471324544).jpg',
      lic: 'Public domain', who: 'Jack Delano（美国国会图书馆）',
      cap: '货运列车与芝加哥天际线，柯达克罗姆，1943 年 4 月', tone: 'color'
    },
    santaFeNight: {
      src: C + 'f/f3/Santa_Fe_RR_Yard_fsac.1a34717u_detail.jpg/1280px-Santa_Fe_RR_Yard_fsac.1a34717u_detail.jpg',
      page: W + 'Santa_Fe_RR_Yard_fsac.1a34717u_detail.jpg',
      lic: 'Public domain', who: 'Jack Delano（美国国会图书馆）',
      cap: '堪萨斯城圣菲铁路货场夜景，柯达克罗姆，1940 年代', tone: 'color'
    },
    fiftySecond: {
      src: C + '9/9f/52nd_Street%2C_New_York%2C_by_Gottlieb%2C_1948.jpg/1280px-52nd_Street%2C_New_York%2C_by_Gottlieb%2C_1948.jpg',
      page: W + '52nd_Street,_New_York,_by_Gottlieb,_1948.jpg',
      lic: 'Public domain', who: 'William P. Gottlieb',
      cap: '纽约 52 街的夜晚，柯达克罗姆，1948 年', tone: 'color'
    },
    crowd29c: {
      src: C + '0/0b/Crowds_gathering_outside_New_York_Stock_Exchange_%283%29.jpg/1280px-Crowds_gathering_outside_New_York_Stock_Exchange_%283%29.jpg',
      page: W + 'Crowds_gathering_outside_New_York_Stock_Exchange_(3).jpg',
      lic: 'Public domain ◐', who: 'Associated Press',
      cap: '1929 年 10 月 24 日，交易所对面国库分署台阶上的人群'
    }
  });
})();
