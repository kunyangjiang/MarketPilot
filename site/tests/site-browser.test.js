/* 站点导航浏览器测试：真实 Chrome（无头）＋ CDP，不依赖 npm 包。
 * 模拟静态托管（与 Cloudflare Pages 相同的规则）：目录 → index.html；目录地址不带斜杠时 301 补上斜杠；
 * 只发布 site/ 目录，site/ 之外的文件（设计样稿、原稿）一律 404。
 * 同一套检查分别在两种部署位置跑一遍：根路径（/）与子路径（/mp/），桌面 1280 与手机 390 两种宽度。
 * 测的是发布目录：开始前用 tools/build-dist.js 在临时目录里生成一份 dist，服务器只发这份 dist（和上线的内容逐字节相同）。
 * 想直接测源目录 site/：设环境变量 MP_ROOT=src。
 * 运行：node --test site/tests/site-browser.test.js   截图写入 site/shots/site-*.png */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const SITE = path.resolve(__dirname, '..');
const DIST = require('../tools/build-dist.js');
let ROOT = SITE; // test.before 里换成临时 dist 目录（MP_ROOT=src 时保持源目录）
const SHOTS = path.join(SITE, 'shots');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
/* 测试、工具、截图不是网站的一部分：发布时不该被访问到，这里也按 404 处理 */
const PRIVATE = /^\/(tests|tools|shots)(\/|$)/;

let server, origin, chrome, ws, msgId = 0;
const pending = new Map(), events = [];
const MOUNTS = ['/', '/mp/'];

/* 找不到的地址：像 Cloudflare Pages 一样返回发布目录根部的 404.html，状态 404 */
function notFound(rsp) {
  const p = path.join(ROOT, '404.html');
  if (fs.existsSync(p)) { rsp.writeHead(404, { 'content-type': TYPES['.html'] }); return rsp.end(fs.readFileSync(p)); }
  rsp.writeHead(404); return rsp.end('not found');
}
function startServer() {
  return new Promise(res => {
    server = http.createServer((req, rsp) => {
      const url = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      const m = MOUNTS.slice().sort((a, b) => b.length - a.length).find(p => url.startsWith(p));
      const rel = '/' + url.slice(m.length);
      if (m === '/' && rel.startsWith('/mp/')) { return notFound(rsp); }
      if (PRIVATE.test(rel)) { return notFound(rsp); }
      let p = path.normalize(path.join(ROOT, rel));
      if (p !== ROOT && !p.startsWith(ROOT + path.sep)) { return notFound(rsp); }
      let st; try { st = fs.statSync(p); } catch (e) { return notFound(rsp); }
      if (st.isDirectory()) {
        if (!url.endsWith('/')) { rsp.writeHead(301, { location: url + '/' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '') }); return rsp.end(); }
        p = path.join(p, 'index.html');
        if (!fs.existsSync(p)) { return notFound(rsp); }
      }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      rsp.end(fs.readFileSync(p));
    }).listen(0, '127.0.0.1', () => { origin = 'http://127.0.0.1:' + server.address().port; res(); });
  });
}
async function startChrome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-chrome-'));
  // 端口由 Chrome 自己挑（0），从 DevToolsActivePort 读出：避免与别的测试刚关掉的 Chrome 撞端口
  chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + dir, 'about:blank'], { stdio: 'ignore' });
  let targets, port;
  for (let i = 0; i < 75 && !port; i++) { try { port = fs.readFileSync(path.join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch (e) {} if (!port) await sleep(200); }
  for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); if (targets.length) break; } catch (e) {} await sleep(200); }
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
    else if (m.method) events.push(m);
  };
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Log.enable'); await cdp('Network.enable');
}
function cdp(method, params) { return new Promise((res, rej) => { const id = ++msgId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params: params || {} })); }); }
async function evaluate(expr) {
  const r = await cdp('Runtime.evaluate', { expression: '(async()=>{' + expr + '})()', awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('页面脚本出错：' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
  return r.result.value;
}
async function viewport(w, h, mobile) { await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile }); }
/* 等页面加载完；之后关掉平滑滚动，让点击坐标稳定（页面自己的平滑滚动另有 reduced-motion 处理） */
async function settle() {
  for (let i = 0; i < 100; i++) { await sleep(120); const ok = await evaluate('return document.readyState==="complete"').catch(() => false); if (ok) break; }
  await evaluate('await document.fonts.ready; return 1').catch(() => 0);
  await sleep(300);
  await evaluate('document.documentElement.style.scrollBehavior="auto"; return 1').catch(() => 0);
}
/* 每次都从空白页进入，保证是一次全新的页面加载（而不是同一页面内只改 # 的跳转） */
async function load(url) {
  await cdp('Page.navigate', { url: 'about:blank' }); await sleep(50);
  events.length = 0; await cdp('Page.navigate', { url: origin + url }); await settle();
}
/* 点击页面上的元素（真实的鼠标事件）。点在第一行文字的开头附近：折行的链接，包围盒中心可能落在别的链接上 */
async function click(sel) {
  const b = await evaluate(`const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,120)); const r=e.getClientRects()[0]||e.getBoundingClientRect(); return {x:r.left+Math.min(r.width/2,12),y:r.top+r.height/2}`);
  assert.ok(b, '找不到可点击的元素：' + sel);
  for (const type of ['mousePressed', 'mouseReleased']) await cdp('Input.dispatchMouseEvent', { type, x: b.x, y: b.y, button: 'left', clickCount: 1 });
  await sleep(250); await settle();
}
/* 点击一个会跳到别的页面的链接：等到地址变化、新页面加载完 */
async function clickNav(sel) {
  const before = await here();
  await click(sel);
  for (let i = 0; i < 40 && (await here().catch(() => before)) === before; i++) await sleep(100);
  await settle();
}
async function key(k, code, vk, mod) {
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, modifiers: mod || 0 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, modifiers: mod || 0 });
}
async function typeText(t) { await cdp('Input.insertText', { text: t }); await sleep(150); }
async function shot(name, fullPage) {
  fs.mkdirSync(SHOTS, { recursive: true });
  let clip;
  if (fullPage) { const m = await cdp('Page.getLayoutMetrics'); const sz = m.cssContentSize || m.contentSize; clip = { x: 0, y: 0, width: sz.width, height: Math.min(sz.height, 16000), scale: 1 }; }
  const r = await cdp('Page.captureScreenshot', Object.assign({ format: 'png', captureBeyondViewport: !!fullPage }, clip ? { clip } : {}));
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
}
const here = () => evaluate('return location.href');
const errorsSeen = () => events.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error' && (e.params.entry.url || '').startsWith(origin)))
  .map(e => JSON.stringify(e.params).slice(0, 300));
