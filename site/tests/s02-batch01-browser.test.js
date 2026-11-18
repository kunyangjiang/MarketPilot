/* S02 第一批（S02-01、S02-03、S02-04）浏览器测试：真实 Chrome（无头）＋ Chrome DevTools Protocol，不依赖任何 npm 包。
 * 运行：node --test site/tests/s02-batch01-browser.test.js
 * 需要：本机 Chrome（可用 CHROME 环境变量覆盖）；开场照片和字体需要联网。
 * 输出：截图与 PDF 写入 site/shots/。CDP 小工具复制自 s0903-browser.test.js。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SHOTS = path.resolve(__dirname, '..', 'shots');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const P = id => '/site/lessons/' + id + '/index.html';
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
  for (let i = 0; i < 100; i++) { await sleep(150); const ok = await evaluate('return document.readyState==="complete" && !!window.LessonSteps').catch(() => false); if (ok) break; }
  await evaluate('await document.fonts.ready; return 1');
  await evaluate('document.documentElement.style.scrollBehavior="auto"; return 1');
  await sleep(250);
}
async function shot(name, fullPage) {
  fs.mkdirSync(SHOTS, { recursive: true });
  let clip;
  if (fullPage) { const m = await cdp('Page.getLayoutMetrics'); const sz = m.cssContentSize || m.contentSize; clip = { x: 0, y: 0, width: sz.width, height: sz.height, scale: 1 }; }
  const r = await cdp('Page.captureScreenshot', Object.assign({ format: 'png', captureBeyondViewport: !!fullPage }, clip ? { clip } : {}));
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
}
async function shotOf(sel, name, pad) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const box = await evaluate(`const e=document.querySelector(${JSON.stringify(sel)});e.scrollIntoView({block:'start'});await new Promise(r=>setTimeout(r,200));const b=e.getBoundingClientRect();return {x:b.left+scrollX,y:b.top+scrollY,w:b.width,h:b.height}`);
  pad = pad === undefined ? 12 : pad;
  const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2, scale: 1 } });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
}
async function key(k, code, vk, text) {
  await cdp('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk }, text ? { text } : {}));
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
}
const errorsSeen = () => events.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
  .map(e => JSON.stringify(e.params).slice(0, 300));


const IDS = ['S02-01', 'S02-03', 'S02-04'];
const FIGS = { 'S02-01': ['fig1', 'fig2', 'fig2b', 'fig3', 'fig4'], 'S02-03': ['fig1', 'fig2', 'fig3', 'fig4', 'fig5', 'fig6'], 'S02-04': ['fig1', 'fig2', 'fig3', 'fig4'] };
const FIG = `
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const fig=id=>document.getElementById(id);
  const go=async(id,a)=>{fig(id).querySelector('[data-a='+a+']').click(); await wait(20);};
  const to=async(id,n)=>{await go(id,'again'); for(let i=1;i<n;i++) await go(id,'next');};
`;
const HERO = `const s=document.querySelector('.lhero .shot'), img=s.querySelector('img'), b=s.getBoundingClientRect();
  return {loaded:img.complete&&img.naturalWidth>0, hots:[...s.querySelectorAll('.hot span')].map(x=>{const r=x.getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom}),
    credit:s.querySelector('a.credit').getAttribute('href'), filter:getComputedStyle(img).filter}`;

test.before(async () => { await startServer(); await startChrome(); });
test.after(() => { try { ws.close(); } catch (e) {} try { chrome.kill(); } catch (e) {} server.close(); });

test('桌面 1280：三课加载无报错、无横向滚动；开场照片载入、标注不出界；分步图停在第 1 步，3 秒后不自动前进', async () => {
  await viewport(1280, 900);
  for (const id of IDS) {
    await load(P(id));
    const r = await evaluate(`return {over:document.documentElement.scrollWidth-innerWidth, figs:[...document.querySelectorAll('.pf')].map(f=>f.id),
      steps:[...document.querySelectorAll('.pf[data-step]')].map(f=>f.dataset.step), modebtn:!!document.getElementById('modebtn'), credits:!!document.querySelector('footer .credits')}`);
    assert.deepEqual(errorsSeen(), [], id);
    assert.ok(r.over <= 0, id + ' 横向滚动 ' + r.over);
    assert.deepEqual(r.figs, FIGS[id]);
    assert.ok(r.steps.length >= 1 && r.steps.every(s => s === '1' || s === '5'), id + ' 初始步：' + r.steps);
    assert.equal(r.modebtn, false); assert.equal(r.credits, true);
    const hero = await evaluate(HERO);
    assert.ok(hero.loaded, id + ' 开场照片没有载入（需要联网）');
    assert.deepEqual(hero.hots, [true, true], id + ' 标注出界');
    assert.match(hero.credit, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.equal(/grayscale/.test(hero.filter), id !== 'S02-01', id + ' 去色设置');
    await shot(id + '-desktop-hero', false);
    const still = await evaluate(`const a=[...document.querySelectorAll('.pf[data-step]')].map(f=>f.dataset.step); await new Promise(r=>setTimeout(r,3000)); return JSON.stringify(a)===JSON.stringify([...document.querySelectorAll('.pf[data-step]')].map(f=>f.dataset.step))`);
    assert.equal(still, true, id + ' 不应自动播放');
  }
});

test('S02-01：模型数字；图 1 先猜后看（答错给提示、答对才展开）；图 3 回到真实发行；图 4 选渠道前不能前进', async () => {
  await load(P('S02-01'));
  const m = await evaluate(`const S=window.S0201; return {d:S.F1.debt(3000), e:S.F1.equity(3000), x:[S.F1.debt(1200),S.F1.equity(1200)],
    f:[S.FO.last,200,100,400].map(M=>{const r=S.follow(M);return [r.n,(r.pct*100).toFixed(2)]})}`);
  assert.deepEqual([m.d, m.e], [2760, 2400]); assert.deepEqual(m.x, [960, 960]);
  assert.deepEqual(m.f, [[14159265, '4.84'], [21386862, '7.13'], [42773724, '13.31'], [10693431, '3.70']]);
  const f1 = await evaluate(FIG + `const p=fig('fig1-pre'); p.querySelector('input[value=equity]').click(); p.querySelector('[data-a=check]').click(); await wait(20);
    const a={hint:p.querySelector('.pfb').textContent, body:fig('fig1-body').hidden};
    p.querySelector('input[value=debt]').click(); p.querySelector('[data-a=check]').click(); await wait(20);
    const r=fig('fig1-p'); r.value=3000; r.dispatchEvent(new Event('input',{bubbles:true})); await wait(20);
    return {a, body:fig('fig1-body').hidden, d:fig('fig1-d').textContent, e:fig('fig1-e').textContent}`);
  assert.match(f1.a.hint, /借钱时，利息之外的利润全归谁/); assert.equal(f1.a.body, true, '答错时不展开图');
  assert.equal(f1.body, false); assert.match(f1.d, /2,760/); assert.match(f1.e, /2,400/);
  const f3 = await evaluate(FIG + `const r=fig('fig3-m'); r.value=200; r.dispatchEvent(new Event('input',{bubbles:true})); await wait(20); const a=fig('fig3-n').textContent;
    fig('fig3-real').click(); await wait(20); return [a, fig('fig3-n').textContent, fig('fig3-pct').textContent, fig('fig3-net').textContent]`);
  assert.deepEqual(f3, ['21,386,862 股', '14,159,265 股', '4.84%', '$290.575']);
  const f4 = await evaluate(FIG + `await to('fig4',4); const n=fig('fig4').querySelector('[data-a=next]'); const before=n.disabled;
    fig('fig4-br').querySelector('button').click(); await wait(20); return {before, after:n.disabled, routes:fig('fig4-br').querySelectorAll('button').length}`);
  assert.equal(f4.before, true, '没选执行渠道前，下一步不可用'); assert.equal(f4.after, false); assert.equal(f4.routes, 3);
  const g = await evaluate(FIG + `await to('fig2b',6); const b=document.getElementById('fig2b-btn'); b.click(); await wait(20); return document.getElementById('fig2b-g').textContent`);
  assert.equal(g, '$1,168,368,039', '二级市场的价格变化不改变公司从发行中拿到的钱');
});

test('S02-03：撮合引擎复现课文数字（$100,300、价差一半 $20、冲击 $280、第 31 条 $2.06）', async () => {
  await load(P('S02-03'));
  const r = await evaluate(`const S=window.S0203; const b=S.split('buy',1000,S0203Data.mid); const s=S.split('sell',300,S0203Data.mid);
    return {tot:b.r.totalCents, avg:S.avg(b.r.totalCents,1000), half:b.half, imp:b.impact, last:b.r.lastAfter&&b.r.lastAfter.price, sec:S.sec31(10000000)}`);
  assert.equal(r.tot, 10030000); assert.equal(r.avg, '$100.30');
  assert.equal(r.half, 2000); assert.equal(r.imp, 28000); assert.equal(r.half + r.imp, 30000);
  assert.equal(r.last, 10063); assert.equal(r.sec, 206);
  assert.deepEqual(errorsSeen(), []);
});

test('S02-04：600 股 $30,017；轧差 −100 股 +$5,021；A 股切换换名称与说明；图 4 违约后小林照常结算', async () => {
  await load(P('S02-04'));
  const m = await evaluate(`return [S0204.N1, S0204.NET.qty, S0204.NET.cash]`);
  assert.deepEqual(m, [3001700, -100, 502100]);
  const r = await evaluate(FIG + `await to('fig1',7); const us={st:fig('fig1-st').textContent, c:fig('fig1').querySelector('.cname').textContent};
    fig('fig1').querySelector('button[data-mkt=cn]').click(); await wait(20);
    const cn={c:fig('fig1').querySelector('.cname').textContent, note:!fig('fig1-cn').hidden, now:fig('fig1').querySelector('.pf-now').textContent};
    await to('fig2',3); const v=fig('fig2-v').textContent; await to('fig4',3); return {us, cn, v, f4:fig('fig4-st').textContent}`);
  assert.deepEqual(r.us, { st: '已结算', c: 'NSCC' });
  assert.equal(r.cn.c, '中国结算'); assert.equal(r.cn.note, true);
  assert.match(r.v, /交出 100 股，收进 \$5,021/); assert.equal(r.f4, '已结算');
});

test('小题：答错给提示可重选，「看答案」揭晓；开放题的提示和参考答案可以展开收起', async () => {
  for (const id of IDS) {
    await load(P(id));
    const r = await evaluate(`const q=document.querySelector('.quiz[data-answer]'); const right=+q.dataset.answer; const n=q.querySelectorAll('input').length;
      q.querySelectorAll('input')[(right+1)%n].click(); q.querySelector('[data-a=check]').click();
      const w={st:q.dataset.state, hint:!q.querySelector('.qhint').hidden, ans:!q.querySelector('.qans').hidden};
      q.querySelector('[data-a=show]').click(); return {w, st:q.dataset.state, ans:!q.querySelector('.qans').hidden}`);
    assert.deepEqual(r.w, { st: 'wrong', hint: true, ans: false }, id);
    assert.equal(r.st, 'shown'); assert.equal(r.ans, true);
  }
  await load(P('S02-01'));
  const o = await evaluate(`const q=document.querySelector('.quiz.open'); const h=q.querySelector('[data-a=hint]'); h.click();
    const a=[!q.querySelector('.qhint').hidden, h.getAttribute('aria-expanded')]; h.click(); return [a, q.querySelector('.qhint').hidden]`);
  assert.deepEqual(o, [[true, 'true'], true]);
});

test('键盘：Tab 到「下一步」，回车推进；焦点可见', async () => {
  for (const id of IDS) {
    await load(P(id));
    const f = { 'S02-01': 'fig2', 'S02-03': 'fig4', 'S02-04': 'fig1' }[id];
    await evaluate(FIG + `await to('${f}',1); fig('${f}').querySelector('[data-a=next]').focus(); return 1`);
    await key('Enter', 'Enter', 13, '\r');
    const a = await evaluate(`return {s:document.getElementById('${f}').dataset.step, ring:getComputedStyle(document.activeElement).outlineStyle}`);
    assert.equal(a.s, '2', id); assert.equal(a.ring, 'solid', id + ' 焦点不可见');
  }
});

test('减少动态效果与打印：直接显示全部步骤；隐藏的答案仍不显示，打印时显示', async () => {
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const id of IDS) {
    await load(P(id));
    const r = await evaluate(`return {body:document.body.classList.contains('static'), steps:[...document.querySelectorAll('.pf[data-step]')].map(f=>f.dataset.step),
      lists:[...document.querySelectorAll('.pf-steps')].map(e=>getComputedStyle(e).display), off:document.querySelectorAll('.pf .off').length,
      qans:[...document.querySelectorAll('.quiz .qans')].every(e=>e.hidden)}`);
    assert.equal(r.body, true, id); assert.ok(r.steps.every(s => s === 'static'), id + ' ' + r.steps);
    assert.ok(r.lists.every(d => d === 'flex'), id); assert.equal(r.off, 0, id + ' 静态版不应有变淡的步骤');
    assert.equal(r.qans, true, id + ' 静态版也不提前显示小题答案');
    if (id === 'S02-01') {
      const p = await evaluate(`return [document.getElementById('fig1-body').hidden, document.querySelector('#fig1 .pans').hidden]`);
      assert.deepEqual(p, [false, false], '静态版：图 1 直接展开并给出答案');
    }
  }
  await cdp('Emulation.setEmulatedMedia', { features: [] });
  for (const id of IDS) {
    await load(P(id));
    await cdp('Emulation.setEmulatedMedia', { media: 'print' });
    const r = await evaluate(`return {ctrl:[...document.querySelectorAll('.pf-ctrl')].map(e=>getComputedStyle(e).display), toc:getComputedStyle(document.querySelector('.ltoc')).display,
      shot:getComputedStyle(document.querySelector('.lhero .shot')).display, qans:getComputedStyle(document.querySelector('.quiz .qans')).display}`);
    assert.ok(r.ctrl.every(d => d === 'none'), id); assert.equal(r.toc, 'none'); assert.equal(r.shot, 'none', id + ' 打印时不印开场照片');
    assert.notEqual(r.qans, 'none', id + ' 打印时附上答案');
    await cdp('Emulation.setEmulatedMedia', { media: '' });
    const pdf = await cdp('Page.printToPDF', { printBackground: true });
    fs.mkdirSync(SHOTS, { recursive: true });
    fs.writeFileSync(path.join(SHOTS, id + '-print.pdf'), Buffer.from(pdf.data, 'base64'));
  }
});

test('手机 390：无横向滚动、无报错；开场照片在标题之上，标注不出界', async () => {
  await viewport(390, 844, true);
  for (const id of IDS) {
    await load(P(id));
    const r = await evaluate(`const over=[];document.querySelectorAll('main *').forEach(e=>{const b=e.getBoundingClientRect(); if(b.width&&b.right>innerWidth+1&&!e.closest('.tblw')&&!e.closest('.shot')) over.push(e.tagName+'.'+e.className)});
      return {sw:document.documentElement.scrollWidth-innerWidth, over:over.slice(0,8), first:document.querySelector('.lhero .shot').getBoundingClientRect().top<document.querySelector('.lhero h1').getBoundingClientRect().top}`);
    assert.ok(r.sw <= 0, id + ' 横向滚动 ' + r.sw); assert.deepEqual(r.over, [], id);
    assert.equal(r.first, true, id + ' 手机上照片应在标题之上');
    const hero = await evaluate(HERO);
    assert.ok(hero.loaded); assert.deepEqual(hero.hots, [true, true], id + ' 手机标注出界');
    assert.deepEqual(errorsSeen(), [], id);
    await shot(id + '-mobile-hero', false);
    await shot(id + '-mobile-full', true);
  }
  await viewport(1280, 900);
});
