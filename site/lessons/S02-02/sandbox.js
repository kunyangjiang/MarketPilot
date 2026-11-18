/* S02-02 订单簿沙盘 · 界面层
 * 只做两件事：把读者的操作交给会话层（model.js），再把引擎状态画出来。撮合、权限、时钟都不在这里。
 * 动画逐帧播放引擎返回的快照（trace），所以画面上的每一步都是引擎真实经过的状态。 */
(function () {
  'use strict';
  const OB = window.MPOrderBook, M = window.S0202, LAD = window.MPLadder;
  const f = OB.fmt, esc = LAD.esc;
  const root = document.getElementById('sim-root');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const S = M.createSession();

  const ui = { details: false, stepMode: false, predictOn: true, busy: false, frame: null, ghost: null, report: null, predictions: {}, msg: '', msgKind: '' };

  root.hidden = false;
  root.innerHTML = `
  <div class="sb-bar">
    <div class="modesw" role="group" aria-label="角色模式">
      <button type="button" data-mode="trader" aria-pressed="true">交易者模式</button>
      <button type="button" data-mode="experiment" aria-pressed="false">市场实验模式</button>
    </div>
    <label class="sel"><span>场景</span><select id="sb-scn"><option value="">自由练习（初始订单簿）</option>${M.SCENARIOS.map(s => `<option value="${s.id}">场景 ${s.n} · ${esc(s.title)}</option>`).join('')}</select></label>
    <button type="button" class="ghostbtn" data-act="restart">重新开始场景</button>
    <button type="button" class="ghostbtn" data-act="reset">重置</button>
    <span class="clock" aria-label="模拟时钟">模拟时钟 <b id="sb-clock"></b></span>
  </div>
  <p class="mode-note" id="sb-modenote" hidden><b>市场实验模式</b>这是在模拟市场中其他人的行为，不是普通交易者能做的操作。</p>
  <div class="scn" id="sb-scn-panel" hidden></div>
  <div class="sb-grid">
    <div class="sb-left">
      <div class="sb-ladhd"><span class="lab" id="sb-ladlab">订单簿</span>
        <span class="tg"><label class="tgl"><input type="checkbox" id="sb-det"> 显示订单明细</label><label class="tgl"><input type="checkbox" id="sb-step"> 逐步模式</label><label class="tgl"><input type="checkbox" id="sb-pred" checked> 预测提示</label></span></div>
      <div id="sb-lad" class="sb-lad"></div>
      <div class="stepbar" id="sb-stepbar" hidden><span id="sb-stepmsg" aria-live="polite"></span><button type="button" class="pri" data-act="next-level">下一档 →</button></div>
      <details class="tbl" id="sb-tbl"><summary>表格视图（与阶梯同一份数据）</summary><div id="sb-tblbody"></div></details>
    </div>
    <div class="sb-right">
      <div class="three" id="sb-three"></div>
      <div class="panel" id="sb-panel"></div>
      <div class="rep" id="sb-rep" hidden></div>
    </div>
  </div>
  <div class="sb-log"><div class="lab">成交与事件记录</div><ol id="sb-log" aria-live="off"></ol></div>
  <details class="limits"><summary>这个模型简化了什么</summary>
    <p>这是一个单一交易场所、全部订单可见的简化订单簿，用来展示连续交易中撮合的基本逻辑。</p>
    <ul>
      <li><strong>只有一本订单簿。</strong> 真实的美国股票在许多交易所和场外场所同时交易，你看到的最优报价通常是多家报价的汇总；你的订单也可能由券商交给做市商执行，而不进入交易所。</li>
      <li><strong>所有挂单都可见。</strong> 真实市场中有不显示的订单和暗池，成交价可能落在显示的买一和卖一之间。</li>
      <li><strong>其他人不会对你做出反应。</strong> 除了你自己撤单，或在实验模式中触发的事件，其他挂单都不会变化。</li>
      <li><strong>事件按顺序逐一处理。</strong> 撤单在对方订单之前到达才会生效，已成交的部分不能撤回。真实交易场所对撤单的时机还有各自的规定。</li>
      <li><strong>只有连续交易。</strong> 开盘、收盘的集合竞价不在本模型中；在集合竞价的收集阶段，买价高于卖价是可能的。</li>
      <li><strong>没有费用，以 100 股为单位，没有价格保护机制。</strong> 市价单在对手方不足时，剩余部分直接取消。</li>
    </ul>
    <p>模型的计算是精确的，但它展示的是机制，而不是真实市场中某一笔订单会怎样成交。</p>
  </details>
  <p class="sr" id="sb-live" aria-live="polite"></p>`;

  const $ = s => root.querySelector(s);
  const live = t => { $('#sb-live').textContent = ''; setTimeout(() => { $('#sb-live').textContent = t; }, 30); };

  /* ---------- 工具 ---------- */
  const parsePrice = v => { const m = String(v).trim().replace(/^\$/, '').match(/^(\d{1,3})(?:\.(\d{1,2}))?$/); return m ? parseInt(m[1], 10) * 100 + parseInt((m[2] || '0').padEnd(2, '0'), 10) : null; };
  const centsToInput = c => (Math.floor(c / 100)) + '.' + String(c % 100).padStart(2, '0');
  const st = () => S.state();
  const curScn = () => st().scenario;
  const bookName = w => w === 'A' ? '股票 A' : w === 'B' ? '股票 B' : '';

  /* ---------- 绘制 ---------- */
  function drawLadder() {
    const s = st();
    const opt = b => ({ scale: 1000, details: ui.details });
    if (s.view === 'compare') {
      $('#sb-ladlab').textContent = '对比视图 · 两本订单簿（事件 X3）';
      const one = w => {
        const b = ui.frame && ui.frame.book === w ? ui.frame.snap : s.compare[w];
        const g = ui.frame && ui.frame.book === w ? ui.frame.ghost : null;
        return `<div class="cmp-col"><div class="pane-h">${w === 'A' ? '厚订单簿：股票 A' : '薄订单簿：股票 B'}</div>${LAD.render(b, Object.assign(opt(), { scale: 3000, ghost: g, showBids: true, noLastTime: true }))}</div>`;
      };
      $('#sb-lad').innerHTML = `<div class="cmpgrid">${one('A')}${one('B')}</div>`;
      $('#sb-tblbody').innerHTML = LAD.table(s.compare.A, '股票 A 订单簿') + LAD.table(s.compare.B, '股票 B 订单簿');
    } else {
      $('#sb-ladlab').textContent = '订单簿 · 北岭电池（NRB）';
      const b = ui.frame ? ui.frame.snap : s.book;
      $('#sb-lad').innerHTML = LAD.render(b, Object.assign(opt(), { ghost: ui.frame ? ui.frame.ghost : ui.ghost }));
      $('#sb-tblbody').innerHTML = LAD.table(s.book, '沙盘订单簿');
    }
  }

  function drawThree() {
    const s = st();
    const block = (b, title) => {
      const a = OB.bestAsk(b), d = OB.bestBid(b), sp = OB.spread(b), L = b.last;
      return `<div class="three-b">${title ? `<div class="pane-h">${title}</div>` : ''}
        <div class="t-last"><small>最新成交价 · 记录</small><b>${L ? f.price(L.price) : '—'}</b><span>${L && L.time != null ? f.clock(L.time) + ' 成交' : (L ? '课文未给出成交时间' : '')}</span></div>
        <div class="t-q"><div class="a"><small>卖一 · 报价</small><b>${a ? f.price(a.price) : '—'}</b><span>${a ? '× ' + f.group(a.qty) : '卖方已无挂单'}</span></div>
        <div class="b"><small>买一 · 报价</small><b>${d ? f.price(d.price) : '—'}</b><span>${d ? '× ' + f.group(d.qty) : '买方没有挂单'}</span></div></div>
        <div class="t-s"><span>价差 <b>${sp != null ? f.price(sp) : '—'}</b></span><span>卖一上方 $0.05 内 <b>${f.group(OB.depth(b, 'sell', 5))}</b> 股</span><span>买一下方 $0.05 内 <b>${f.group(OB.depth(b, 'buy', 5))}</b> 股</span></div></div>`;
    };
    if (s.view === 'compare') {
      const A = ui.frame && ui.frame.book === 'A' ? ui.frame.snap : s.compare.A, B = ui.frame && ui.frame.book === 'B' ? ui.frame.snap : s.compare.B;
      $('#sb-three').innerHTML = `<div class="lab">三个数字</div><div class="three-2">${block(A, '股票 A')}${block(B, '股票 B')}</div>`;
    } else {
      $('#sb-three').innerHTML = `<div class="lab">三个数字</div>${block(ui.frame ? ui.frame.snap : s.book)}`;
    }
  }

  function drawPanel() {
    const s = st(), step = S.pendingStep();
    let h = '';
    if (s.mode === 'trader') {
      const pre = step && step.kind === 'reader' ? step.order : null;
      const which = step && step.kind === 'reader' ? step.book : (ui.lastBook || 'A');
      h += `<form id="sb-form" class="oform" novalidate>
        <div class="lab">下单（以你自己的身份）</div>
        ${s.view === 'compare' ? `<fieldset class="rad"><legend>下单到</legend><label><input type="radio" name="bk" value="A" ${which !== 'B' ? 'checked' : ''}> 股票 A</label><label><input type="radio" name="bk" value="B" ${which === 'B' ? 'checked' : ''}> 股票 B</label></fieldset>` : ''}
        <fieldset class="rad"><legend>方向</legend><label><input type="radio" name="side" value="buy" ${!pre || pre.side === 'buy' ? 'checked' : ''}> 买</label><label><input type="radio" name="side" value="sell" ${pre && pre.side === 'sell' ? 'checked' : ''}> 卖</label></fieldset>
        <fieldset class="rad"><legend>订单类型</legend><label><input type="radio" name="type" value="market" ${!pre || pre.type === 'market' ? 'checked' : ''}> 市价</label><label><input type="radio" name="type" value="limit" ${pre && pre.type === 'limit' ? 'checked' : ''}> 限价</label></fieldset>
        <div class="fld"><label for="sb-qty">数量（股）</label><input id="sb-qty" name="qty" type="number" inputmode="numeric" min="${M.LIMITS.qtyMin}" max="${M.LIMITS.qtyMax}" step="${M.LIMITS.qtyStep}" value="${pre ? pre.qty : 600}"><small>100–3,000，步长 100</small></div>
        <div class="fld" id="sb-pricefld"><label for="sb-price">限价（美元）</label><input id="sb-price" name="price" type="number" inputmode="decimal" min="49.80" max="50.30" step="0.01" value="${pre && pre.price ? centsToInput(pre.price) : '50.03'}"><small>$49.80–$50.30，步长 $0.01</small></div>
        <button type="submit" class="pri wide" ${ui.busy ? 'disabled' : ''}>提交订单</button>
        ${pre ? `<p class="hint">已按场景填好：${esc(step.text)}。</p>` : ''}
        <p class="err" id="sb-err" role="alert">${ui.msgKind === 'err' ? esc(ui.msg) : ''}</p>
      </form>`;
      const mine = s.view === 'compare' ? [] : s.book.asks.concat(s.book.bids).filter(o => o.owner === 'you');
      h += `<div class="mine"><div class="lab">你的挂单</div>${mine.length ? '<ul>' + mine.map(o => `<li><span>${o.side === 'sell' ? '卖' : '买'} ${f.group(o.qty)} 股 @ ${f.price(o.price)}<small>${o.id} · ${f.clock(o.time)} 提交${o.orig !== o.qty ? ' · 原 ' + f.group(o.orig) + ' 股，已成交 ' + f.group(o.orig - o.qty) : ''}</small></span><button type="button" data-cancel="${o.id}" ${ui.busy ? 'disabled' : ''}>撤单</button></li>`).join('') + '</ul>' : '<p class="muted">没有挂单。限价单未成交的部分会出现在这里。</p>'}
        <p class="muted small">只有你自己的订单有撤单按钮。交易者不能撤销或修改其他参与者的订单。</p></div>`;
    } else {
      h += `<div class="events"><div class="lab">外部市场事件（预定义）</div>
        ${['X1', 'X2', 'X3'].map(id => { const e = M.EVENTS[id]; const next = step && step.kind === 'event' && step.event === id; return `<button type="button" class="ev${next ? ' next' : ''}" data-ev="${id}" ${ui.busy ? 'disabled' : ''}><b>${id} · ${esc(e.name)}</b><small>${esc(e.story)}</small></button>`; }).join('')}
        <p class="muted small">事件只能整体触发；不能挑选、撤销某一张他人订单。要下单，请切回交易者模式。</p>
        <p class="err" role="alert">${ui.msgKind === 'err' ? esc(ui.msg) : ''}</p></div>`;
    }
    $('#sb-panel').innerHTML = h;
    syncPriceField();
  }

  function syncPriceField() {
    const form = $('#sb-form'); if (!form) return;
    const lim = form.querySelector('input[name="type"]:checked').value === 'limit';
    const fld = $('#sb-pricefld'); fld.hidden = !lim; $('#sb-price').disabled = !lim;
  }

  function drawReport() {
    const r = ui.report, el = $('#sb-rep');
    if (!r) { el.hidden = true; return; }
    el.hidden = false;
    const sell = r.side === 'sell';
    const av = r.filledQty ? f.avg(r.totalCents, r.filledQty) : null;
    let diff = '';
    if (r.filledQty && r.lastBefore) {
      const ref = r.lastBefore.price * r.filledQty, d = sell ? ref - r.totalCents : r.totalCents - ref;
      diff = `<p class="diff">按下单时屏幕上的最新成交价 ${f.price(r.lastBefore.price)} 计算，${f.group(r.filledQty)} 股为 ${f.money(ref)}；实际${sell ? '收到' : '花费'} ${f.money(r.totalCents)}，${d === 0 ? '相同' : (d > 0 ? (sell ? '少收 ' : '多付 ') : (sell ? '多收 ' : '少付 ')) + f.money(Math.abs(d))}。</p>`;
    }
    el.innerHTML = `<div class="lab">成交回报${r.book !== 'main' ? ' · ' + bookName(r.book) : ''}${r.owner !== 'you' ? ' · ' + esc(M.ownerName(r.owner)) + '（脚本）' : ''}</div>
      <p class="rep-h">${esc(M.ownerName(r.owner))}${r.type === 'market' ? '市价' : '限价'}${sell ? '卖出' : '买入'} ${f.group(r.qty)} 股${r.limit != null ? '，' + (sell ? '不低于 ' : '不超过 ') + f.price(r.limit) : ''}</p>
      ${r.fills.length ? `<table class="data fills-t"><caption class="sr">逐笔成交</caption><thead><tr><th scope="col">价格</th><th scope="col">对手方</th><th scope="col">股数</th><th scope="col">金额</th></tr></thead><tbody>
        ${r.fills.map(x => `<tr><td>${f.price(x.price)}</td><td>${esc(M.ownerName(x.makerOwner))}${x.makerTime != null && x.makerOwner !== 'you' ? '<small> ' + f.clock(x.makerTime) + '</small>' : ''}</td><td>${f.group(x.qty)}</td><td>${f.money(x.amount)}</td></tr>`).join('')}
        </tbody><tfoot><tr><th scope="row">合计</th><td></td><td>${f.group(r.filledQty)}</td><td>${f.money(r.totalCents)}</td></tr></tfoot></table>
        <p class="avgline">平均价格 = ${f.group(r.totalCents / 100 | 0)}${r.totalCents % 100 ? '.' + String(r.totalCents % 100).padStart(2, '0') : ''} ÷ ${f.group(r.filledQty)} ${av.exact ? '=' : '≈'} <b>${av.text}</b></p>${diff}`
        : '<p class="muted">没有成交。</p>'}
      ${r.rested ? `<p class="rest">剩余 <b>${f.group(r.rested.qty)}</b> 股挂进订单簿：${sell ? '卖' : '买'} @ ${f.price(r.rested.price)}${r.owner === 'you' ? '（你的挂单，可以撤销）' : ''}。</p>` : ''}
      ${r.unfilledCancelled ? `<p class="rest warn">未成交 <b>${f.group(r.unfilledCancelled)}</b> 股按模型规则取消：${sell ? '买方' : '卖方'}已无挂单。真实交易场所对市价单设有价格保护等机制，可能拒绝、限制或部分取消这类订单，本模型只模拟"对手方不足"这一种情况。</p>` : ''}`;
  }

  function drawLog() {
    const s = st(), out = [];
    s.journal.forEach(j => {
      const pre = j.book && j.book !== 'main' ? `<span class="bk">${bookName(j.book)}</span>` : '';
      if (j.kind === 'event') {
        out.push(`<li class="ev"><time>${f.clock(j.time, true)}</time>${pre}<b>外部事件 ${j.event.id}</b>：${esc(j.event.short)}</li>`);
      } else if (j.kind === 'cancel') {
        out.push(`<li class="cx"><time>${f.clock(j.time)}</time>${pre}你撤销自己的挂单 ${j.cancelled.id}：${f.group(j.cancelled.qty)} 股 @ ${f.price(j.cancelled.price)}</li>`);
      } else if (j.kind === 'order') {
        const r = j.report, who = r.owner === 'you' ? '你' : M.ownerName(r.owner) + '（脚本）';
        out.push(`<li class="or"><time>${f.clock(j.time, s.journal.some(x => x.kind === 'event' && x.time % 1000))}</time>${pre}<b>${esc(who)}</b> ${r.type === 'market' ? '市价' : '限价'}${r.side === 'sell' ? '卖出' : '买入'} ${f.group(r.qty)} 股${r.limit != null ? ' @ ' + f.price(r.limit) : ''}</li>`);
        r.fills.forEach(x => out.push(`<li class="fl"><time></time>${pre}成交 ${f.group(x.qty)} 股 @ ${f.price(x.price)} · 主动方：${esc(who)}（${x.aggressor === 'buy' ? '买' : '卖'}）· 对手方：${esc(M.ownerName(x.makerOwner))}</li>`));
        if (r.rested) out.push(`<li class="rs"><time></time>${pre}剩余 ${f.group(r.rested.qty)} 股挂进订单簿 @ ${f.price(r.rested.price)}</li>`);
        if (r.unfilledCancelled) out.push(`<li class="un"><time></time>${pre}未成交 ${f.group(r.unfilledCancelled)} 股按模型规则取消</li>`);
      }
    });
    $('#sb-log').innerHTML = out.join('') || '<li class="muted">还没有操作。</li>';
  }

  function drawScenario() {
    const sc = curScn(), el = $('#sb-scn-panel');
    if (!sc) { el.hidden = true; return; }
    el.hidden = false;
    const s = st();
    const steps = sc.steps.map((x, i) => `<li class="${i < s.step ? 'done' : i === s.step ? 'cur' : ''}"><span>${i < s.step ? '✓' : i + 1}</span>${esc(x.text)}${x.kind === 'event' ? '<em>市场实验</em>' : x.kind === 'scripted' ? '<em>脚本代为提交</em>' : '<em>交易者</em>'}</li>`).join('');
    const step = S.pendingStep();
    let action = '';
    if (step && step.kind === 'scripted') action = `<button type="button" class="pri" data-act="scripted" ${ui.busy ? 'disabled' : ''}>${esc(step.text)}</button><small class="muted">这一步由脚本代为提交，不是你的操作。</small>`;
    else if (step && step.kind === 'event' && s.mode !== 'experiment') action = '<small class="muted">这一步需要市场实验模式。</small>';
    else if (step && step.kind === 'reader' && s.mode !== 'trader') action = '<small class="muted">这一步需要交易者模式。</small>';
    else if (!step) action = `<p class="done-t">场景完成。${sc.after ? esc(sc.after) : ''}</p>`;
    el.innerHTML = `<div class="scn-h"><span class="lab">场景 ${sc.n} · ${esc(sc.lesson)}</span><b>${esc(sc.title)}</b></div>
      <p class="scn-q">${esc(sc.question)}</p><ol class="scn-steps">${steps}</ol><div class="scn-act">${action}</div>
      ${predictBox(sc)}${sc.note ? `<p class="muted small">${esc(sc.note)}</p>` : ''}`;
  }

  /* ---------- 预测（只在五个关键时刻出现，可跳过，可整体关闭） ---------- */
  function predictBox(sc) {
    const p = sc.predict; if (!p) return '';
    const rec = ui.predictions[sc.id];
    const s = st();
    if (rec && rec.done) return compareBox(sc, rec);
    if (!ui.predictOn || rec) return '';
    if (s.step !== p.at) return '';
    return `<form class="pred" data-pred="${sc.id}"><div class="lab">先预测一下（可跳过）</div><p>${esc(p.q)}</p>
      ${p.fields.map(fl => fl.kind === 'choice'
        ? `<fieldset class="rad"><legend>${esc(fl.label)}</legend>${fl.options.map(o => `<label><input type="radio" name="${fl.key}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</fieldset>`
        : `<div class="fld"><label for="pr-${fl.key}">${esc(fl.label)}${fl.kind === 'price' ? '（美元）' : '（股）'}</label><input id="pr-${fl.key}" name="${fl.key}" type="text" inputmode="decimal" autocomplete="off" placeholder="${fl.kind === 'price' ? '例如 50.02' : '例如 600'}"></div>`).join('')}
      <div class="row"><button type="submit" class="pri">记下预测</button><button type="button" data-act="skip-pred">跳过</button></div></form>`;
  }
  function actual(sc) {
    const s = st(), R = s.reports;
    const mine = R.filter(r => r.owner === 'you');
    switch (sc.id) {
      case 'S1': { const r = mine[0]; if (!r) return null; return { avg: f.avg(r.totalCents, r.filledQty).text, last: f.price(s.book.last.price) }; }
      case 'S2': { const r = R.find(x => x.owner === 'buyer2'); if (!r) return null; const d = r.lastAfter.price - r.lastBefore.price; return { dir: d > 0 ? '上升' : d < 0 ? '下降' : '不变' }; }
      case 'S3': { const r = mine[0]; if (!r) return null; return { top: '没变', more: r.totalCents > 3001700 ? '多付' : r.totalCents < 3001700 ? '少付' : '一样' }; }
      case 'S4': { const r = mine[0]; if (!r) return null; return { qty: f.group(r.filledQty) + ' 股', rest: r.rested ? '挂进订单簿等待' : '自动取消' }; }
      case 'S6': { const a = R.find(x => x.book === 'A'), b = R.find(x => x.book === 'B'); if (!a || !b) return null; return { diff: f.avg(b.totalCents * a.filledQty - a.totalCents * b.filledQty, a.filledQty * b.filledQty).text }; } // 每股平均价之差，整数运算
    }
    return null;
  }
  function compareBox(sc, rec) {
    const act = actual(sc);
    if (!act) return `<p class="muted small">已记下你的预测，执行后会并排显示实际结果。</p>`;
    if (rec.skipped) return '';
    return `<div class="cmpbox"><div class="lab">预测与实际（不打分）</div><table class="data"><thead><tr><th scope="col"></th><th scope="col">你的预测</th><th scope="col">实际</th></tr></thead><tbody>
      ${sc.predict.fields.map(fl => `<tr><th scope="row">${esc(fl.label)}</th><td>${esc(rec.v[fl.key] || '—')}</td><td><b>${esc(act[fl.key])}</b></td></tr>`).join('')}</tbody></table></div>`;
  }

  function drawMode() {
    const m = st().mode;
    root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    $('#sb-modenote').hidden = m !== 'experiment';
    document.getElementById('sim').classList.toggle('exp', m === 'experiment');
  }

  function drawAll() {
    $('#sb-clock').textContent = f.clock(st().clock, st().clock % 1000 !== 0);
    $('#sb-scn').value = curScn() ? curScn().id : '';
    drawMode(); drawLadder(); drawThree(); drawPanel(); drawReport(); drawLog(); drawScenario();
  }

  /* ---------- 动画：逐帧播放引擎快照 ---------- */
  function play(res, which) {
    const trace = res.trace || [];
    const before = ui.prevBook;
    ui.report = res.report;
    if (!trace.length || (reduce.matches && !ui.stepMode)) { ui.frame = null; ui.ghost = trace.length ? before : null; drawAll(); announce(res.report); return; }
    // 按价位分组：逐步模式下每吃完一档暂停一次
    const groups = [];
    trace.forEach((t, i) => { const g = groups[groups.length - 1]; if (g && g.price === t.fill.price) g.end = i; else groups.push({ price: t.fill.price, end: i }); });
    ui.busy = true;
    let gi = 0, ti = 0;
    const showFrame = i => { ui.frame = { snap: trace[i].book, ghost: before, book: which }; drawLadder(); drawThree(); };
    const finish = () => { ui.busy = false; ui.frame = null; ui.ghost = before; $('#sb-stepbar').hidden = true; drawAll(); announce(res.report); };
    if (ui.stepMode) {
      drawPanel(); drawScenario();
      const levelDone = () => {
        showFrame(groups[gi].end);
        const fl = trace.slice(gi ? groups[gi - 1].end + 1 : 0, groups[gi].end + 1).map(t => t.fill);
        $('#sb-stepmsg').textContent = `第 ${gi + 1} 档 ${f.price(groups[gi].price)}：` + fl.map(x => `${M.ownerName(x.makerOwner)} ${x.qty} 股`).join('、') + (gi === groups.length - 1 ? '。这是最后一档。' : '。');
        $('#sb-stepbar').hidden = false;
        $('#sb-stepbar button').textContent = gi === groups.length - 1 ? '完成' : '下一档 →';
      };
      ui.nextLevel = () => { gi++; if (gi >= groups.length) { ui.nextLevel = null; finish(); } else levelDone(); };
      levelDone();
      $('#sb-stepbar button').focus();
      return;
    }
    drawPanel();
    const tick = () => { showFrame(ti); ti++; if (ti < trace.length) setTimeout(tick, 420); else setTimeout(finish, 420); };
    tick();
  }

  function announce(r) {
    if (!r) return;
    const parts = [`${M.ownerName(r.owner)}的订单：成交 ${f.group(r.filledQty)} 股`];
    if (r.filledQty) parts.push(`合计 ${f.money(r.totalCents)}，平均 ${f.avg(r.totalCents, r.filledQty).text}`);
    if (r.rested) parts.push(`剩余 ${f.group(r.rested.qty)} 股挂在 ${f.price(r.rested.price)}`);
    if (r.unfilledCancelled) parts.push(`未成交 ${f.group(r.unfilledCancelled)} 股取消`);
    const b = r.book === 'main' ? st().book : st().compare[r.book];
    if (b.last) parts.push(`最新成交价 ${f.price(b.last.price)}`);
    live(parts.join('，') + '。');
  }

  /* ---------- 事件处理 ---------- */
  function fail(msg) { ui.msg = msg; ui.msgKind = 'err'; drawPanel(); live(msg); }
  function clearMsg() { ui.msg = ''; ui.msgKind = ''; }

  root.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    if (t.dataset.mode) { if (ui.busy) return; clearMsg(); S.setMode(t.dataset.mode); drawAll(); live(t.dataset.mode === 'trader' ? '已切换到交易者模式' : '已切换到市场实验模式'); return; }
    if (t.dataset.ev) {
      clearMsg();
      const before = st().book;
      const r = S.trigger(t.dataset.ev);
      if (!r.ok) return fail(r.message);
      ui.report = r.reports && r.reports[0] ? Object.assign({ book: 'main' }, r.reports[0]) : null;
      ui.frame = null; ui.ghost = t.dataset.ev === 'X3' ? null : before;
      drawAll();
      live(`外部事件 ${r.event.id}：${r.event.short}。` + (st().mode === 'trader' ? '已自动切回交易者模式。' : ''));
      return;
    }
    if (t.dataset.cancel) {
      clearMsg();
      const before = st().book;
      const r = S.cancel(t.dataset.cancel);
      if (!r.ok) return fail(r.message);
      ui.ghost = null; ui.frame = null; drawAll();
      live(`已撤销你的挂单 ${r.cancelled.id}，${r.cancelled.qty} 股 @ ${f.price(r.cancelled.price)}。`);
      return;
    }
    const a = t.dataset.act;
    if (a === 'reset') { S.reset(); ui.report = null; ui.ghost = null; ui.frame = null; ui.predictions = {}; clearMsg(); drawAll(); live('已重置为初始订单簿。'); }
    if (a === 'restart') { S.restartScenario(); ui.report = null; ui.ghost = null; ui.frame = null; if (curScn()) delete ui.predictions[curScn().id]; applyScenarioUI(); clearMsg(); drawAll(); live(curScn() ? '场景已重新开始。' : '已重置为初始订单簿。'); }
    if (a === 'scripted') { clearMsg(); ui.prevBook = st().book; const r = S.runScripted(); if (!r.ok) return fail(r.message); play(r, 'main'); }
    if (a === 'next-level' && ui.nextLevel) ui.nextLevel();
    if (a === 'skip-pred') { const sc = curScn(); ui.predictions[sc.id] = { skipped: true, done: true, v: {} }; drawScenario(); }
  });

  root.addEventListener('change', e => {
    if (e.target.id === 'sb-scn') { loadScenario(e.target.value); return; }
    if (e.target.id === 'sb-det') { ui.details = e.target.checked; drawLadder(); }
    if (e.target.id === 'sb-step') { ui.stepMode = e.target.checked; }
    if (e.target.id === 'sb-pred') { ui.predictOn = e.target.checked; drawScenario(); }
    if (e.target.name === 'type') syncPriceField();
  });

  root.addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    if (form.classList.contains('pred')) {
      const sc = curScn(), v = {};
      sc.predict.fields.forEach(fl => {
        if (fl.kind === 'choice') { const c = form.querySelector(`input[name="${fl.key}"]:checked`); v[fl.key] = c ? c.value : ''; }
        else { const raw = form.querySelector(`[name="${fl.key}"]`).value.trim(); const p = parsePrice(raw); v[fl.key] = raw ? (fl.kind === 'price' && p != null ? f.price(p) : raw + (fl.kind === 'shares' ? ' 股' : '')) : ''; }
      });
      ui.predictions[sc.id] = { v: v, done: true };
      drawScenario(); live('已记下你的预测。');
      return;
    }
    if (form.id !== 'sb-form' || ui.busy) return;
    clearMsg();
    const fd = new FormData(form);
    const type = fd.get('type');
    const qtyRaw = String(fd.get('qty') || '').trim();
    const qty = /^\d+$/.test(qtyRaw) ? parseInt(qtyRaw, 10) : NaN;
    const price = type === 'limit' ? parsePrice(fd.get('price')) : undefined;
    if (type === 'limit' && price == null) return fail('限价格式不对，请输入例如 50.03');
    const which = st().view === 'compare' ? fd.get('bk') : undefined;
    ui.lastBook = which;
    const sc = curScn();
    if (sc && sc.predict && ui.predictOn && st().step === sc.predict.at && !ui.predictions[sc.id]) ui.predictions[sc.id] = { skipped: true, done: true, v: {} }; // 没填就当跳过
    ui.prevBook = which ? st().compare[which] : st().book;
    const r = S.submit({ side: fd.get('side'), type: type, qty: qty, price: price }, which);
    if (!r.ok) return fail(r.message);
    play(r, which || 'main');
  });

  function applyScenarioUI() {
    const sc = curScn();
    if (sc && sc.details) { ui.details = true; $('#sb-det').checked = true; }
  }
  function loadScenario(id) {
    if (ui.busy) return;
    clearMsg(); ui.report = null; ui.ghost = null; ui.frame = null;
    if (!id) { S.reset(); } else { S.loadScenario(id); delete ui.predictions[id]; }
    if (id === 'S2') { ui.report = st().reports[0] ? Object.assign({}, st().reports[0]) : null; }
    applyScenarioUI();
    drawAll();
    live(id ? `已载入场景 ${curScn().n}：${curScn().title}。${curScn().question}` : '自由练习：初始订单簿。');
  }

  // 课文中的"在沙盘里试试"链接
  document.querySelectorAll('a[data-scenario]').forEach(a => a.addEventListener('click', () => {
    if (ui.busy) return;
    loadScenario(a.dataset.scenario);
    setTimeout(() => { const sel = $('#sb-scn'); if (sel) sel.focus({ preventScroll: true }); }, 400);
  }));

  drawAll();

  // 沙盘在屏幕上时，两侧固定栏（目录、读图注释）淡出让位，避免与加宽的沙盘重叠。
  const reader = document.querySelector('.reader'), lab = document.getElementById('lab');
  if (reader && lab && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => reader.classList.toggle('lab-on', e.isIntersecting)),
      { rootMargin: '-80px 0px 0px 0px' }).observe(lab);
  }
  window.__sandbox = { session: S, ui: ui }; // 供浏览器测试读取状态
})();
