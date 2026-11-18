/* S02-02 浏览器测试：真实 Chrome（无头）＋ Chrome DevTools Protocol，不依赖任何 npm 包。
 * 运行：node --test site/tests/browser.test.js
 * 需要：本机 Chrome（默认 C:/Program Files/Google/Chrome/Application/chrome.exe，可用 CHROME 环境变量覆盖）；
 *       课文开场照片和字体来自网络（Wikimedia、Google Fonts）。
 * 输出：截图写入 site/shots/。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');           // E:/MarketPilot
const SHOTS = path.resolve(__dirname, '..', 'shots');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = '/site/lessons/S02-02/index.html';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

let server, base, chrome, ws, msgId = 0;
const pending = new Map(), events = [];

function startServer() {
  return new Promise(res => {
    server = http.createServer((req, rsp) => {
      const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
      if (!p.startsWith(ROOT)) { rsp.writeHead(403); return rsp.end(); }
      fs.readFile(p, (err, buf) => {
        if (err) { rsp.writeHead(404); return rsp.end('not found'); }
        rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); rsp.end(buf);
      });
    }).listen(0, '127.0.0.1', () => { base = 'http://127.0.0.1:' + server.address().port; res(); });
  });
}

async function startChrome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-chrome-'));
  const port = 9300 + Math.floor(Math.random() * 400);
  chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--user-data-dir=' + dir, 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); if (targets.length) break; } catch (e) {} await sleep(200); }
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
    else if (m.method) events.push(m);
  };
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable');
}
function cdp(method, params) { return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params: params || {} })); }); }
async function evaluate(expr) {
  const r = await cdp('Runtime.evaluate', { expression: '(async()=>{' + expr + '})()', awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('页面脚本出错：' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
  return r.result.value;
}
async function viewport(w, h, mobile) { await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile }); }
async function load(url) {
  events.length = 0;
  await cdp('Page.navigate', { url: base + url });
  for (let i = 0; i < 100; i++) { await sleep(150); const ok = await evaluate('return document.readyState==="complete" && !!document.getElementById("sb-log")').catch(() => false); if (ok) break; }
  await evaluate('await document.fonts.ready; await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r}))); return 1');
  await sleep(300);
}
async function shot(name, fullPage) {
  fs.mkdirSync(SHOTS, { recursive: true });
  let clip;
  if (fullPage) {
    const m = await cdp('Page.getLayoutMetrics');
    const sz = m.cssContentSize || m.contentSize;
    clip = { x: 0, y: 0, width: sz.width, height: sz.height, scale: 1 };
  }
  const r = await cdp('Page.captureScreenshot', Object.assign({ format: 'png', captureBeyondViewport: !!fullPage }, clip ? { clip } : {}));
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
}
async function shotOf(sel, name, pad) {
  const box = await evaluate(`const e=document.querySelector(${JSON.stringify(sel)});e.scrollIntoView({block:'start'});await new Promise(r=>setTimeout(r,200));const b=e.getBoundingClientRect();return {x:b.left+scrollX,y:b.top+scrollY,w:b.width,h:b.height}`);
  pad = pad || 12;
  const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2, scale: 1 } });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
}
const errorsSeen = () => events.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
  .map(e => JSON.stringify(e.params).slice(0, 300));

/* 在页面里驱动沙盘的小工具（只通过界面元素操作，不直接调用会话层） */
const UI = `
  const R=document.getElementById('sim-root');
  const q=s=>R.querySelector(s);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const idle=async()=>{for(let i=0;i<60;i++){if(!window.__sandbox.ui.busy)return;await wait(100);} throw new Error('动画没有结束');};
  const pick=async id=>{const s=q('#sb-scn');s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(50);};
  const submit=async()=>{q('#sb-form button[type=submit]').click();await wait(60);await idle();};
  const text=s=>(q(s)||{}).textContent||'';
`;

test.before(async () => { await startServer(); await startChrome(); });
test.after(() => { try { ws.close(); } catch (e) {} try { chrome.kill(); } catch (e) {} server.close(); });

