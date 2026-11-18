// S02-01 课程页配置：课文之外的部分（开场照片、图、读图说明、来源说明）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = '<div class="pf-ctrl"><button type="button" data-a="prev">上一步</button><button type="button" class="pri" data-a="next">下一步</button><button type="button" data-a="again">重来</button><span class="cnt"></span></div>';
module.exports = {
  md: require('path').join(__dirname, '..', 'S02-01-课文-v1-候选.md'),
  n: 1,
  q: '股权融资与借钱有何不同？一级市场与二级市场是什么关系？',
  goal: '能说明投资者之间买卖股票的钱为什么不进公司的账户，并解释二级市场为什么对公司仍然重要',
  desc: 'MarketPilot S02-01：投资者之间买卖股票，钱不进公司的账户；一级市场与二级市场的关系，以及你的订单经过了谁的手。',
  hero: `    <figure class="shot" style="margin:0">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Broad_Street_and_Curb_Brokers%2C_New_York%2C_N._Y_cropped_and_aligned.tif/lossy-page1-1280px-Broad_Street_and_Curb_Brokers%2C_New_York%2C_N._Y_cropped_and_aligned.tif.jpg"
           alt="1908 年前后纽约百老汇街（Broad Street）的明信片，证券交易所旁的街上挤满了路边经纪人" style="object-position:50% 62%;filter:none">
      <div class="hot" style="left:14%;top:60%"><span><small>1908 年前后</small>股票在投资者之间转手</span></div>
      <div class="hot" style="left:30%;top:84%"><span><small>这里成交的每一股</small>钱都不进发行公司的账户</span></div>
      <a class="credit" href="https://commons.wikimedia.org/wiki/File:Broad_Street_and_Curb_Brokers,_New_York,_N._Y_cropped_and_aligned.tif">Detroit Publishing Co. · 1908–09 · Public domain</a>
      <figcaption class="sr">纽约百老汇街与路边经纪人，1908 年前后的彩色明信片。照片仅作开场氛围，与课文中的虚构公司无关。</figcaption>
    </figure>`,
  credits: `  <p class="credits"><b>照片来源</b> 纽约百老汇街与路边经纪人，1908 年前后的彩色明信片 · Detroit Publishing Co. 明信片（编号 12122） · Public domain · <a href="https://commons.wikimedia.org/wiki/File:Broad_Street_and_Curb_Brokers,_New_York,_N._Y_cropped_and_aligned.tif">Wikimedia Commons</a>。照片经裁切，仅作开场氛围；课文中的北岭电池、小林均为虚构。</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="border-top:3px solid var(--ink)"></span>墨黑：事实、钱和股票<br><span class="sw" style="border-top:3px solid var(--vio)"></span>紫色：费用、扣除<br><span class="sw" style="border-top:8px solid var(--lime)"></span>荧光：此刻这一步<br><span class="sw" style="border-top:2px dashed var(--ink2)"></span>虚线：估计、假设</div>
      <div><b>史实与模型</b>图 2 和图 3 的 2005 年数据来自 Google 向 SEC 提交的招股书。图 1 和图 4 是简化模型，北岭电池和小林都是虚构的。</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">借钱，还是卖股份</span><span class="kind model">简化模型</span></figcaption>
  <p class="pf-desc">北岭电池要筹 4,000 万美元。借钱：每年利息 240 万；卖股份：新股东占 20%。看新生产线的经营利润不同时，原来的股东各留下多少（单位：万美元）</p>
  <div class="predict" id="fig1-pre">
    <p class="pq" id="fig1-pq">先猜一猜：经营利润 3,000 万时，哪种方式留给原来的股东更多？</p>
    <div class="opts" role="radiogroup" aria-labelledby="fig1-pq">
      <label><input type="radio" name="fig1p" value="debt"> 借钱</label>
      <label><input type="radio" name="fig1p" value="equity"> 卖股份</label>
      <label><input type="radio" name="fig1p" value="same"> 一样多</label>
    </div>
    <div class="row"><button type="button" class="pri" data-a="check">提交，看图</button><button type="button" data-a="skip">直接看图</button></div>
    <p class="pfb" aria-live="polite" hidden></p>
    <p class="pans" hidden>答案：借钱（2,760 万对 2,400 万）</p>
  </div>
  <div class="f1-body" id="fig1-body" hidden>
    <div class="ctl"><label class="rng" for="fig1-p">经营利润 <span class="val" id="fig1-pv">1,000 万</span><input type="range" id="fig1-p" min="-500" max="3000" step="100" value="1000" aria-describedby="fig1-out"></label></div>
    <div class="pf-stage"><svg id="fig1-svg" viewBox="0 0 640 300" role="img" aria-label="两条直线：借钱留给老股东的是经营利润减 240 万，卖股份留下经营利润的 80%，两条线在经营利润 1,200 万处相交"></svg></div>
    <dl class="outs" id="fig1-out" aria-live="polite">
      <div><dt>借钱：老股东留下</dt><dd id="fig1-d">760 万</dd></div>
      <div><dt>卖股份：老股东留下</dt><dd id="fig1-e">800 万</dd></div>
    </dl>
    <p class="verdict" id="fig1-v">这一年，卖股份对原来的股东更有利</p>
  </div>
  <p class="pf-note">简化模型：不考虑税、违约和破产的成本、发行费用，以及利润是否分配。</p>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">那一晚的钱，流向了哪里</span><span class="kind">史实 · 招股书封面</span></figcaption>
  <div class="pf-stage f2">
    <div class="f2-top">
      <div class="bx inv" data-s="1"><span class="k">投资者一共付出</span><b class="m">$1,666,429,420</b><span class="t">总发行金额（约 16.7 亿美元）</span><span class="warn">这不是 Google 拿到的钱</span></div>
      <div class="bx shs" data-s="1"><span class="k">换到</span><b class="m">19,605,052 股</b><span class="t">A 类普通股，每股 $85</span></div>
    </div>
    <div class="lane thick" data-s="2">
      <div class="bx"><span class="k">新发行，来自 Google</span><b class="m">14,142,135 股</b></div>
      <div class="bx" data-s="3"><span class="k">× $85</span><b class="m">$1,202,081,475</b><span class="t">约 12.02 亿美元</span></div>
      <div class="bx uw" data-s="3"><span class="k">经过承销商</span><b class="m">− $2.3839 / 股</b><span class="t">承销折扣和佣金</span></div>
      <div class="bx acct" data-s="3" id="fig2-g"><span class="k">归 Google（Proceeds to Google）</span><b class="m">$1,168,368,039</b><span class="t est">另扣其他发行费用后，招股书估计净所得约 $1,163.6 million</span></div>
    </div>
    <div class="lane thin" data-s="2">
      <div class="bx"><span class="k">老股东出售</span><b class="m">5,462,917 股</b></div>
      <div class="bx" data-s="3"><span class="k">× $85</span><b class="m">$464,347,945</b><span class="t">约 4.64 亿美元</span></div>
      <div class="bx uw" data-s="3"><span class="k">经过承销商</span><b class="m">− $2.3839 / 股</b><span class="t">同样的承销折扣</span></div>
      <div class="bx" data-s="3"><span class="k">归原有股东</span><b class="m">$451,324,897</b><span class="t">和 Google 的账户无关</span></div>
    </div>
    <p class="f2-tag" data-s="4">公司只从这一条线拿到钱</p>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">数字来自 Google 2004 年 8 月 18 日向 SEC 提交的最终招股书（424B4）封面和「募集资金用途」一节。</p>
</figure>`,
    '2b': `<figure class="pf" id="fig2b" aria-labelledby="fig2b-t">
  <figcaption class="pf-hd"><span class="flab">图 2，续</span><span id="fig2b-t">一级市场与二级市场</span></figcaption>
  <div class="pf-stage f2b">
    <div class="f2b-mkt" data-s="1">
      <p class="k">第二天起 · 二级市场</p>
      <div class="swap"><span class="who">投资者甲<br><small>卖出 100 股</small></span><span class="arr"><span>股票 →</span><span>← 现金</span></span><span class="who">投资者乙<br><small>买入 100 股</small></span></div>
      <div class="px" data-s="2"><span>屏幕上的股价</span><b id="fig2b-px">$100.01</b><button type="button" id="fig2b-btn">股价变化</button></div>
      <p class="pl" data-s="2" id="fig2b-pl" aria-live="polite"></p>
    </div>
    <div class="bx acct f2b-g"><span class="k">Google 的账户（来自那次发行）</span><b class="m" id="fig2b-g">$1,168,368,039</b><span class="t">投资者之间的买卖，不改变这个数字</span></div>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">首日价格区间（约 $95 到 $104.06）据当日新闻报道，只用来演示。</p>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">市场价和增发</span><span class="kind model">$302.09 以外是假设计算</span></figcaption>
  <div class="f3-fact"><b>2005 年 9 月的真实增发</b>：14,159,265 股，每股 $295，扣除承销折扣后 $4,114,328,427（约 41.1 亿美元）。定价当日（2005-09-14）报告的最后成交价 $302.09</div>
  <div class="ctl"><label class="rng" for="fig3-m">定价当日的市场价 <span class="val" id="fig3-mv">$302.09</span><input type="range" id="fig3-m" min="100" max="400" step="1" value="302" aria-describedby="fig3-out"></label><button type="button" id="fig3-real">回到 $302.09</button></div>
  <ul class="f3-lab"><li>相对定价日市场价的折让幅度：约 2.35%</li><li>承销折扣：每股 $4.425（发行价的 1.5%）</li></ul>
  <dl class="outs" id="fig3-out" aria-live="polite">
    <div><dt>发行价</dt><dd id="fig3-p">$295.00</dd></div>
    <div><dt>每股实得</dt><dd id="fig3-net">$290.575</dd></div>
    <div><dt>筹到 $4,114,328,427 要发行</dt><dd id="fig3-n">14,159,265 股</dd></div>
    <div><dt>新股占发行后总股数</dt><dd id="fig3-pct">4.84%</dd></div>
  </dl>
  <div class="f3-bar" aria-hidden="true"><i id="fig3-bar"></i></div>
  <p class="verdict" id="fig3-v">这是 2005 年的真实发行</p>
  <p class="pf-note">发行后总股数 = 292,808,590 − 14,159,265 + 需要发行的股数（292,808,590 是招股书写明的发行后 A、B 类合计股数，截至 2005-06-30）。只有 $302.09 这一点是真实数据；真实的发行价还取决于市场情况和承销谈判。</p>
</figure>`,
    4: `<figure class="pf" id="fig4" aria-labelledby="fig4-t">
  <figcaption class="pf-hd"><span class="flab">图 4</span><span id="fig4-t">小林的订单走了哪条路</span><span class="kind model">一般流程示意</span></figcaption>
  <div class="ctl"><span class="seg" role="group" aria-label="市场"><button type="button" data-mkt="us" aria-pressed="true">美股</button><button type="button" data-mkt="cn" aria-pressed="false">A 股</button></span></div>
  <div class="pf-stage f4">
    <ol class="route">
      <li class="nd person" data-s="1"><b>小林</b><span>投资者</span></li>
      <li class="nd ui" data-s="2"><b>交易软件</b><span>界面</span></li>
      <li class="nd inst" data-s="3"><b>券商</b><span>机构：接受、处理订单</span></li>
      <li class="nd venue" data-s="4"><b>执行渠道（执行场所）</b><span>市场或系统</span>
        <div class="br" id="fig4-br" role="group" aria-label="选一种执行渠道"></div></li>
      <li class="nd fill" data-s="5"><b>成交</b><span>由市场中的其他参与者卖出</span></li>
    </ol>
    <p class="back" data-s="6">成交回报沿原路回到小林的软件</p>
    <p class="absent" data-s="6">北岭电池：不在这条路上</p>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">这是一般流程示意，不代表任何具体券商；不讲路由规则。成交之后钱和股票怎样交换，见第 4 课。</p>
</figure>`
  }
};
