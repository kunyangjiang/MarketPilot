// S02-03 课程页配置：课文之外的部分（开场照片、图、读图说明、来源说明）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = '<div class="pf-ctrl"><button type="button" data-a="prev">上一步</button><button type="button" class="pri" data-a="next">下一步</button><button type="button" data-a="again">重来</button><span class="cnt"></span></div>';
const sizeCtl = id => `<div class="ctl"><label class="rng" for="${id}-q">订单规模 <span class="val" id="${id}-qv">1,000 股</span><input type="range" id="${id}-q" min="100" max="1000" step="100" value="1000" aria-describedby="${id}-out"></label><span class="seg" role="group" aria-label="方向"><button type="button" data-side="buy" aria-pressed="true">买</button><button type="button" data-side="sell" aria-pressed="false">卖</button></span></div>`;
const card = (n, text, ok, hint) => `<div class="sc" data-ok="${ok}" id="fig6-c${n}">
    <p class="sc-q" id="fig6-c${n}-q"><b>${'①②③④'[n - 1]}</b>${text}</p>
    <div class="sc-opts" role="radiogroup" aria-labelledby="fig6-c${n}-q">
      <label><input type="radio" name="fig6-c${n}" value="market"> 市价单</label>
      <label><input type="radio" name="fig6-c${n}" value="limit"> 限价单</label>
      <label><input type="radio" name="fig6-c${n}" value="split"> 拆开分批</label>
    </div>
    <div class="sc-bar"><button type="button" class="pri" data-a="check">提交</button><button type="button" data-a="show">看答案</button></div>
    <p class="sc-fb" aria-live="polite" hidden></p>
    <p class="sc-hint" hidden><b>提示：</b>${hint}</p>
    <p class="sc-ans" hidden></p>
  </div>`;