test('桌面 1280：页面加载无报错，五张图、九道小题与沙盘已渲染，图不自动播放', async () => {
  await viewport(1280, 900);
  await load(PAGE);
  const r = await evaluate(`return {figs:[...document.querySelectorAll('.pf')].map(f=>[f.id,f.querySelector('.pf-stage').children.length,f.dataset.step]),
    quizzes:document.querySelectorAll('.quiz.js').length, auction:document.querySelector('[data-viz=auction]').children.length,
    sim:!document.getElementById('sim-root').hidden, imgs:[...document.images].map(i=>i.naturalWidth),
    over:document.documentElement.scrollWidth-innerWidth, h1:document.querySelector('h1').textContent,
    status:!!document.querySelector('.chip.st'), statusText:/未公开发布|待审核|审核版本/.test(document.body.innerText),
    stepsShown:[...document.querySelectorAll('.pf-steps')].map(e=>getComputedStyle(e).display)}`);
  assert.deepEqual(errorsSeen(), []);
  assert.deepEqual(r.figs.map(x => x[0]), ['fig1', 'fig2', 'fig3', 'fig4', 'fig5']);
  r.figs.forEach(([id, n, step]) => { assert.ok(n > 0, '图为空：' + id); assert.equal(step, '1', id + ' 初始应停在第 1 步'); });
  assert.equal(r.quizzes, 9);
  assert.ok(r.auction > 0);
  assert.ok(r.sim);
  assert.ok(r.imgs.every(w => w > 0), '有图片没有加载');
  assert.ok(r.over <= 0, '桌面出现横向滚动：' + r.over);
  assert.equal(r.h1, '股价到底是谁决定的？');
  assert.equal(r.status, false, '已编写的课程不再显示状态标签');
  assert.equal(r.statusText, false, '页面不应出现「未公开发布 / 待审核」');
  assert.ok(r.stepsShown.every(d => d === 'none'), '动画模式下不应提前列出全部步骤（会泄露结果）');
  await shot('S02-02-desktop-hero', false);
  await shot('S02-02-desktop-full', true);
  await shotOf('#s1', 'S02-02-desktop-intro');
  await shotOf('#fig1', 'S02-02-desktop-fig1-start');
  await evaluate('document.documentElement.style.scrollBehavior="auto"; return 1');
  // 不自动播放：滚到图上、等 3.5 秒，仍停在第 1 步
  const still = await evaluate(`for (const f of document.querySelectorAll('.pf')) { f.scrollIntoView({block:'center'}); }
    await new Promise(r=>setTimeout(r,3500)); return [...document.querySelectorAll('.pf')].map(f=>f.dataset.step)`);
  assert.deepEqual(still, ['1', '1', '1', '1', '1']);
});

const FIG = `
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const fig=id=>document.getElementById(id);
  const go=async(id,a)=>{fig(id).querySelector('[data-a='+a+']').click(); await wait(30);};
  const now=id=>fig(id).querySelector('.pf-now').textContent;
`;

test('图 1：逐步出现，最后才出现最新成交价小票；第 7 步说明与课文一致', async () => {
  const r = await evaluate(FIG + `const out=[]; const on=()=>[...fig('fig1').querySelectorAll('svg .st.on')].length;
    out.push([fig('fig1').dataset.step,on()]);
    for(let i=0;i<7;i++){await go('fig1','next'); out.push([fig('fig1').dataset.step,on()]);}
    return {out,last:now('fig1'),next:fig('fig1').querySelector('[data-a=next]').disabled,
      ticket7:fig('fig1').querySelector('svg .st[data-s="8"]').classList.contains('on')}`);
  assert.deepEqual(r.out.map(x => x[0]), ['1', '2', '3', '4', '5', '6', '7', '8']);
  for (let i = 1; i < r.out.length; i++) assert.ok(r.out[i][1] >= r.out[i - 1][1], '显示的元素不应减少');
  assert.match(r.last, /最新成交价/); assert.match(r.last, /是记录，不是报价/);
  assert.equal(r.next, true); assert.equal(r.ticket7, true);
  await shotOf('#fig1', 'S02-02-desktop-fig1');
  const back = await evaluate(FIG + `await go('fig1','again'); return [fig('fig1').dataset.step, fig('fig1').querySelector('svg .st[data-s="8"]').classList.contains('on')]`);
  assert.deepEqual(back, ['1', false]);
});