/* 同源请求里所有失败（≥400 或加载失败）的地址 */
const badRequests = () => {
  const ids = new Map();
  for (const e of events) if (e.method === 'Network.requestWillBeSent') ids.set(e.params.requestId, e.params.request.url);
  const bad = [];
  for (const e of events) {
    if (e.method === 'Network.responseReceived' && e.params.response.url.startsWith(origin) && e.params.response.status >= 400) bad.push(e.params.response.status + ' ' + e.params.response.url);
    if (e.method === 'Network.loadingFailed' && (ids.get(e.params.requestId) || '').startsWith(origin) && !e.params.canceled) bad.push('failed ' + ids.get(e.params.requestId));
  }
  return bad;
};
const overflow = () => evaluate('return document.documentElement.scrollWidth - document.documentElement.clientWidth');
const screen = () => evaluate('return [...document.querySelectorAll("[data-screen]")].filter(s=>!s.hidden).map(s=>s.dataset.screen).join(",")');
global.window = {}; require('../assets/catalog.js'); const CAT = global.window.MP; delete global.window;
const SHELL_FRAGS = new Set(['home', 'courses', 'stories', 'main', 'layer-1', 'layer-2', 'layer-3', 'layer-4', ...CAT.stages.map(s => s.id), ...CAT.lessons.map(l => l.id)]);
const STALE = /design-exploration|proto-v4|#(lesson|preview|panel|story|about|sources)$/;

test.before(async () => {
  if (process.env.MP_ROOT !== 'src') ROOT = DIST.build(fs.mkdtempSync(path.join(os.tmpdir(), 'mp-dist-'))).out;
  await startServer(); await startChrome();
});
test.after(() => { try { ws.close(); } catch (e) {} try { chrome.kill(); } catch (e) {} server.close(); });