module.exports = {
  md: require('path').join(__dirname, '..', 'S02-03 课文 v1 候选.md'),
  n: 3,
  q: '报价与实际成交价之间的差距从哪里来？',
  goal: '能解释买卖价差和大额订单的价格冲击，并为不同目的选择限价单或市价单',
  desc: 'MarketPilot S02-03：买卖价差、深度与价格冲击，显性费用与滑点，以及按目的选择限价单或市价单。',
  scripts: ['../../engine/orderbook.js', 'data.js'],
  hero: `    <figure class="shot" style="margin:0">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/The_floor_of_the_New_York_Stock_Exchange%2C_secretly_shot_with_a_camera_hidden_in_the_photographer%27s_sleeve_LCCN2006685051.jpg/1280px-The_floor_of_the_New_York_Stock_Exchange%2C_secretly_shot_with_a_camera_hidden_in_the_photographer%27s_sleeve_LCCN2006685051.jpg"
           alt="1907 年纽约证券交易所的交易大厅，人群围在各个交易柱旁，这张照片是用藏在袖子里的相机拍的" style="object-position:50% 50%;transform:scale(1.6)">
      <div class="hot" style="left:12%;top:30%"><span><small>1907 年 · 交易大厅</small>相机藏在摄影师的袖子里</span></div>
      <div class="hot" style="left:30%;top:72%"><span><small>屏幕上 $100.00</small>买 1,000 股，平均却是 $100.30</span></div>
      <a class="credit" href="https://commons.wikimedia.org/wiki/File:The_floor_of_the_New_York_Stock_Exchange,_secretly_shot_with_a_camera_hidden_in_the_photographer%27s_sleeve_LCCN2006685051.jpg">Library of Congress · 1907 · Public domain</a>
      <figcaption class="sr">纽约证券交易所的交易大厅，1907 年。照片仅作开场氛围，与课文中的虚构公司无关。</figcaption>
    </figure>`,
  credits: `  <p class="credits"><b>照片来源</b> 纽约证券交易所的交易大厅，1907 年 · 美国国会图书馆，LCCN 2006685051 · Public domain · <a href="https://commons.wikimedia.org/wiki/File:The_floor_of_the_New_York_Stock_Exchange,_secretly_shot_with_a_camera_hidden_in_the_photographer%27s_sleeve_LCCN2006685051.jpg">Wikimedia Commons</a>。照片经裁切、去色处理，仅作开场氛围；课文中的远帆科技为虚构。</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="border-top:3px solid var(--ink)"></span>墨黑：成交、挂单<br><span class="sw" style="border-top:3px solid var(--vio)"></span>紫色：价格冲击、被吃掉的档位<br><span class="sw" style="border-top:8px solid var(--lime)"></span>荧光：此刻成交的一档<br><span class="sw" style="border-top:2px dashed var(--ink2)"></span>虚线：新挂单、中间价</div>
      <div><b>模型与事实</b>远帆科技的订单簿是虚构的教学数据，所有成交由与上一课相同的撮合引擎当场计算。费率、规则来自 SEC、FINRA 和中国的法律文件，见文末来源。</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">三个价格</span><span class="kind model">虚构订单簿</span></figcaption>
  <div class="pf-stage f1">
    <div class="lv ask" id="fig1-ask"><span class="side">卖一</span><span class="p">$100.02</span><span class="q">× 200</span><span class="tag" id="fig1-pay" hidden>付 $10,002</span></div>
    <div class="mid"><span>中间价 $100.00</span></div>
    <div class="lv bid" id="fig1-bid"><span class="side">买一</span><span class="p">$99.98</span><span class="q">× 300</span><span class="tag" id="fig1-get" hidden>得 $9,998</span></div>
  </div>
  <div class="pf-ctrl"><button type="button" class="pri" id="fig1-btn">买 100 股</button><button type="button" id="fig1-reset">重来</button></div>
  <p class="verdict" id="fig1-v" aria-live="polite">价差 = $100.02 − $99.98 = $0.04</p>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">订单规模与平均价</span><span class="kind model">虚构订单簿 · 引擎计算</span></figcaption>
  ${sizeCtl('fig2')}
  <div class="pf-stage f2">
    <div class="ladder" id="fig2-book" aria-label="远帆科技订单簿"></div>
    <svg id="fig2-svg" viewBox="0 0 360 260" role="img" aria-label="平均成交价随订单规模上升的折线"></svg>
  </div>
  <dl class="outs" id="fig2-out" aria-live="polite">
    <div><dt>平均价</dt><dd id="fig2-avg"></dd></div>
    <div><dt>合计</dt><dd id="fig2-tot"></dd></div>
    <div><dt>价差的一半</dt><dd id="fig2-hs"></dd></div>
    <div><dt>价格冲击</dt><dd id="fig2-im"></dd></div>
    <div><dt>最新价被推到</dt><dd id="fig2-last"></dd></div>
  </dl>
  <p class="pf-note">虚构订单簿；真实订单簿里的挂单会随时增减。价差的一半和价格冲击都以中间价 $100.00 为参照。</p>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">两本订单簿</span><span class="kind model">数据与上一课沙盘场景 6 相同</span></figcaption>
  <div class="pf-stage f3">
    <div><p class="bk-t">股票 A · 最新 $50.00</p><div class="ladder" id="fig3-a"></div><dl class="outs one" id="fig3-ra"></dl></div>
    <div><p class="bk-t">股票 B · 最新 $50.00</p><div class="ladder" id="fig3-b"></div><dl class="outs one" id="fig3-rb"></dl></div>
  </div>
  <div class="pf-ctrl"><button type="button" class="pri" id="fig3-btn" aria-pressed="false">各市价买 1,000 股</button></div>
  <p class="verdict" id="fig3-v" aria-live="polite">屏幕上的价格一样。按下按钮，看两边各要付多少</p>
</figure>`,
    4: `<figure class="pf" id="fig4" aria-labelledby="fig4-t">
  <figcaption class="pf-hd"><span class="flab">图 4</span><span id="fig4-t">先买一半，等一等</span><span class="kind model">两种情形都是假设</span></figcaption>
  <div class="pf-stage f4">
    <div class="ladder" id="fig4-book" aria-label="远帆科技订单簿"></div>
    <div class="f4-side">
      <div class="seg f4-pick" id="fig4-pick" role="group" aria-label="等待期间"><button type="button" data-k="A" aria-pressed="false">有人补挂卖单</button><button type="button" data-k="B" aria-pressed="false">没有人补挂</button></div>
      <dl class="tots" id="fig4-tots"></dl>
    </div>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">两种情形都是虚构的假设；真实市场里补挂多少、多快补挂，事先并不知道。</p>
</figure>`,
    5: `<figure class="pf" id="fig5" aria-labelledby="fig5-t">
  <figcaption class="pf-hd"><span class="flab">图 5</span><span id="fig5-t">一笔交易的成本拆开来</span><span class="kind model">相对中间价 $100.00</span></figcaption>
  ${sizeCtl('fig5')}
  <div class="pf-stage">
    <div class="stack" id="fig5-bar" aria-hidden="true"></div>
    <dl class="outs" id="fig5-out" aria-live="polite">
      <div><dt>价差的一半</dt><dd id="fig5-hs"></dd></div>
      <div><dt>价格冲击</dt><dd id="fig5-im"></dd></div>
      <div><dt>显性费用</dt><dd id="fig5-fee"></dd></div>
    </dl>
    <p class="pf-note" id="fig5-feenote"></p>
  </div>
  <p class="pf-note">显性费用以你所用券商公布的收费表为准；图中不假设佣金。FINRA 交易活动费按股计算、金额很小，且 2026 年 10 月 1 日至 12 月 31 日暂为零，不放进图里。</p>
</figure>`,
    6: `<figure class="pf" id="fig6" aria-labelledby="fig6-t">
  <figcaption class="pf-hd"><span class="flab">图 6</span><span id="fig6-t">选哪种订单</span></figcaption>
  <div class="f6">
  ${card(1, '收盘前必须买到 100 股一只成交活跃的大公司股票', 'market', '这只股票价差很窄，100 股会在哪一档成交？')}
  ${card(2, '只愿意在 $100.05 以下买入远帆科技，今天买不到也无所谓', 'limit', '你更在乎成交，还是价格？')}
  ${card(3, '要买入 5,000 股远帆科技，而卖一后面一共只挂了 1,000 股', 'limit split', '5,000 股比卖一后面所有挂单加起来还多，市价单会怎样？')}
  ${card(4, '一只每天只成交几千股的股票，买一和卖一相差 $0.50', 'limit', '$0.50 的价差意味着马上买要多付多少？')}
  </div>
  <div class="f6-demo" id="fig6-demo" hidden></div>
  <p class="pf-note">情境题没有唯一的标准做法，答案说明的是每种选择的代价。</p>
</figure>`
  }
};