test('图 3：小林的 600 股逐档成交，与撮合引擎一致；合计和平均价到最后一步才出现', async () => {
  const r = await evaluate(FIG + `const q=s=>fig('fig3').querySelector(s); const st=()=>({step:fig('fig3').dataset.step,need:q('.need').textContent,got:q('.got').textContent,cost:q('.cost').textContent,lp:q('.lp').textContent,
      avg:getComputedStyle(q('.cl-avg')).visibility, notes:[...fig('fig3').querySelectorAll('.cl-note')].filter(n=>!n.hidden).length});
    const out=[st()]; for(let i=0;i<4;i++){await go('fig3','next'); out.push(st());}
    return {out, txt:now('fig3'), steps:[...fig('fig3').querySelectorAll('.pf-steps li')].map(l=>l.textContent)}`);
  assert.deepEqual(r.out.map(x => [x.need, x.got, x.cost, x.lp, x.avg, x.notes]), [
    ['600', '0', '$0', '$50.01', 'hidden', 0],
    ['400', '200', '$10,004', '$50.01', 'hidden', 1],
    ['100', '500', '$25,013', '$50.01', 'hidden', 2],
    ['0', '600', '$30,017', '$50.01', 'hidden', 3],
    ['0', '600', '$30,017', '$50.04', 'visible', 3]]);
  assert.match(r.txt, /合计 \$30,017，平均每股 ≈?\$50\.0283/);
  assert.equal(r.steps.length, 4);
  await evaluate(FIG + `await go('fig3','again'); await go('fig3','next'); await go('fig3','next'); return 1`);
  await shotOf('#fig3', 'S02-02-desktop-fig3-running');
  await evaluate(FIG + `await go('fig3','next'); await go('fig3','next'); return 1`);
  await shotOf('#fig3', 'S02-02-desktop-fig3-done');
});

test('图 4：卖一不变、深度 1,500 → 800、结果 $30,017 → $30,028；结果在第 5 步之前不可见', async () => {
  const r = await evaluate(FIG + `const vis=s=>[...fig('fig4').querySelectorAll(s)].map(e=>e.classList.contains('on'));
    const a={res:vis('.cx-res'),dep:vis('.cx-dep')};
    for(let i=0;i<3;i++) await go('fig4','next');
    const b={res:vis('.cx-res'),dep:vis('.cx-dep'),txt:now('fig4')};
    await go('fig4','next');
    return {a,b,c:{res:vis('.cx-res'),txt:now('fig4'),text:fig('fig4').querySelector('.cx').textContent}}`);
  assert.deepEqual(r.a.res, [false, false]); assert.deepEqual(r.a.dep, [false, false]);
  assert.deepEqual(r.b.res, [false, false]); assert.deepEqual(r.b.dep, [true, true]);
  assert.match(r.b.txt, /从 1,500 股变成 800 股/);
  assert.deepEqual(r.c.res, [true, true]);
  assert.match(r.c.txt, /撤单前花 \$30,017.*花 \$30,028，多付 \$11/);
  for (const s of ['$30,017', '$30,028', '1,500', '800']) assert.ok(r.c.text.includes(s), '图 4 缺少 ' + s);
  await shotOf('#fig4', 'S02-02-desktop-fig4');
});

test('图 5：两所合起来，买一 $50.00（甲所）、卖一 $50.01（乙所）、价差 $0.01', async () => {
  const r = await evaluate(FIG + `for(let i=0;i<3;i++) await go('fig5','next'); return {txt:now('fig5'),svg:fig('fig5').querySelector('svg').textContent}`);
  assert.match(r.txt, /买一 \$50\.00，卖一 \$50\.01，价差只有 \$0\.01/);
  assert.match(r.svg, /来自甲所/); assert.match(r.svg, /来自乙所/);
  await shotOf('#fig5', 'S02-02-desktop-fig5');
});