for (const M of MOUNTS) {
  const tag = M === '/' ? 'root' : 'nested';
  for (const [vw, vh, mob, dev] of [[1280, 900, false, 'desktop'], [390, 844, true, 'mobile']]) {
    test(`[${tag} ${dev}] 首页：无报错、无失败请求、无横向溢出；主按钮「探索课程」打开课程目录；从 S02-01 开始，另推荐 S09-03`, async () => {
      await viewport(vw, vh, mob);
      await load(M);
      assert.deepEqual(errorsSeen(), []); assert.deepEqual(badRequests(), []);
      assert.equal(await screen(), 'home');
      assert.ok(await overflow() <= 0, '首页横向溢出');
      const r = await evaluate(`return {pri:[...document.querySelectorAll('[data-screen=home] .btn.pri')].map(a=>[a.textContent,a.getAttribute('href')]),
        now:[...document.querySelectorAll('#h-now a')].map(a=>[a.getAttribute('href'),!!a.querySelector('.stat,.st'),a.querySelector('b').textContent]),
        nav:[...document.querySelectorAll('.mainnav a')].map(a=>a.textContent), foot:document.querySelector('[data-screen=home] footer').textContent}`);
      assert.deepEqual(r.pri, [['探索课程 →', '#courses']]);
      assert.deepEqual(r.now.map(x => x[0]), ['lessons/S02-01/', 'lessons/S09-03/']);
      assert.ok(r.now.every(x => x[1] === false), '首页推荐卡片不应挂状态标签');
      assert.deepEqual(r.nav, ['首页', '课程', '故事']);
      const home = await evaluate(`return {txt:document.querySelector('[data-screen=home]').textContent, sum:document.getElementById('h-lsum').textContent}`);
      assert.equal(home.sum, '4 层 · 11 个阶段 · 61 课');
      assert.ok(!/可阅读|筹备中|现在可读|写作中|开发中|待核实/.test(home.txt), '首页仍有状态文字');
      assert.ok(!/关于|来源与方法|设计样稿/.test(r.foot), '页脚不应有「关于 / 来源与方法」或样稿说明');
      if (M === '/') await shot(`site-${dev}-home`, true);
      await click('[data-screen=home] .btn.pri');
      assert.equal(await screen(), 'courses');
      assert.ok((await here()).endsWith(M + '#courses'));
    });

    test(`[${tag} ${dev}] 课程目录：61 课；S02-01 至 S02-04、S09-03 链接到课程页，其余 56 课只列标题、没有链接；没有任何状态标签；开场和四个层级都有照片`, async () => {
      await viewport(vw, vh, mob);
      await load(M + '#courses');
      assert.equal(await screen(), 'courses');
      assert.ok(await overflow() <= 0, '目录横向溢出');
      const r = await evaluate(`const li=[...document.querySelectorAll('.cl-stage li')];return {n:li.length,
        on:li.filter(x=>x.querySelector('a')).map(x=>[x.id,x.querySelector('a').getAttribute('href'),!!x.querySelector('.cl-st,.stat')]),
        plan:li.filter(x=>!x.querySelector('a')).map(x=>x.textContent),
        imgs:[...document.querySelectorAll('[data-screen=courses] img')].map(i=>i.getAttribute('src')), types:document.querySelectorAll('.cl-band.type').length, big:[...document.querySelectorAll('.cl-big')].map(x=>x.textContent),
        broken:[...document.querySelectorAll('[data-screen=courses] img')].filter(i=>i.complete&&!i.naturalWidth).length,
        planLinks:li.filter(x=>x.classList.contains('plan')).reduce((s,x)=>s+x.querySelectorAll('a,[href],button').length,0),
        stages:[...document.querySelectorAll('.cl-stage')].map(d=>d.id), layers:[...document.querySelectorAll('.cl-layer')].map(s=>s.id),
        legend:!!document.getElementById('c-legend'), all:document.querySelector('[data-screen=courses]').textContent}`);
      assert.equal(r.n, 61);
      assert.deepEqual(r.on, [['S02-01', 'lessons/S02-01/', false], ['S02-02', 'lessons/S02-02/', false], ['S02-03', 'lessons/S02-03/', false], ['S02-04', 'lessons/S02-04/', false], ['S09-03', 'lessons/S09-03/', false]]);
      assert.equal(r.plan.length, 56); assert.ok(r.plan.every(s => /^S\d\d-\d\d\S/.test(s) && !/筹备|可阅读|暂不能|写作/.test(s)), r.plan[0]);
      assert.equal(r.planLinks, 0);
      assert.deepEqual(r.stages, ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11']);
      assert.deepEqual(r.layers, ['layer-1', 'layer-2', 'layer-3', 'layer-4']);
      assert.equal(r.legend, false, '目录不应有状态图例');
      assert.ok(!/可阅读|筹备中|写作中|开发中|已发布|未发布|预览/.test(r.all), '目录仍有状态文字');
      // 照片：目录开场一张，四个层级题图各一张，都加载成功
      assert.equal(r.imgs.length, 5);
      assert.ok(/Irving_Trust/.test(r.imgs[0]) && /Prokudin-Gorskii/.test(r.imgs[1]) && /Manhattan_Skyline/.test(r.imgs[2]) && /Crowds_gathering/.test(r.imgs[3]) && /Jack_Delano/.test(r.imgs[4]), JSON.stringify(r.imgs));
      assert.equal(r.types, 0); assert.deepEqual(r.big, []);
      assert.equal(r.broken, 0);
      if (M === '/') await shot(`site-${dev}-courses`, true);
    });

    test(`[${tag} ${dev}] 跳到层级：点击后该层级出现在跳转条下方`, async () => {
      await viewport(vw, vh, mob);
      await load(M + '#courses');
      for (const n of [3, 1, 4, 2]) {
        await click(`#c-jump a[href="#layer-${n}"]`);
        await sleep(200);
        const r = await evaluate(`const t=document.getElementById('layer-${n}').getBoundingClientRect().top, j=document.getElementById('c-jump').getBoundingClientRect().bottom; return {t,j,h:location.hash,end:scrollY+innerHeight>=document.documentElement.scrollHeight-2}`);
        assert.equal(r.h, '#layer-' + n);
        if (M === '/' && n === 3) await shot(`site-${dev}-jump-layer-3`);
        // 第四层在页面末尾，滚到底时可能停不到跳转条下方，只要求没有被挡住
        assert.ok(r.t >= r.j - 2 && (r.t < r.j + 80 || r.end), `第 ${n} 层没有滚到跳转条下方：top=${r.t} 跳转条底=${r.j}`);
      }
    });

    test(`[${tag} ${dev}] 地址片段：#S09、#S05（默认收起）、#S02-02 直接打开并定位到阶段或课`, async () => {
      await viewport(vw, vh, mob);
      for (const [h, stage, row] of [['S09', 'S09', null], ['S05', 'S05', null], ['S02-02', 'S02', 'S02-02'], ['S11-04', 'S11', 'S11-04'], ['layer-4', null, null]]) {
        await load(M + '#' + h);
        assert.equal(await screen(), 'courses', '#' + h + ' 没有打开目录');
        const r = await evaluate(`const t=document.getElementById(${JSON.stringify(h)}).getBoundingClientRect(); return {top:t.top, bottom:t.bottom, jb:document.getElementById('c-jump').getBoundingClientRect().bottom, open:${stage ? `document.getElementById('${stage}').open` : 'true'}, hit:[...document.querySelectorAll('li.hit')].map(x=>x.id), vh:innerHeight}`);
        assert.ok(r.open, '#' + h + ' 的阶段没有展开');
        // 目标在吸顶跳转条下方、没有被挡住；页面末尾的目标（S11-04、第四层）滚不到顶部，只要求在视口内
        assert.ok(r.top >= r.jb - 2, '#' + h + ' 被跳转条挡住：' + r.top + ' < ' + r.jb);
        if (h === 'S11-04' || h === 'layer-4') assert.ok(r.bottom <= r.vh || r.top < r.vh * 0.5, '#' + h + ' 不在视口内：' + r.top);
        else assert.ok(r.top < r.jb + 80, '#' + h + ' 没有定位到跳转条下方：' + r.top + '（跳转条底 ' + r.jb + '）');
        assert.deepEqual(r.hit, row ? [row] : []);
        if (M === '/' && h === 'S02-02') await shot(`site-${dev}-fragment-S02-02`);
      }
    });

    test(`[${tag} ${dev}] 目录 → 课程页 → 返回：回到该课所在阶段；课程页面包屑回到阶段`, async () => {
      await viewport(vw, vh, mob);
      for (const [id, stage, layer] of [['S02-02', 'S02', 'layer-1'], ['S09-03', 'S09', 'layer-3']]) {
        await load(M + '#courses');
        await clickNav(`#${id} a`);
        assert.equal(await here(), origin + M + 'lessons/' + id + '/');
        assert.deepEqual(errorsSeen(), []); assert.deepEqual(badRequests(), []);
        const p = await evaluate(`return {h1:document.querySelector('h1').textContent, crumb:[...document.querySelectorAll('.crumb a')].map(a=>[a.textContent,a.getAttribute('href')]),
          nav:[...document.querySelectorAll('header.top a')].map(a=>a.getAttribute('href'))}`);
        assert.ok(p.h1.length > 5);
        assert.deepEqual(p.crumb.map(c => c[1]), ['../../#courses', '../../#' + layer, '../../#' + stage]);
        assert.deepEqual(p.nav, ['../../', '../../', '../../#courses', '../../#stories', '../../?search=']);
        assert.ok(await overflow() <= 0, id + ' 横向溢出');
        // 浏览器"返回"：回到目录，地址是该课所在的阶段
        await cdp('Runtime.evaluate', { expression: 'history.back()' }); await sleep(300); await settle();
        assert.equal(await here(), origin + M + '#' + stage);
        assert.equal(await screen(), 'courses');
        const t = await evaluate(`return document.getElementById('${stage}').getBoundingClientRect().top`);
        assert.ok(t >= 0 && t < vh * 0.6, '返回后没有停在 ' + stage + '：' + t);
        // 面包屑里的阶段链接
        await load(M + 'lessons/' + id + '/');
        await clickNav(`.crumb a[href="../../#${stage}"]`);
        assert.equal(await here(), origin + M + '#' + stage);
        assert.equal(await screen(), 'courses');
        const t2 = await evaluate(`return document.getElementById('${stage}').getBoundingClientRect().top`);
        assert.ok(t2 >= 0 && t2 < vh * 0.6, '面包屑没有定位到 ' + stage);
        // 页头导航
        await load(M + 'lessons/' + id + '/');
        await clickNav('.mainnav a[href="../../#stories"]');
        assert.equal(await screen(), 'stories');
        await load(M + 'lessons/' + id + '/');
        await clickNav('.logo');
        assert.equal(await here(), origin + M); assert.equal(await screen(), 'home');
      }
    });

    test(`[${tag} ${dev}] 搜索：结果来自课程页并能打开，按去向标「课程 / 小节 / 目录」，没有状态标签；其余的课只按标题出现、只定位到目录`, async () => {
      await viewport(vw, vh, mob);
      await load(M);
      await click('#s-open');
      assert.ok(await evaluate('return document.getElementById("search").open'));
      await typeText('订单簿');
      let r = await evaluate(`return [...document.querySelectorAll('#s-list li')].map(li=>[li.querySelector('.ty').textContent, li.dataset.href])`);
      assert.ok(r.length > 3);
      // 订单簿在 S02-02 讲，S02-03 接着用；S02-02 的结果排在前面
      assert.ok(r.every(x => /^(课程|小节)$/.test(x[0]) && /^lessons\/S02-0[23]\//.test(x[1])), JSON.stringify(r));
      assert.ok(r[0][1].startsWith('lessons/S02-02/'), JSON.stringify(r[0]));
      assert.ok(r.some(x => x[0] === '小节' && x[1].includes('#')));
      assert.ok(r.every(x => x[0] !== '课程' || /^lessons\/S02-0[23]\/$/.test(x[1])));
      assert.equal(await evaluate(`return !!document.getElementById('s-tabs') || /可阅读|筹备中/.test(document.getElementById('search').textContent)`), false, '搜索面板仍有状态标签或状态筛选');
      if (M === '/') await shot(`site-${dev}-search-orderbook`);
      const b4 = await here();
      await key('ArrowDown', 'ArrowDown', 40); await key('Enter', 'Enter', 13);
      for (let i = 0; i < 40 && (await here().catch(() => b4)) === b4; i++) await sleep(100);
      await settle();
      const u = await here();
      assert.ok(u.startsWith(origin + M + 'lessons/S02-02/#'), '回车没有打开课程小节：' + u);
      const frag = u.split('#')[1];
      assert.ok(await evaluate(`return !!document.getElementById(${JSON.stringify(frag)})`));
      assert.deepEqual(badRequests(), []);
      // 1907：S09-03 的结果在前；没有指向样稿的旧结果
      await load(M + '?search=1907');
      assert.ok(await evaluate('return document.getElementById("search").open'), '?search= 没有打开搜索');
      assert.equal(await evaluate('return location.search'), '', '打开后 ?search= 应从地址里去掉');
      r = await evaluate(`return [...document.querySelectorAll('#s-list li')].map(li=>[li.querySelector('.ty').textContent, li.dataset.href, li.textContent])`);
      assert.ok(r[0][1] === 'lessons/S09-03/', JSON.stringify(r[0]));
      assert.ok(r.every(x => !STALE.test(x[1])));
      // 目录条目：搜「银行」能找到其余课的标题；排在课程正文结果之后；没有摘要；只链接到目录行
      await load(M + '?search=' + encodeURIComponent('银行'));
      r = await evaluate(`return [...document.querySelectorAll('#s-list li')].map(li=>({ty:li.querySelector('.ty').textContent, href:li.dataset.href, cls:li.className, ex:!!li.querySelector('p'), where:li.querySelector('.where').textContent}))`);
      const plan = r.filter(x => x.ty === '目录');
      assert.ok(plan.length >= 2, '应能按标题找到目录里的课');
      assert.ok(r.every(x => /^(课程|小节|目录)$/.test(x.ty)), JSON.stringify(r.map(x => x.ty)));
      assert.ok(plan.every(x => /^#S\d\d-\d\d$/.test(x.href) && x.cls === 'plan' && !x.ex && /^S\d\d \S/.test(x.where)));
      const firstPlan = r.findIndex(x => x.ty === '目录'), lastRead = r.map(x => x.ty !== '目录').lastIndexOf(true);
      assert.ok(lastRead < firstPlan, '课程正文的结果应排在目录条目前面');
      const target = plan[0].href;
      await click('#s-list li.plan');
      assert.equal(await here(), origin + M + target);
      assert.equal(await screen(), 'courses');
      const hit = await evaluate(`return [...document.querySelectorAll('li.hit')].map(x=>[x.id, !!x.querySelector('a')])`);
      assert.deepEqual(hit, [[target.slice(1), false]]);
      // 从课程页的搜索按钮进入
      await load(M + 'lessons/S09-03/');
      await clickNav('header.top .sbtn');
      assert.equal(await here(), origin + M);
      assert.ok(await evaluate('return document.getElementById("search").open'), '课程页的搜索按钮没有打开搜索');
      // Ctrl K
      await load(M + '#courses');
      // 无头 Chrome 会把真实的 Ctrl K 当作浏览器快捷键拦下，这里直接派发页面收到的按键事件
      await evaluate(`dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true})); return 1`);
      assert.ok(await evaluate('return document.getElementById("search").open'), 'Ctrl K 没有打开搜索');
    });

    test(`[${tag} ${dev}] 故事：栏目开场是 Paul Strand《华尔街》宽幅照片；没有状态标签、封面、占位作品`, async () => {
      await viewport(vw, vh, mob);
      await load(M + '#stories');
      assert.equal(await screen(), 'stories');
      assert.ok(await overflow() <= 0);
      const r = await evaluate(`const s=document.querySelector('[data-screen=stories]'); return {img:s.querySelectorAll('img').length, txt:s.textContent, cur:document.querySelector('.mainnav a[aria-current]').textContent, links:[...s.querySelectorAll('a')].map(a=>a.getAttribute('href'))}`);
      assert.equal(r.img, 1);
      assert.ok(await evaluate(`const i=document.getElementById('s-p1'); return /Paul_Strand/.test(i.src) && i.complete && i.naturalWidth > 0`), '故事开场照片没有加载');
      assert.match(r.txt, /以金融市场为背景的原创虚构作品/);
      assert.ok(!/筹备|开发中|写作中|敬请期待|即将/.test(r.txt), '故事页有状态文字');
      assert.ok(!/占位|示意|故事标题|悬疑|科幻|分钟|新栏目/.test(r.txt), '故事页有虚构的占位内容');
      assert.equal(r.cur, '故事');
      assert.deepEqual(r.links, ['https://commons.wikimedia.org/wiki/File:Paul_Strand,_Wall_Street,_New_York_City,_1915.jpg'], '故事页只应有照片来源链接');
      if (M === '/') await shot(`site-${dev}-stories`, true);
    });
  }

  test(`[${tag}] 直接打开课程地址：带斜杠与不带斜杠都能到达，脚本与样式全部加载`, async () => {
    await viewport(1280, 900, false);
    for (const id of ['S02-01', 'S02-02', 'S02-03', 'S02-04', 'S09-03']) {
      for (const u of [M + 'lessons/' + id + '/', M + 'lessons/' + id + '/index.html', M + 'lessons/' + id]) {
        await load(u);
        assert.ok((await here()).startsWith(origin + M + 'lessons/' + id + '/'), u);
        assert.deepEqual(errorsSeen(), [], u); assert.deepEqual(badRequests(), [], u);
        assert.ok(await evaluate('return !!document.querySelector("#lesson-body") && document.querySelectorAll("link[rel=stylesheet]").length >= 2'));
      }
    }
  });

  test(`[${tag}] 链接普查：首页、目录、故事、五课里的所有站内链接都能打开，锚点都存在，没有指向样稿的旧链接`, async () => {
    await viewport(1280, 900, false);
    const pages = [M, M + 'lessons/S02-01/', M + 'lessons/S02-02/', M + 'lessons/S02-03/', M + 'lessons/S02-04/', M + 'lessons/S09-03/'];
    const seen = new Map();
    for (const pg of pages) {
      await load(pg);
      const links = await evaluate(`return [...document.querySelectorAll('a[href],link[href],script[src],img[src]')].map(e=>{const raw=e.getAttribute('href')||e.getAttribute('src');return {raw, abs:new URL(raw,location.href).href, tag:e.tagName}})`);
      for (const l of links) {
        assert.ok(!STALE.test(l.raw), pg + ' 有旧链接：' + l.raw);
        if (l.abs.startsWith(origin)) seen.set(l.abs, pg);
      }
    }
    assert.ok(seen.size > 20, '找到的站内链接太少：' + seen.size);
    for (const [u, from] of seen) {
      const [file, frag] = u.split('#');
      const rsp = await fetch(file); assert.equal(rsp.status, 200, from + ' → ' + u);
      if (!frag) continue;
      if (file.split('?')[0] === origin + M) {
        // 外壳路由：只接受已知的栏目、层级、阶段和课号
        assert.ok(SHELL_FRAGS.has(frag), from + ' → 外壳不认识的地址片段：#' + frag);
      } else {
        const html = await rsp.text();
        assert.ok(html.includes('id="' + frag + '"'), from + ' → ' + u + ' 的锚点不存在');
      }
    }
  });

  test(`[${tag}] 发布范围：site/ 之外的样稿、原稿，以及已移出的旧原型都访问不到`, async () => {
    for (const u of ['design-exploration/index.html', '../design-exploration/index.html', 'lessons/S02-02/proto-v4/index.html', 'tests/site-browser.test.js', '../MarketPilot-课程体系-v1.0.md']) {
      const rsp = await fetch(origin + M + u, { redirect: 'manual' });
      assert.ok(rsp.status === 404 || rsp.status === 403, u + ' 返回了 ' + rsp.status);
    }
  });

  test(`[${tag}] 找不到的地址：返回 404 状态和 404 页；页面有回首页和课程目录的链接，没有报错`, async () => {
    for (const vp of [[1280, 900, false], [390, 844, true]]) {
      await viewport(...vp);
      for (const u of ['no-such-page', 'lessons/S99-99/', 'lessons/S02-02/missing.html', 'assets/nope.js']) {
        const rsp = await fetch(origin + M + u);
        assert.equal(rsp.status, 404, u);
        assert.match(await rsp.text(), /找不到这个页面/, u);
      }
      await load(M + 'lessons/S99-99/deep/page');
      const r = await evaluate(`return {h1:document.querySelector('h1').textContent, links:[...document.querySelectorAll('a')].map(a=>[a.textContent,a.getAttribute('href')]), robots:document.querySelector('meta[name=robots]').content, txt:document.body.innerText, of:document.documentElement.scrollWidth-document.documentElement.clientWidth}`);
      assert.equal(r.h1, '找不到这个页面');
      assert.deepEqual(r.links, [['MarketPilot', '/'], ['回到首页', '/'], ['浏览课程目录', '/#courses']]);
      assert.equal(r.robots, 'noindex');
      assert.ok(!/开发|测试|路由|Cloudflare|筹备/.test(r.txt));
      assert.ok(r.of <= 0, '404 页横向溢出');
      // 页面本身的 404 状态会被浏览器记为一条网络错误，这是预期的；除此之外不应有任何错误
      assert.deepEqual(errorsSeen().filter(e => !(/status of 404/.test(e) && /S99-99\/deep\/page/.test(e))), []);
      if (M === '/') await shot(`site-${vp[2] ? 'mobile' : 'desktop'}-404`);
    }
    // 根路径部署时，两个链接都能用
    if (M === '/') {
      await load('/no-such-page');
      await clickNav('.go a.btn:not(.pri)');
      assert.equal(await here(), origin + '/#courses'); assert.equal(await screen(), 'courses');
    }
  });

  test(`[${tag}] 地址片段全覆盖：11 个阶段、61 个课号，直接打开都进入目录、展开所在阶段、定位正确`, async () => {
    await viewport(1280, 900, false);
    const all = [...CAT.stages.map(s => [s.id, s.id, null]), ...CAT.lessons.map(l => [l.id, l.stage.id, l.id])];
    assert.equal(all.length, 72);
    for (const [h, stage, row] of all) {
      await load(M + '#' + h);
      const r = await evaluate(`const t=document.getElementById(${JSON.stringify(h)}); const b=t.getBoundingClientRect(); return {scr:[...document.querySelectorAll('[data-screen]')].filter(s=>!s.hidden).map(s=>s.dataset.screen).join(), open:document.getElementById('${stage}').open, hit:[...document.querySelectorAll('li.hit')].map(x=>x.id), top:b.top, bottom:b.bottom, jb:document.getElementById('c-jump').getBoundingClientRect().bottom, vh:innerHeight, title:document.title}`);
      assert.equal(r.scr, 'courses', '#' + h);
      assert.ok(r.open, '#' + h + ' 的阶段没有展开');
      assert.deepEqual(r.hit, row ? [row] : [], '#' + h);
      assert.ok(r.top >= r.jb - 2 && r.top < r.vh, '#' + h + ' 不在可见位置：' + r.top);
      assert.equal(r.title, '课程 · MarketPilot');
    }
    assert.deepEqual(errorsSeen(), []);
  });
}

/* 搜索索引与页面一致：索引里的每一句都能在课程页初始状态的可见文字里找到；
   反过来，初始状态下看不到的内容（小题提示与答案、沙盘揭晓、默认收起或 display:none 的元素）一句也不进索引。 */
test('搜索索引：每一句都在课程页初始可见文字里；隐藏内容（答案、提示、揭晓）不进索引', async () => {
  await viewport(1280, 900, false);
  global.window = {}; require('../assets/search-index.js'); const IDX = global.window.MP_SEARCH; delete global.window;
  const squash = s => s.replace(/\s+/g, '');
  for (const id of Object.keys(CAT.readable)) {
    await load('/lessons/' + id + '/');
    const page = await evaluate(`
      /* 默认收起的 <details>（例如「这个模型没有模拟什么」）读者点开就能看，不算隐藏；先全部打开再读可见文字 */
      document.querySelectorAll('details').forEach(d => d.open = true);
      await new Promise(r => setTimeout(r, 100));
      const vis = document.body.innerText;
      const hid = [];
      for (const e of document.querySelectorAll('body *')) {
        if (e.closest('script,style,template,svg,noscript')) continue;
        const cs = getComputedStyle(e);
        const hidden = e.hidden || cs.display === 'none' || cs.visibility === 'hidden';
        if (!hidden) continue;
        if (e.parentElement && e.parentElement.closest('[hidden]') && !e.hidden) continue;
        const t = (e.textContent || '').trim();
        if (t) hid.push(t.slice(0, 400));
      }
      return {vis, hid};`);
    const vis = squash(page.vis), entries = IDX.filter(e => e.id === id);
    assert.ok(entries.length > 3, id + ' 索引条目太少');
    for (const e of entries) {
      assert.ok(vis.includes(squash(e.title.replace(/^S\d\d-\d\d /, ''))), id + ' 标题不在页面上：' + e.title);
      // 按空白和句末标点切成片段比较：页面上脚本加的「提交 / 看答案」等按钮会插在选项之间
      for (const s of e.text.split(/\s+|(?<=[。！？；])/).filter(x => x.length >= 4))
        assert.ok(vis.includes(s), id + ' #' + e.sec + ' 索引里的句子在页面上看不到：' + s.slice(0, 60));
    }
    const all = squash(entries.map(e => e.title + e.text).join(''));
    for (const t of page.hid) for (const s of t.split(/(?<=[。！？；])/).map(squash).filter(x => x.length >= 8)) {
      if (vis.includes(s)) continue; // 同一句话在页面别处是可见的（例如打印版的重复说明）
      assert.ok(!all.includes(s), id + ' 初始隐藏的内容进了索引：' + s.slice(0, 60));
    }
  }
});
