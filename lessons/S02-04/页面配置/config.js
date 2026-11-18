// S02-04 课程页配置：课文之外的部分（开场照片、图、读图说明、来源说明）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = '<div class="pf-ctrl"><button type="button" data-a="prev">上一步</button><button type="button" class="pri" data-a="next">下一步</button><button type="button" data-a="again">重来</button><span class="cnt"></span></div>';
module.exports = {
  md: require('path').join(__dirname, '..', 'S02-04 课文 v1 候选.md'),
  n: 4,
  q: '成交之后，谁保证钱和股票真的交换？',
  goal: '能画出从下单到结算的路径，并说明中央对手方和保证金的作用',
  desc: 'MarketPilot S02-04：成交、清算、结算的区别，中央对手方、净额结算、T+1 与保证金，以及两个「T+1」的不同。',
  scripts: ['data.js'],
  hero: `    <figure class="shot" style="margin:0">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Littered_floor_of_Stock_Exchange_after_market_session%2C_New_York_City_LCCN94509160.jpg/1280px-Littered_floor_of_Stock_Exchange_after_market_session%2C_New_York_City_LCCN94509160.jpg"
           alt="1920 年纽约证券交易所收盘之后，交易大厅的地板上满是纸片" style="object-position:50% 60%;transform:scale(1.12)">
      <div class="hot" style="left:12%;top:34%"><span><small>成交之后</small>钱和股票的交换，这时才开始</span></div>
      <div class="hot" style="left:30%;top:68%"><span><small>1920 年 · 收盘之后</small>交易大厅只剩一地纸片</span></div>
      <a class="credit" href="https://commons.wikimedia.org/wiki/File:Littered_floor_of_Stock_Exchange_after_market_session,_New_York_City_LCCN94509160.jpg">Library of Congress · 1920 · Public domain</a>
      <figcaption class="sr">收盘之后满地纸片的纽约证券交易所大厅，1920 年。照片仅作开场氛围，与课文中的虚构公司无关。</figcaption>
    </figure>`,
  credits: `  <p class="credits"><b>照片来源</b> 收盘之后满地纸片的纽约证券交易所大厅，1920 年 · 美国国会图书馆，LCCN 94509160 · Public domain · <a href="https://commons.wikimedia.org/wiki/File:Littered_floor_of_Stock_Exchange_after_market_session,_New_York_City_LCCN94509160.jpg">Wikimedia Commons</a>。照片经裁切、去色处理，仅作开场氛围；课文中的北岭电池、小林均为虚构。</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="border-top:3px solid var(--ink)"></span>墨黑：成交、交收等事实<br><span class="sw" style="border-top:3px solid var(--vio)"></span>紫色：保证金追缴、违约<br><span class="sw" style="border-top:8px solid var(--lime)"></span>荧光：此刻这一步<br><span class="sw" style="border-top:2px dashed var(--ink2)"></span>虚线：记录、已停止服务的会员</div>
      <div><b>示意与事实</b>图 1、图 2、图 4 是一般流程示意，不代表任何具体券商。图 3 的数字卡来自 SEC 2021 年 10 月的报告；押金柱只是示意。</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">小林的 600 股走过的路</span><span class="kind model">一般流程示意</span></figcaption>
  <div class="ctl"><span class="seg" role="group" aria-label="市场"><button type="button" data-mkt="us" aria-pressed="true">美股</button><button type="button" data-mkt="cn" aria-pressed="false">A 股</button></span></div>
  <div class="pf-stage f1">
    <ol class="chain" data-s="1"><li class="person">小林</li><li class="ui">交易软件</li><li class="inst">券商甲</li><li class="venue">执行渠道</li><li class="fill">成交 · 600 股 · $30,017</li></ol>
    <div class="post">
      <div class="nd inst pa"><b>券商甲</b><span>买方 · 小林的券商</span><span class="tk" data-s="2">成交记录：买入 600 股，$30,017</span></div>
      <div class="nd clr pc" data-s="2"><b class="cname">NSCC</b><span class="ctype">清算机构</span><span class="tk" data-s="2">成交记录</span><span class="ok" data-s="3">✓ 两边一致</span></div>
      <div class="nd inst pb"><b>券商乙</b><span>卖方的券商</span><span class="tk" data-s="2">成交记录：卖出 600 股，$30,017</span></div>
      <div class="bond direct" id="fig1-direct"><span>甲 ⟷ 乙：直接互为对手</span></div>
      <div class="bond l" data-s="4"><span class="who-a">甲 ⟷ <span class="cname">NSCC</span></span></div>
      <div class="bond r" data-s="4"><span class="who-b"><span class="cname">NSCC</span> ⟷ 乙</span></div>
      <p class="net" data-s="5">当天收盘后：券商甲在北岭电池上的所有交易归并成一笔（见图 2）</p>
      <div class="nd dep" data-s="6"><b class="dname">DTC</b><span class="dtype">存管机构</span><span class="dx" id="fig1-dx">T+1 日：股票从卖方一侧移到买方一侧，钱反方向移动</span></div>
    </div>
    <div class="hold"><span>小林的持仓 · 北岭电池 600 股</span><b id="fig1-st">未结算</b><span class="reg" data-s="7" id="fig1-reg">发行人名册上登记的是 Cede &amp; Co.；小林是实益所有人</span></div>
    <p class="cn-note" id="fig1-cn" hidden>A 股的「当天买入、次日才能卖出」是交易规则，不是这里的结算周期</p>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">一般流程示意，不代表任何具体券商。</p>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">三笔变一笔</span><span class="kind model">虚构的数字</span></figcaption>
  <div class="pf-stage">
    <div class="tblw"><table class="bs net2">
      <thead><tr><th>券商甲的客户</th><th>股票</th><th>钱</th></tr></thead>
      <tbody>
        <tr class="tr"><td>小林 · 买入</td><td class="n">+600</td><td class="n">−$30,017</td></tr>
        <tr class="tr"><td>另一位客户 · 卖出</td><td class="n">−1,000</td><td class="n">+$50,050</td></tr>
        <tr class="tr"><td>第三位客户 · 买入</td><td class="n">+300</td><td class="n">−$15,012</td></tr>
        <tr class="tot"><td>券商甲在 NSCC 的一笔交收</td><td class="n" data-s="2" id="fig2-q">−100</td><td class="n" data-s="3" id="fig2-c">+$5,021</td></tr>
      </tbody>
    </table></div>
    <p class="verdict" id="fig2-v"></p>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">虚构的数字；真实的轧差在每个会员、每只证券上进行。股票一栏 + 表示收进、− 表示交出；钱一栏 + 表示收进、− 表示付出。</p>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">风险越大，押金越多</span></figcaption>
  <div class="ctl"><span class="seg" role="group" aria-label="价格波动"><button type="button" data-v="0" aria-pressed="false">波动低</button><button type="button" data-v="1" aria-pressed="true">中</button><button type="button" data-v="2" aria-pressed="false">高</button></span></div>
  <div class="pf-stage f3">
    <div class="f3-bars" aria-hidden="true">
      <div><i id="fig3-b0"></i><span>同样的头寸</span></div>
    </div>
    <p class="f3-cap"><span id="fig3-t2">价格波动：中</span><br>押金柱：示意，不是 NSCC 的实际模型</p>
  </div>
  <p class="verdict" id="fig3-v" aria-live="polite">头寸一样大，股票的价格波动越剧烈，要押在中间的钱越多</p>
  <div class="f3-card">
    <p class="k">2021 年 1 月 27 日 · NSCC 的日内保证金追缴</p>
    <dl class="outs">
      <div><dt>收到追缴的会员</dt><dd>36 个</dd></div>
      <div><dt>追缴合计</dt><dd>69 亿美元</dd></div>
      <div><dt>当天所需保证金总额</dt><dd>255 亿美元</dd></div>
    </dl>
    <p class="src">69 亿 = 按市价重估 21 亿 + 特别收费 48 亿（涉及 18 个会员，都按要求补交）。来源：SEC 2021 年 10 月报告。这是保证金按规则上升，不是违约</p>
  </div>
</figure>`,
    4: `<figure class="pf" id="fig4" aria-labelledby="fig4-t">
  <figcaption class="pf-hd"><span class="flab">图 4</span><span id="fig4-t">如果卖方的券商倒了</span><span class="kind model">结构示意</span></figcaption>
  <div class="pf-stage f4">
    <div class="f4-row">
      <div class="nd inst" id="fig4-a"><b>券商甲</b><span>买方 · 小林</span><span class="st" id="fig4-st">未结算</span></div>
      <div class="nd clr"><b>NSCC</b><span>中央对手方</span></div>
      <div class="nd inst" id="fig4-b"><b>券商乙</b><span>卖方</span><span class="st bad" data-s="2">NSCC 对它停止行事</span></div>
    </div>
    <p class="f4-del" data-s="3">NSCC 照常向券商甲交付 600 股 → 小林的持仓：已结算</p>
    <div class="wf" data-s="4">
      <p class="wf-k">如果了结券商乙的头寸出现亏损，自下而上依次用</p>
      <ol class="wf-l" reversed>
        <li class="w3"><b>3</b>其他会员的清算基金（按比例分摊）</li>
        <li class="w2"><b>2</b>NSCC 自有资金的一部分</li>
        <li class="w1"><b>1</b>违约会员自己的清算基金和其他资源</li>
      </ol>
    </div>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">结构依据 SEC 2018 年公布的 NSCC 规则修订文件（Release No. 34-83748）；具体比例和步骤以 NSCC 现行规则为准。</p>
</figure>`
  }
};