test('小题：答错只给提示、可以再选；答对或点“看答案”才显示答案（九道都检查）', async () => {
  const r = await evaluate(`const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out=[];
    for (const el of document.querySelectorAll('.quiz')) {
      const right=+el.dataset.answer, radios=[...el.querySelectorAll('input[type=radio]')];
      const hint=el.querySelector('.qhint'), ans=el.querySelector('.qans'), check=el.querySelector('[data-a=check]'), show=el.querySelector('[data-a=show]');
      const s0={hint:hint.hidden,ans:ans.hidden};
      const wrong=radios.findIndex((x,i)=>i!==right); radios[wrong].click(); check.click(); await wait(10);
      const s1={hint:hint.hidden,ans:ans.hidden,state:el.dataset.state,enabled:radios.every(x=>!x.disabled),rightMarked:!!el.querySelector('label.right')};
      radios[right].click(); check.click(); await wait(10);
      const s2={hint:hint.hidden,ans:ans.hidden,state:el.dataset.state};
      out.push({id:el.id,n:radios.length,s0,s1,s2});
    }
    const q9=document.getElementById('q9'); q9.querySelectorAll('label').forEach(l=>l.classList.remove('right')); q9.querySelector('.qans').hidden=true;
    q9.querySelector('[data-a=show]').click(); await wait(10);
    return {out, shown:!q9.querySelector('.qans').hidden && !!q9.querySelector('label.right')}`);
  assert.equal(r.out.length, 9);
  r.out.forEach(q => {
    assert.ok(q.n >= 2, q.id + ' 选项太少');
    assert.deepEqual(q.s0, { hint: true, ans: true }, q.id + ' 初始不应显示提示或答案');
    assert.deepEqual(q.s1, { hint: false, ans: true, state: 'wrong', enabled: true, rightMarked: false }, q.id + ' 答错时应只给提示');
    assert.deepEqual(q.s2, { hint: true, ans: false, state: 'right' }, q.id + ' 答对后应显示答案');
  });
  assert.equal(r.shown, true);
  await evaluate(`const el=document.getElementById('q1'); el.querySelector('.qans').hidden=true; el.querySelectorAll('label').forEach(l=>l.classList.remove('right'));
    el.querySelectorAll('input')[1].click(); el.querySelector('[data-a=check]').click(); return 1`);
  await shotOf('#q1', 'S02-02-desktop-quiz-wrong');
});

test('阅读体验：目录随滚动高亮、进度条前进、点目录后焦点落在该节标题', async () => {
  await viewport(1280, 900);
  await load(PAGE);
  const r = await evaluate(`const wait=ms=>new Promise(r=>setTimeout(r,ms));
    document.documentElement.style.scrollBehavior='auto';
    const s5=document.getElementById('s5'); scrollTo(0, s5.getBoundingClientRect().top+scrollY-60); await wait(200);
    const cur=document.querySelector('#toc a[aria-current]').getAttribute('href');
    const p=+getComputedStyle(document.getElementById('rprog')).transform.split(',')[0].replace('matrix(','');
    document.querySelector('#toc a[href="#s7"]').click(); for(let i=0;i<40;i++){await wait(100); if(Math.abs(document.getElementById('s7').getBoundingClientRect().top-84)<2) break;} await wait(150);
    const act=document.activeElement.id, cur2=document.querySelector('#toc a[aria-current]').getAttribute('href');
    const top=document.getElementById('h-s7').getBoundingClientRect().top;
    return {cur,p,act,cur2,top,hash:location.hash,secTop:document.getElementById('s7').getBoundingClientRect().top}`);
  assert.equal(r.cur, '#s5');
  assert.ok(r.p > 0.1 && r.p < 0.9, '进度条位置异常：' + r.p);
  assert.equal(r.act, 'h-s7'); assert.equal(r.cur2, '#s7', '当前节判断错误，s7 顶部位置：' + r.secTop); assert.equal(r.hash, '#s7');
  assert.ok(r.top >= 60 && r.top < 200, '标题被页头遮住或离得太远：' + r.top);
});

test('沙盘场景 1：界面显示的成交回报与方案一致', async () => {
  const r = await evaluate(UI + `await pick('S1');
    const pre={q:q('#sb-qty').value,type:q('input[name=type]:checked').value};
    await submit();
    return {pre, rep:text('#sb-rep'), three:text('#sb-three'), log:text('#sb-log')}`);
  assert.deepEqual(r.pre, { q: '600', type: 'market' });
  for (const s of ['$50.02', '$10,004', '$5,003', '$10,006', '$5,004', '$30,017', '$50.0283', '多付 $11']) assert.ok(r.rep.includes(s), '回报缺少 ' + s);
  assert.match(r.three, /最新成交价 · 记录\$50\.04/);
  assert.match(r.three, /卖一 · 报价\$50\.04× 300/);
  assert.match(r.three, /价差 \$0\.04/);
  assert.match(r.log, /10:00:00你 市价买入 600 股/);
});

test('沙盘场景 2：挂单不改最新成交价；脚本买入后下降；只能撤自己的单', async () => {
  const r = await evaluate(UI + `await pick('S2');
    await submit();
    const a={three:text('#sb-three'), cancels:R.querySelectorAll('[data-cancel]').length};
    q('[data-act=scripted]').click(); await wait(60); await idle();
    const b={three:text('#sb-three'), rep:text('#sb-rep')};
    R.querySelector('[data-cancel]').click(); await wait(60);
    const c={three:text('#sb-three'), cancels:R.querySelectorAll('[data-cancel]').length, log:text('#sb-log')};
    return {a,b,c}`);
  assert.match(r.a.three, /记录\$50\.04/); assert.match(r.a.three, /卖一 · 报价\$50\.01× 200/); assert.match(r.a.three, /价差 \$0\.01/);
  assert.equal(r.a.cancels, 1); // 只有读者自己的一张挂单有撤单按钮
  assert.match(r.b.three, /记录\$50\.01/); assert.match(r.b.three, /卖一 · 报价\$50\.01× 100/);
  assert.match(r.b.rep, /另一位买家（脚本）/);
  assert.match(r.c.three, /卖一 · 报价\$50\.04× 300/); assert.equal(r.c.cancels, 0);
  assert.match(r.c.log, /你撤销自己的挂单 Y2：100 股 @ \$50\.01/);
});

test('沙盘场景 3：实验模式触发 X1，顶部不变、深度 1,500 → 800，自动切回交易者', async () => {
  const r = await evaluate(UI + `await pick('S3');
    const m0=q('[data-mode=experiment]').getAttribute('aria-pressed'); const d0=text('#sb-three');
    const hasForm=!!q('#sb-form');
    q('[data-ev=X1]').click(); await wait(60);
    const m1=q('[data-mode=trader]').getAttribute('aria-pressed'); const d1=text('#sb-three'); const log=text('#sb-log');
    await submit();
    return {m0,hasForm,d0,m1,d1,log,rep:text('#sb-rep'),three:text('#sb-three')}`);
  assert.equal(r.m0, 'true'); assert.equal(r.hasForm, false); // 实验模式下没有下单表单
  assert.match(r.d0, /卖一上方 \$0\.05 内 1,500 股/);
  assert.equal(r.m1, 'true');
  assert.match(r.d1, /卖一 · 报价\$50\.02× 200/); assert.match(r.d1, /卖一上方 \$0\.05 内 800 股/);
  assert.match(r.log, /10:00:00\.000外部事件 X1：C、G、D 撤单/);
  for (const s of ['$10,004', '$20,024', '$30,028', '$50.0467']) assert.ok(r.rep.includes(s), '回报缺少 ' + s);
  assert.match(r.three, /记录\$50\.06/); assert.match(r.three, /卖一 · 报价\$50\.06× 200/);
});

test('沙盘场景 4、5、7', async () => {
  const r = await evaluate(UI + `
    await pick('S4'); const lp=q('#sb-price').value; await submit(); const s4={lp,rep:text('#sb-rep'),three:text('#sb-three'),mine:text('.mine')};
    await pick('S5'); const det=q('#sb-det').checked; await submit(); const s5={det,rep:text('#sb-rep'),three:text('#sb-three'),lad:text('#sb-lad')};
    await pick('S7'); await submit(); const s7={rep:text('#sb-rep'),three:text('#sb-three'),lad:text('#sb-lad')};
    return {s4,s5,s7}`);
  assert.equal(r.s4.lp, '50.03');
  for (const s of ['$25,013', '$50.026', '剩余 100 股挂进订单簿']) assert.ok(r.s4.rep.includes(s), '场景 4 缺少 ' + s);
  assert.match(r.s4.three, /买一 · 报价\$50\.03× 100/); assert.match(r.s4.three, /卖一 · 报价\$50\.04× 400/); assert.match(r.s4.three, /记录\$50\.03/);
  assert.equal(r.s5.det, true);
  assert.match(r.s5.rep, /\$50\.00H.*09:58:10.*100.*\$50\.00J.*09:59:40.*100/);
  assert.match(r.s5.three, /买一 · 报价\$50\.00× 100/); assert.match(r.s5.lad, /J 100/);
  for (const s of ['$75,065', '$50.0433', '未成交 1,000 股按模型规则取消']) assert.ok(r.s7.rep.includes(s), '场景 7 缺少 ' + s);
  assert.match(r.s7.lad, /卖方已无挂单/); assert.match(r.s7.three, /记录\$50\.06/);
});

test('沙盘场景 6（选做 · 下一课预告）：两本订单簿', async () => {
  const r = await evaluate(UI + `await pick('S6'); q('[data-ev=X3]').click(); await wait(60);
    await submit(); const a=text('#sb-rep');
    q('input[name=bk][value=B]').click(); await submit(); const b=text('#sb-rep');
    return {a,b,three:text('#sb-three'),pred:text('#sb-scn-panel')}`);
  for (const s of ['$50,010', '$50.010']) assert.ok(r.a.includes(s));
  for (const s of ['$50.05', '$50.20', '$50.40', '$50.80', '$50,485', '$50.485']) assert.ok(r.b.includes(s));
  assert.match(r.three, /股票 A[\s\S]*记录\$50\.01[\s\S]*股票 B[\s\S]*记录\$50\.80/);
  assert.match(r.pred, /选做/); assert.match(r.pred, /下一课/);
});

test('权限：界面上只有读者自己的订单有撤单按钮；实验模式不能下单', async () => {
  const r = await evaluate(UI + `q('[data-act=reset]').click(); await wait(30);
    const none=R.querySelectorAll('[data-cancel]').length;
    q('#sb-qty').value='300'; R.querySelector('input[name=type][value=limit]').click(); q('#sb-price').value='49.90'; await submit();
    const one=[...R.querySelectorAll('[data-cancel]')].map(b=>b.dataset.cancel);
    q('[data-mode=experiment]').click(); await wait(30);
    return {none,one,form:!!q('#sb-form'),cancelInExp:R.querySelectorAll('[data-cancel]').length}`);
  assert.equal(r.none, 0); assert.deepEqual(r.one, ['Y1']); assert.equal(r.form, false); assert.equal(r.cancelInExp, 0);
});

test('重置：回到初始订单簿与 10:00:00', async () => {
  const r = await evaluate(UI + `q('[data-mode=trader]').click(); await wait(20); q('#sb-qty').value='2500'; R.querySelector('input[name=type][value=market]').click(); await submit();
    q('[data-act=reset]').click(); await wait(30);
    return {three:text('#sb-three'),clock:text('#sb-clock'),log:text('#sb-log'),rep:q('#sb-rep').hidden}`);
  assert.match(r.three, /记录\$50\.01/); assert.match(r.three, /卖一 · 报价\$50\.02× 200/); assert.match(r.three, /卖一上方 \$0\.05 内 1,500 股/);
  assert.equal(r.clock, '10:00:00'); assert.match(r.log, /还没有操作/); assert.equal(r.rep, true);
});

test('逐步模式：每吃完一档暂停，画面与引擎快照一致', async () => {
  const r = await evaluate(UI + `await pick('S1'); q('#sb-step').click(); await wait(20);
    q('#sb-form button[type=submit]').click(); await wait(60);
    const out=[];
    for(let i=0;i<4 && window.__sandbox.ui.busy;i++){ out.push([text('#sb-stepmsg'), (text('#sb-three').match(/卖一 · 报价(\\$[\\d.]+)× ([\\d,]+)/)||[]).slice(1).join(' ')]); q('[data-act=next-level]').click(); await wait(40); }
    q('#sb-step').click();
    return {out,busy:window.__sandbox.ui.busy,rep:text('#sb-rep')}`);
  assert.deepEqual(r.out.map(x => x[1]), ['$50.03 300', '$50.04 400', '$50.04 300']);
  assert.match(r.out[0][0], /第 1 档 \$50\.02：B 200 股/);
  assert.match(r.out[1][0], /第 2 档 \$50\.03：C 100 股、G 200 股/);
  assert.match(r.out[2][0], /第 3 档 \$50\.04：D 100 股。这是最后一档/);
  assert.equal(r.busy, false); assert.match(r.rep, /\$30,017/);
});

test('键盘：可以只用键盘完成场景 1，焦点清晰可见', async () => {
  await load(PAGE);
  const first = await (async () => { await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); return evaluate('return document.activeElement.className+"|"+document.activeElement.textContent'); })();
  assert.match(first, /^skip\|跳到正文/);
  // 逐个 Tab，直到焦点到达场景下拉框，并检查途经的每个控件都有可见的焦点样式
  const seen = [];
  let reached = false;
  for (let i = 0; i < 160 && !reached; i++) {
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    const info = await evaluate(`const e=document.activeElement;const cs=getComputedStyle(e);return {id:e.id,tag:e.tagName,outline:cs.outlineStyle,ow:cs.outlineWidth,box:cs.boxShadow}`);
    seen.push(info);
    if (info.id === 'sb-scn') reached = true;
  }
  assert.ok(reached, 'Tab 无法到达沙盘');
  const invisible = seen.filter(s => s.outline === 'none' && s.box === 'none');
  assert.deepEqual(invisible, [], '有控件聚焦时没有可见样式');
  // 用键盘选择场景 1 并提交
  const r = await evaluate(UI + `q('#sb-scn').focus(); return 1`);
  await evaluate(UI + `const s=q('#sb-scn'); s.value='S1'; s.dispatchEvent(new Event('change',{bubbles:true})); q('#sb-form button[type=submit]').focus(); return 1`);
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  const rep = await evaluate(UI + `await wait(60); await idle(); return text('#sb-rep')`);
  assert.match(rep, /\$30,017/);
});

test('减少动态效果：图直接显示带圈号的静态版，沙盘提交后直接显示最终状态', async () => {
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load(PAGE);
  const r = await evaluate(UI + `await pick('S1'); q('#sb-form button[type=submit]').click(); await wait(20);
    const f3=document.getElementById('fig3');
    return {busy:window.__sandbox.ui.busy, rep:text('#sb-rep'), stat:document.body.classList.contains('static'),
      ctrl:getComputedStyle(document.querySelector('.pf-ctrl')).display, steps:[...document.querySelectorAll('.pf-steps')].map(e=>getComputedStyle(e).display),
      hidden:[...document.querySelectorAll('.pf .st')].filter(e=>getComputedStyle(e).opacity!=='1').length,
      badges:getComputedStyle(document.querySelector('.pf .badge')).display,
      lp:f3.querySelector('.lp').textContent, trans:getComputedStyle(document.querySelector('.pf .st')).transitionDuration,
      anim:getComputedStyle(document.querySelector('.hot'),'::before').animationName, sb:getComputedStyle(document.documentElement).scrollBehavior}`);
  assert.equal(r.busy, false); assert.match(r.rep, /\$30,017/); assert.equal(r.anim, 'none');
  assert.equal(r.stat, true); assert.equal(r.ctrl, 'none');
  assert.ok(r.steps.every(d => d === 'flex'));
  assert.equal(r.hidden, 0); assert.equal(r.badges, 'inline');
  assert.equal(r.lp, '$50.04'); assert.match(r.trans, /^0s/); assert.equal(r.sb, 'auto');
  await shotOf('#fig4', 'S02-02-reduced-fig4-static');
  await cdp('Emulation.setEmulatedMedia', { features: [] });
});

test('打印：静态版图、显示小题提示与答案、隐藏控制条与沙盘', async () => {
  await load(PAGE);
  await cdp('Emulation.setEmulatedMedia', { media: 'print' });
  const r = await evaluate(`return {ctrl:getComputedStyle(document.querySelector('.pf-ctrl')).display, steps:getComputedStyle(document.querySelector('.pf-steps')).display,
    hidden:[...document.querySelectorAll('.pf .st')].filter(e=>getComputedStyle(e).opacity!=='1').length,
    hint:getComputedStyle(document.querySelector('.quiz .qhint')).display, ans:getComputedStyle(document.querySelector('.quiz .qans')).display,
    lab:getComputedStyle(document.getElementById('lab')).display, toc:getComputedStyle(document.querySelector('.ltoc')).display}`);
  assert.equal(r.ctrl, 'none'); assert.equal(r.steps, 'flex'); assert.equal(r.hidden, 0);
  assert.equal(r.hint, 'block'); assert.equal(r.ans, 'block'); assert.equal(r.lab, 'none'); assert.equal(r.toc, 'none');
  await cdp('Emulation.setEmulatedMedia', { media: '' });
  const pdf = await cdp('Page.printToPDF', { printBackground: true, preferCSSPageSize: false });
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.writeFileSync(path.join(SHOTS, 'S02-02-print.pdf'), Buffer.from(pdf.data, 'base64'));
  const after = await evaluate('return document.body.classList.contains("static")');
  assert.equal(after, false, '打印结束后应恢复动画模式');
});

test('手机 390：无横向滚动，单栏布局，图与沙盘可用', async () => {
  await viewport(390, 844, true);
  await load(PAGE);
  const r = await evaluate(UI + `const over=document.documentElement.scrollWidth-innerWidth;
    const wide=[...document.querySelectorAll('article *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1 && !e.closest('.tblwrap') && !e.closest('details:not([open])')).slice(0,5).map(e=>e.tagName+'.'+e.className);
    const f1=document.querySelector('#fig1 svg').getAttribute('viewBox');
    await pick('S1'); await submit();
    return {over,wide,f1,rep:text('#sb-rep'),cols:getComputedStyle(document.querySelector('.reader')).gridTemplateColumns.split(' ').length}`);
  assert.ok(r.over <= 0, '手机出现横向滚动：' + r.over + ' ' + r.wide.join(','));
  assert.deepEqual(r.wide, []);
  assert.equal(r.f1, '0 0 380 610', '手机上图 1 应换成竖向');
  assert.equal(r.cols, 1);
  assert.match(r.rep, /\$30,017/);
  await evaluate('document.querySelector("[data-act=reset]").click(); scrollTo(0,0); return 1');
  await shot('S02-02-mobile-full', true);
  await shot('S02-02-mobile-top', false);
  await shotOf('#s2', 'S02-02-mobile-reading', 0);
  for (const [sel, name] of [['#fig1', 'fig1'], ['#fig2', 'fig2'], ['#fig4', 'fig4'], ['#fig5', 'fig5'], ['#q1', 'quiz']]) await shotOf(sel, 'S02-02-mobile-' + name, 6);
  await evaluate(`const f=document.getElementById('fig3'); const n=f.querySelector('[data-a=next]'); n.click(); n.click(); return 1`);
  await shotOf('#fig3', 'S02-02-mobile-fig3-running', 6);
  await evaluate(UI + `await pick('S3'); q('[data-ev=X1]').click(); await wait(50); await submit(); return 1`);
  await shotOf('#sim', 'S02-02-mobile-sandbox-S3', 6);
  await viewport(1280, 900);
  await load(PAGE);
  await evaluate(UI + `await pick('S1'); await submit(); return 1`);
  await shotOf('#sim', 'S02-02-desktop-sandbox-S1', 8);
  await evaluate(UI + `await pick('S6'); q('[data-ev=X3]').click(); await wait(50); await submit(); q('input[name=bk][value=B]').click(); await submit(); return 1`);
  await shotOf('#sim', 'S02-02-desktop-sandbox-S6', 8);
  assert.deepEqual(errorsSeen(), []);
});
