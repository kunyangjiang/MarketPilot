/* S09-03 浏览器测试：真实 Chrome（无头）＋ Chrome DevTools Protocol，不依赖任何 npm 包。
 * 运行：node --test site/tests/s0903-browser.test.js
 * 需要：本机 Chrome（默认 C:/Program Files/Google/Chrome/Application/chrome.exe，可用 CHROME 环境变量覆盖）；字体来自 Google Fonts。
 * 输出：截图写入 site/shots/S09-03-*.png。
 * CDP 小工具与 S02-02 的 browser.test.js 相同（复制而不是共享，避免改动 S02-02 的文件）。 */
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
const PAGE = '/site/lessons/S09-03/index.html';
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
  await cdp('Page.navigate', { url: base + (url || PAGE) });
  for (let i = 0; i < 100; i++) { await sleep(150); const ok = await evaluate('return document.readyState==="complete" && !!document.querySelector("#figB .pf-stage svg")').catch(() => false); if (ok) break; }
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
// 放大截取图 B 代理线（尼克博克—国民商业银行）及其文字附近
async function zoomAgency(name, n) {
  const box = await evaluate(FIG + `await to('figB',${n}); const g=[...fig('figB').querySelectorAll('g.e.agency')].find(x=>/尼克博克经国民商业银行/.test(x.querySelector('title').textContent));
    g.scrollIntoView({block:'center'}); await wait(200); const rs=[g.getBoundingClientRect(), ...[...g.querySelectorAll('text')].map(t=>t.getBoundingClientRect())];
    const x0=Math.min(...rs.map(r=>r.left)), y0=Math.min(...rs.map(r=>r.top)), x1=Math.max(...rs.map(r=>r.right)), y1=Math.max(...rs.map(r=>r.bottom));
    return {x:x0+scrollX-40, y:y0+scrollY-40, w:x1-x0+80, h:y1-y0+80}`);
  const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.w, height: box.h, scale: 3 } });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
}
async function key(k, code, vk, text) {
  await cdp('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk }, text ? { text } : {}));
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
}
const errorsSeen = () => events.filter(e => e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
  .map(e => JSON.stringify(e.params).slice(0, 300));

const FIG = `
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const fig=id=>document.getElementById(id);
  const go=async(id,a)=>{fig(id).querySelector('[data-a='+a+']').click(); await wait(20);};
  const to=async(id,n)=>{await go(id,'again'); for(let i=1;i<n;i++) await go(id,'next');};
  const now=id=>fig(id).querySelector('.pf-now').textContent;
`;
/* 沙盘：只通过界面元素操作 */
const SB = `
  const R=document.getElementById('sim-model');
  const q=s=>R.querySelector(s);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const pick=async id=>{const s=q('#sb-scn');s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));await wait(20);};
  const radio=async(name,v)=>{const r=q('input[name='+name+'][value="'+v+'"]');r.click();await wait(20);};
  const noPred=async()=>{const c=q('#sb-predon'); if(c.checked){c.click();} await wait(10);};
  const run=async()=>{q('#sb-go').click();await wait(30);};
  const end=async()=>{q('#sb-end').click();await wait(30);};
  const reads=()=>[...R.querySelectorAll('.sheet')].map(s=>({nw:(s.querySelectorAll('.read .big')[1]||{}).textContent,cash:(s.querySelectorAll('.read .big')[0]||{}).textContent,lbl:(s.querySelector('.lbl')||{}).textContent||'',gap:(s.querySelector('.gap')||{}).textContent||''}));
`;

test.before(async () => { await startServer(); await startChrome(); });
test.after(() => { try { ws.close(); } catch (e) {} try { chrome.kill(); } catch (e) {} server.close(); });

test('桌面 1280：加载无报错、无横向滚动；图都停在第 1 步，等待 3 秒后仍不自动前进', async () => {
  await viewport(1280, 900);
  await load();
  const r = await evaluate(`return {figs:[...document.querySelectorAll('.pf[data-step]')].map(f=>[f.id,f.dataset.step]),
    over:document.documentElement.scrollWidth-innerWidth, h1:document.querySelector('h1').textContent,
    imgs:document.images.length, steps:[...document.querySelectorAll('.pf-steps')].map(e=>getComputedStyle(e).display),
    toc:[...document.querySelectorAll('#toc a')].map(a=>a.getAttribute('href')), reader:[...document.scripts].map(s=>s.getAttribute('src'))}`);
  assert.deepEqual(errorsSeen(), []);
  assert.deepEqual(r.figs.map(x => x[0]), ['figA', 'figB', 'fig2', 'fig3']);
  r.figs.forEach(([id, s]) => assert.equal(s, '1', id + ' 初始应在第 1 步'));
  assert.ok(r.over <= 0, '横向滚动 ' + r.over);
  assert.equal(r.h1, '1907 年，一场失败的铜矿股逼空，为什么让纽约的信托公司门前排起长队？');
  assert.equal(r.imgs, 1, '页面应只有开场这一张照片');
  assert.ok(r.steps.every(d => d === 'none'));
  assert.deepEqual(r.toc, ['#pre', '#s1', '#s2', '#s3', '#s4', '#s5', '#lab', '#s6', '#s7', '#s8', '#s9', '#s10', '#keys', '#srcs']);
  assert.ok(r.reader.includes('../S02-02/reader.js'));
  await shot('S09-03-desktop-hero', false);
  await shot('S09-03-desktop-full', true);
  const still = await evaluate(`for (const f of document.querySelectorAll('.pf[data-step]')) f.scrollIntoView({block:'center'});
    await new Promise(r=>setTimeout(r,3000)); return [...document.querySelectorAll('.pf[data-step]')].map(f=>f.dataset.step)`);
  assert.deepEqual(still, ['1', '1', '1', '1']);
});

test('reader.js 未修改，且在本页工作：目录高亮、进度条前进、点目录后焦点落在标题', async () => {
  // 与 S02-02 原文件逐字节相同（本页引用的就是那一份）
  const a = fs.readFileSync(path.join(ROOT, 'site/lessons/S02-02/reader.js'));
  assert.ok(!fs.existsSync(path.join(ROOT, 'site/lessons/S09-03/reader.js')), '不应复制一份 reader.js');
  assert.ok(a.length > 0);
  const r = await evaluate(`window.scrollTo(0,0); await new Promise(r=>setTimeout(r,200));
    const p0=getComputedStyle(document.getElementById('rprog')).transform;
    document.querySelector('#toc a[href="#s4"]').click();
    for(let i=0;i<40;i++){ await new Promise(r=>setTimeout(r,100)); const c=document.querySelector('#toc a[aria-current]'); if(c&&c.getAttribute('href')==='#s4'&&i>6) break; }
    return {p0, p1:getComputedStyle(document.getElementById('rprog')).transform, cur:(document.querySelector('#toc a[aria-current]')||{}).getAttribute&&document.querySelector('#toc a[aria-current]').getAttribute('href'), focus:document.activeElement.id}`);
  assert.notEqual(r.p0, r.p1, '进度条应前进');
  assert.equal(r.cur, '#s4');
  assert.equal(r.focus, 'h-s4');
});

test('图 A：14 步；10-21"宣布"与 10-22 停业在不同步；利率只有三个有记载的点；存款只有两个时点', async () => {
  const r = await evaluate(FIG + `
    const out=[]; await to('figA',1);
    for(let i=1;i<=14;i++){ out.push({i, shown:[...fig('figA').querySelectorAll('.ev')].filter(e=>e.getClientRects().length>0).length, cur:[...fig('figA').querySelectorAll('.ev.cur')].map(e=>e.textContent), now:now('figA'), rates:[...fig('figA').querySelectorAll('.rt.on')].map(e=>e.dataset.d), depVis:fig('figA').querySelector('.dep').getClientRects().length>0, late:[...fig('figA').querySelectorAll('.ev')].filter(e=>e.getClientRects().length>0&&+e.dataset.step>i-1).length}); if(i<14) await go('figA','next'); }
    return {out, cnt:fig('figA').querySelector('.cnt').textContent, dep:fig('figA').querySelector('.dep').textContent, nrt:fig('figA').querySelectorAll('.rt').length}`);
  assert.equal(r.cnt, '14 / 14');
  // 按时间顺序披露：每一步只看得到不晚于这一步的事件；存款（终点 12-19）只在最后一步出现
  r.out.forEach(o => { assert.equal(o.late, 0, '第 ' + o.i + ' 步看得到后面的事件'); assert.equal(o.depVis, o.i === 14, '第 ' + o.i + ' 步的存款行'); });
  const s7 = r.out[6], s8 = r.out[7];
  assert.ok(s7.cur.some(t => /宣布不再担任尼克博克的清算代理/.test(t)), '第 7 步（10-21）应有"宣布"');
  assert.ok(!s7.cur.some(t => /暂停营业/.test(t)), '10-21 这一步不应出现停业');
  assert.ok(s8.cur.some(t => /中午刚过暂停营业/.test(t)), '第 8 步（10-22）是停业');
  assert.match(s7.now, /宣布与第二天的停业是两件事/);
  assert.ok(!/\d{1,2}:\d{2}|\d+ 点/.test(r.out.map(o => o.cur.join('')).join('')), '不应出现精确时刻');
  assert.deepEqual(r.out[6].rates, []); assert.deepEqual(r.out[7].rates, ['10-22']); assert.deepEqual(r.out[9].rates, ['10-22', '10-24']); assert.deepEqual(r.out[13].rates, ['10-22', '10-24', '10-25']);
  assert.equal(r.nrt, 3);
  assert.match(r.dep, /只有两个时点的记载/);
  for (let i = 1; i < 14; i++) assert.ok(r.out[i].shown >= r.out[i - 1].shown, '时间线只增不减');
  assert.equal(r.out[0].shown, 4, '第 1 步只应看到背景四条'); assert.ok(r.out[7].shown < r.out[13].shown, '10-22 这一步不应看到之后的事件');
  await evaluate(FIG + `await to('figA',8); return 1`);
  await shotOf('#figA', 'S09-03-desktop-figA-1022');
});

test('图 A：分类开关只改变突出显示，不删除条目', async () => {
  const r = await evaluate(FIG + `await to('figA',14); const b=fig('figA').querySelector('.cats [data-cat=trust]'); b.click(); await wait(20);
    const res={pressed:b.getAttribute('aria-pressed'), hit:fig('figA').querySelectorAll('.ev.hit').length, all:fig('figA').querySelectorAll('.ev:not([hidden])').length, filtered:fig('figA').classList.contains('filtered')};
    b.click(); await wait(20); res.off=fig('figA').classList.contains('filtered'); return res`);
  assert.equal(r.pressed, 'true'); assert.ok(r.hit > 0 && r.hit < r.all); assert.equal(r.filtered, true); assert.equal(r.off, false);
});

test('图 B：圈只表示直接会员；10-21 只标"已宣布终止"、10-22 才变灰虚线；美国信托 / 林肯 / 布鲁克林的未知关系不画线', async () => {
  const r = await evaluate(FIG + `
    const ag=()=>{const g=[...fig('figB').querySelectorAll('g.e.agency')].find(x=>/尼克博克经国民商业银行/.test(x.querySelector('title').textContent)); return g?{cls:g.getAttribute('class'), lab:[...g.querySelectorAll('text')].map(t=>t.textContent).join(''), dash:getComputedStyle(g.querySelector('polyline')).strokeDasharray}:null;};
    const st={}; for(const n of [1,6,7,8]){ await to('figB',n); st[n]={ag:ag(), marks:[...fig('figB').querySelectorAll('.mk text')].map(t=>t.textContent), now:now('figB')}; }
    await to('figB',13);
    const lines=[...fig('figB').querySelectorAll('g.e title')].map(t=>t.textContent).join('|');
    const nodes=n=>{const g=fig('figB').querySelector('g.n[data-id='+n+']'); return [...g.querySelectorAll('text')].map(t=>t.textContent).join('');};
    return {st, lines, TCA:nodes('TCA'), LIN:nodes('LIN'), BRK:nodes('BRK'), KNI:fig('figB').querySelector('g.n[data-id=KNI]').getAttribute('class'),
      eq:fig('figB').querySelector('.legend .eq').textContent, lg:fig('figB').querySelector('.legend').textContent, tv:fig('figB').querySelector('.tv').textContent, vb:fig('figB').querySelector('.pf-stage svg').getAttribute('viewBox')}`);
  assert.equal(r.eq, '直接会员 ≠ 清算代理 ≠ 紧急援助 ≠ 未知');
  assert.equal(r.st[1].ag.lab, '清算代理'); assert.equal(r.st[1].ag.dash, 'none');
  assert.equal(r.st[7].ag.lab, '清算代理10-21 已宣布终止'); assert.equal(r.st[7].ag.dash, 'none', '10-21 不画切断');
  assert.ok(r.st[7].marks.includes('✕ 清算所拒绝援助'));
  assert.match(r.st[8].ag.cls, /ended/); assert.equal(r.st[8].ag.lab, '已宣布终止（10-21）实际停止时间未核实', '10-22 的虚线要注明实际停止时间未核实');
  assert.match(r.st[8].now, /实际停止时间未核实/); assert.match(r.st[8].now, /不表示代理服务在哪一刻真正停止/);
  assert.ok(!/实际停止/.test(r.st[7].ag.lab), '10-21 只标"已宣布"');
  assert.match(r.lg, /灰虚线：已宣布终止（实际停止时间未核实）/);
  assert.match(r.tv, /服务实际停止的时间未核实/); assert.notEqual(r.st[8].ag.dash, 'none');
  assert.ok(r.st[8].marks.includes('暂停营业'));
  assert.ok(!r.st[8].marks.includes('✕ 清算所拒绝援助'), '"被拒"标记只在 10-21 这一步');
  assert.match(r.KNI, /m-non/, '尼克博克不在圈内');
  assert.match(r.TCA, /清算代理关系未确立/); assert.match(r.LIN, /清算代理关系未确立/); assert.match(r.BRK, /纽约清算所会员身份：本课未核实/);
  assert.ok(!/美国信托公司经|林肯信托经/.test(r.lines), '不应为美国信托 / 林肯画清算代理线');
  assert.match(r.tv, /清算代理关系未确立/);
  assert.equal(r.vb, '0 70 700 630');
  for (const n of [1, 7, 8, 13]) { await evaluate(FIG + `await to('figB',${n}); return 1`); await shotOf('#figB', 'S09-03-desktop-figB-step' + String(n).padStart(2, '0')); }
  // 每一步都截图（宽版），并放大代理线附近（10-21、10-22）
  for (let n = 1; n <= 13; n++) { await evaluate(FIG + `await to('figB',${n}); return 1`); await shotOf('#figB .pf-stage', 'S09-03-desktop-figB-all-' + String(n).padStart(2, '0'), 0); }
  for (const n of [7, 8]) await zoomAgency('S09-03-desktop-figB-agency-zoom-' + String(n).padStart(2, '0'), n);
});

test('沙盘 M5：四个分支都能通过界面复现（+6、−9、+7.5、−7.5）；揭晓前只给区间；有固定的历史对照句', async () => {
  const out = {};
  for (const basis of [25, 40]) {
    out[basis] = await evaluate(SB + `await pick('M5'); await noPred(); await radio('sb-basis',${basis}); await run(); await end();
      const before=reads()[0]; const rv=q('#sb-reveal'); const hidden=rv.hidden;
      rv.querySelector('[data-rv=rand]').click(); await wait(30);
      const k1=+rv.querySelector('b').textContent; const r1=reads()[0];
      rv.querySelector('[data-rv=other]').click(); await wait(30);
      const k2=+rv.querySelector('b').textContent; const r2=reads()[0];
      return {before, hidden, k1, r1, k2, r2, line:rv.querySelector('.hist-line').textContent, hist:document.getElementById('sim-hist').textContent}`);
  }
  const at = (o, k) => (o.k1 === k ? o.r1 : o.r2);
  for (const b of [25, 40]) { assert.equal(out[b].hidden, false); assert.deepEqual([out[b].k1, out[b].k2].sort(), [25, 40]); }
  assert.equal(out[25].before.nw, '揭晓前未知：在 −9 到 6 之间');
  assert.equal(out[40].before.nw, '揭晓前未知：在 −7.5 到 7.5 之间');
  assert.equal(out[25].before.cash, '69.75'); assert.equal(out[40].before.cash, '81');
  assert.equal(at(out[25], 40).nw, '6'); assert.match(at(out[25], 40).lbl, /净资产仍为正，但当日可支付现金不足/);
  assert.equal(at(out[25], 25).nw, '−9'); assert.match(at(out[25], 25).lbl, /抵押贷款减值 15（40 → 25）＋ 甩卖损失 4（通知贷款 1、证券 3），超过了原有资本 10，差额为 9/);
  assert.equal(at(out[40], 40).nw, '7.5'); assert.match(at(out[40], 40).lbl, /净资产为正，当日可支付全部提款/);
  assert.equal(at(out[40], 25).nw, '−7.5'); assert.match(at(out[40], 25).gap, /抵押品覆盖缺口 5（借款 30 − 抵押品 25）/);
  assert.match(at(out[40], 25).gap, /不等于出借人的实际信用损失/);
  assert.equal(at(out[40], 40).gap, ''); assert.equal(at(out[25], 25).gap, '');
  assert.equal(out[25].line, '在模型里你可以揭晓答案。1907 年 10 月 21 日夜里，没有人能。');
  assert.match(out[25].hist, /斯特朗在有限时间内无法判断尼克博克的偿付能力/);
  await evaluate(SB + `await pick('M5'); await noPred(); await radio('sb-basis',40); await run(); await end(); window.__sandbox.reveal(25); return 1`);
  await shotOf('#lab', 'S09-03-desktop-sandbox-M5-40-25');
});

test('沙盘 M1–M4、M6：读数与手算一致；每一步都有"发生了什么 / 为什么 / 要看出什么"', async () => {
  const r = await evaluate(SB + `const o={};
    for (const id of ['M1','M2','M3','M4']) { await pick(id); await noPred(); await run(); const n=q('#sb-cnt').textContent; const first=q('#sb-now').textContent; await end(); o[id]={n, first, r:reads()[0]}; }
    for (const p of [1,2,3]) { await pick('M6'); await radio('sb-path',p); await noPred(); await run(); await end(); o['M6-'+p]=reads(); }
    return o`);
  assert.equal(r.M1.r.nw, '10'); assert.match(r.M1.r.lbl, /当日可支付全部提款/);
  assert.equal(r.M2.r.cash, '51'); assert.equal(r.M2.r.nw, '6'); assert.match(r.M2.r.lbl, /净资产仍为正，但当日可支付现金不足/);
  assert.equal(r.M3.r.nw, '9.375');
  assert.equal(r.M4.r.nw, '−6.5625'); assert.match(r.M4.r.lbl, /抵押贷款减值 15（40 → 25）＋ 甩卖损失 1.5625（通知贷款 1、证券 0.5625），超过了原有资本 10，差额为 6.5625/);
  for (const id of ['M1', 'M2', 'M3', 'M4']) assert.match(r[id].first, /发生了什么.*为什么.*要看出什么/);
  assert.equal(r['M6-1'][1].nw, '4.5'); assert.match(r['M6-1'][1].lbl, /当日可支付现金不足/);
  assert.equal(r['M6-2'][1].nw, '9.375'); assert.match(r['M6-2'][1].lbl, /当日可支付全部提款/);
  assert.equal(r['M6-3'][1].nw, '≈9.792');
  await shotOf('#lab', 'S09-03-desktop-sandbox-M6-1');
});

test('沙盘：预设场景隐藏可编辑参数、只给只读摘要；自由实验显示全部可编辑参数；切换不改变预设结果', async () => {
  const r = await evaluate(SB + `const vis=e=>e.getClientRects().length>0;
    const free=()=>[...R.querySelectorAll('.free-only')].map(n=>({v:vis(n), off:[...n.querySelectorAll('input')].some(i=>i.disabled)}));
    const st=id=>({sum:vis(q('#sb-sum'))?q('#sb-sum').textContent:null, free:free(), m5:vis(q('.m5-only')), m6:vis(q('.m6-only')), go:vis(q('#sb-go')), pred:vis(q('#sb-predon'))});
    const o={}; for (const id of ['M1','M2','M3','M4','M5','M6','FREE']) { await pick(id); o[id]=st(id); }
    // M4 → 自由实验：参数沿用 M4，结果相同
    await pick('M4'); await noPred(); await run(); await end(); const m4=reads()[0].nw;
    await pick('FREE'); await run(); await end(); const f4=reads()[0].nw;
    // 自由实验里改参数，回到 M4 结果不变
    const w=q('#sb-w'); w.value=20; w.dispatchEvent(new Event('input',{bubbles:true})); await run(); await end(); const f20=reads()[0].nw;
    await pick('M4'); await run(); await end(); const m4b=reads()[0].nw;
    // 自由实验的约束：没有借款渠道时评估值不可调
    await pick('FREE'); await radio('sb-ch','n'); const apOffNo=q('#sb-ap').disabled; await radio('sb-ch','y'); const apOffYes=q('#sb-ap').disabled;
    // M5：揭晓后摘要不变，仍不给真实值
    await pick('M5'); await run(); await end(); const s5a=q('#sb-sum').textContent; window.__sandbox.reveal(25); const s5b=q('#sb-sum').textContent;
    return {o, m4, f4, f20, m4b, apOffNo, apOffYes, s5a, s5b}`);
  for (const id of ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']) {
    const s = r.o[id];
    assert.ok(s.free.every(x => !x.v), id + '：预设下不应显示自由实验的控件');
    assert.ok(s.sum && /本场景的参数（固定）/.test(s.sum), id + '：应有只读摘要');
    assert.ok(s.go && s.pred, id + '：开始与预测控件保留');
    assert.equal(s.m5, id === 'M5'); assert.equal(s.m6, id === 'M6');
  }
  assert.match(r.o.M1.sum, /当天提款需求 W8.*市场状态平静.*紧急借款渠道没有/);
  assert.match(r.o.M2.sum, /当天提款需求 W60.*市场状态恐慌.*紧急借款渠道没有/);
  assert.match(r.o.M3.sum, /出借人的评估值40.*抵押贷款的真实价值40/);
  assert.match(r.o.M4.sum, /出借人的评估值25.*抵押贷款的真实价值25/);
  assert.match(r.o.M5.sum, /当天提款需求 W75.*由你在下方选择.*揭晓前不显示/);
  assert.match(r.o.M6.sum, /甲第 1 天 75/);
  assert.equal(r.o.FREE.sum, null, '自由实验不显示摘要');
  assert.ok(r.o.FREE.free.every(x => x.v), '自由实验显示全部参数控件');
  assert.equal(r.o.FREE.m5, false); assert.equal(r.o.FREE.m6, false);
  assert.equal(r.m4, '−6.5625'); assert.equal(r.f4, '−6.5625', '从 M4 切到自由实验，参数沿用，结果相同');
  assert.notEqual(r.f20, r.m4); assert.equal(r.m4b, '−6.5625', '自由实验改参数后，M4 的结果不变');
  assert.equal(r.apOffNo, true); assert.equal(r.apOffYes, false);
  assert.equal(r.s5a, r.s5b); assert.ok(!/真实价值25|真实价值40/.test(r.s5b.replace(/\s/g, '')));
  await evaluate(SB + `await pick('M4'); return 1`); await shotOf('#lab .ctl', 'S09-03-desktop-sandbox-preset-M4');
  await evaluate(SB + `await pick('FREE'); return 1`); await shotOf('#lab .ctl', 'S09-03-desktop-sandbox-free');
});

/* 开场：照片铺底，日期、三个数字和来源说明压在暗部，照片说明在底部遮幅里；桌面和手机都检查可读性与遮挡 */
const HERO = `const f=document.querySelector('figure.ph'), img=f.querySelector('img.ph-img'), cap=f.querySelector('.ph-cap'), sub=f.querySelector('.ph-sub'), big=f.querySelector('.ph-big');
  const fb=f.getBoundingClientRect(), cb=cap.getBoundingClientRect(), sb=sub.getBoundingClientRect(), ib=img.getBoundingClientRect();
  const z=e=>+getComputedStyle(e).zIndex||0;
  return {txt:f.innerText, kids:[...f.children].map(e=>e.tagName.toLowerCase()+'.'+e.className), label:document.getElementById(f.getAttribute('aria-labelledby')).textContent,
    credits:document.querySelector('.credits').innerText, loaded:img.complete&&img.naturalWidth>0, alt:img.alt, href:cap.querySelector('a').getAttribute('href'), cap:cap.textContent,
    fills:Math.abs(ib.width-fb.width)<2&&Math.abs(ib.height-fb.height)<2, capIn:cb.left>=fb.left&&cb.right<=fb.right&&cb.bottom<=fb.bottom+1, capBelowSub:cb.top>=sb.bottom-1,
    textOnTop:z(sub)>z(img)&&z(big)>z(img), bigColor:getComputedStyle(big).color, fh:fb.height}`;
test('开场照片：照片铺满开场、文字压在上层、照片说明在遮幅里且不挡住文字；链接到 NYPL 馆藏；加 ?review 也一样', async () => {
  const get = () => evaluate(HERO);
  const pub = await get();
  assert.ok(!/待核实|预留|内部审阅|版权/.test(pub.txt + pub.credits), '不应出现审阅或版权状态文字');
  assert.deepEqual(pub.kids, ['img.ph-img', 'span.ph-shade', 'p.ph-date', 'p.ph-big', 'p.ph-sub', 'figcaption.ph-cap']);
  assert.ok(pub.loaded, '开场照片没有加载'); assert.ok(pub.fills, '照片没有铺满开场');
  assert.ok(pub.alt.length >= 8 && !/尼克博克|10 月 22/.test(pub.alt));
  assert.equal(pub.href, 'https://old-digitalcollections.nypl.org/items/510d47dd-5b2c-a3d9-e040-e00a18064a99');
  assert.equal(pub.cap, '华尔街金融恐慌时期的人群。纽约公共图书馆馆藏，1907 年（馆藏推定）。');
  assert.ok(pub.capIn && pub.capBelowSub, '照片说明超出开场或挡住来源说明');
  assert.ok(pub.textOnTop, '文字应压在照片上层');
  assert.match(pub.txt, /约三个小时/); assert.match(pub.label, /尼克博克信托公司被挤兑的那个上午/);
  assert.match(pub.credits, /纽约公共图书馆/); assert.match(pub.credits, /723882F/);
  await shotOf('figure.ph', 'S09-03-desktop-hero-public', 0);
  await load(PAGE + '?review');
  assert.deepEqual(await get(), pub, '?review 不应改变页面');
  await load();
});

test('沙盘：分步由读者推进；预测提示可以关闭；模型界面不出现真实机构名和被禁止的措辞', async () => {
  const r = await evaluate(SB + `await pick('M2'); const c=q('#sb-predon'); if(!c.checked) c.click(); await run();
    const vis=e=>e.getClientRects().length>0; await pick('M5'); const m5=[vis(q('.m5-only')),vis(q('.m6-only'))]; await pick('M2'); const c2=q('#sb-predon'); if(!c2.checked) c2.click(); await run();
    const pred=!q('#sb-pred').hidden; const opts=[...q('#sb-pred').querySelectorAll('button')].map(b=>b.textContent);
    q('#sb-pred button[data-p="0"]').click(); await wait(30);
    const s1=q('#sb-cnt').textContent; await new Promise(r=>setTimeout(r,1500)); const s1b=q('#sb-cnt').textContent;
    await end(); const res=q('#sb-predres').textContent;
    const all=[]; for (const id of ['M1','M2','M3','M4','M5','M6','FREE']) { await pick(id); await noPred(); await run(); await end(); const rv=q('#sb-reveal .hist-line'); all.push(R.textContent.replace(rv?rv.textContent:'@@','')); }
    return {m5, pred, opts, s1, s1b, res, text:all.join('|')}`);
  assert.deepEqual(r.m5, [true, false], 'M5 只显示 M5 的选项');
  assert.equal(r.pred, true); assert.deepEqual(r.opts, ['撑得过', '撑不过']);
  assert.equal(r.s1, r.s1b, '不自动前进'); assert.match(r.s1, /^1 \//);
  assert.match(r.res, /你的预测：撑得过.*模型的结果是：撑不过/);
  for (const bad of ['尼克博克', '摩根', '斯特朗', '商业国民银行', '国民商业银行', '美国信托', '林肯', '纽约', '1907', '无清算安排', '出借人损失', '资不抵债', '没有一家信托公司是会员'])
    assert.ok(!r.text.includes(bad), '模型界面出现了"' + bad + '"');
});

test('键盘：只用键盘就能推进图 A 和沙盘；焦点可见', async () => {
  await evaluate(FIG + `await to('figA',1); fig('figA').querySelector('[data-a=next]').focus(); return 1`);
  await key('Enter', 'Enter', 13, '\r');
  const a = await evaluate(`return {step:document.getElementById('figA').dataset.step, ring:getComputedStyle(document.activeElement).outlineStyle}`);
  assert.equal(a.step, '2');
  await evaluate(`const s=document.getElementById('sb-scn'); s.value='M1'; s.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('sb-predon').checked=false; document.getElementById('sb-go').focus(); return 1`);
  await key('Enter', 'Enter', 13, '\r');
  const f = await evaluate(`return document.activeElement.id`);
  await evaluate(`document.getElementById('sb-next').focus(); return 1`);
  await key(' ', 'Space', 32, ' ');
  const b = await evaluate(`return document.getElementById('sb-cnt').textContent`);
  assert.match(b, /^2 \//);
  assert.ok(f !== undefined);
  await key('Tab', 'Tab', 9);
  const ring = await evaluate(`return getComputedStyle(document.activeElement).outlineStyle+'|'+document.activeElement.id`);
  assert.match(ring, /^solid/);
});

test('减少动态效果：全部图直接显示全部步骤；页面上没有「改看静态版」按钮；关闭后回到分步版', async () => {
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load();
  const r = await evaluate(`return {body:document.body.classList.contains('static'), figs:[...document.querySelectorAll('.pf[data-step]')].map(f=>f.dataset.step),
    lists:[...document.querySelectorAll('.pf-steps')].map(e=>[getComputedStyle(e).display, e.children.length]), ctrl:getComputedStyle(document.querySelector('#figA .pf-ctrl')).display,
    hiddenEv:document.querySelectorAll('#figA .ev[hidden]').length, btn:!!document.getElementById('modebtn')}`);
  assert.equal(r.body, true); assert.deepEqual(r.figs, ['static', 'static', 'static', 'static']);
  assert.ok(r.lists.every(([d, n]) => d === 'flex' && n > 0)); assert.equal(r.ctrl, 'none'); assert.equal(r.hiddenEv, 0);
  assert.equal(r.btn, false, '页面上不应再有静态版切换按钮');
  await shotOf('#figB', 'S09-03-reduced-figB');
  await cdp('Emulation.setEmulatedMedia', { features: [] });
  const back = await evaluate(`await new Promise(r=>setTimeout(r,100)); return [document.getElementById('figA').dataset.step, document.body.classList.contains('static')]`);
  assert.deepEqual(back, ['1', false]);
});

test('打印：静态版；导出 PDF', async () => {
  await load();
  await cdp('Emulation.setEmulatedMedia', { media: 'print' });
  const r = await evaluate(`return {ctrl:getComputedStyle(document.querySelector('#figB .pf-ctrl')).display, steps:getComputedStyle(document.querySelector('#figB .pf-steps')).display, toc:getComputedStyle(document.querySelector('.ltoc')).display}`);
  assert.equal(r.ctrl, 'none'); assert.equal(r.steps, 'flex'); assert.equal(r.toc, 'none');
  await cdp('Emulation.setEmulatedMedia', { media: '' });
  const pdf = await cdp('Page.printToPDF', { printBackground: true });
  fs.writeFileSync(path.join(SHOTS, 'S09-03-print.pdf'), Buffer.from(pdf.data, 'base64'));
  assert.ok(Buffer.from(pdf.data, 'base64').length > 50000);
});

test('来源可见：图中每个来源代号都能跳到文末书目；书目九条', async () => {
  const r = await evaluate(`const codes=[...new Set([...document.querySelectorAll('.srcs-in a')].map(a=>a.getAttribute('href')))];
    return {codes, missing:codes.filter(h=>!document.querySelector(h)), n:document.querySelectorAll('#srcs li').length, vis:getComputedStyle(document.getElementById('srcs')).display}`);
  assert.deepEqual(r.missing, []); assert.ok(r.codes.length >= 8); assert.equal(r.n, 9); assert.notEqual(r.vis, 'none');
  await shotOf('#srcs', 'S09-03-desktop-sources');
});

test('手机 390：无横向滚动；图 B 换成竖排布局；沙盘可用', async () => {
  await viewport(390, 844, true);
  await load();
  const r = await evaluate(`const over=[];document.querySelectorAll('main *').forEach(e=>{const b=e.getBoundingClientRect(); if(b.width&&b.right>innerWidth+1&&!e.closest('.tblw')) over.push(e.tagName+'.'+e.className)});
    return {sw:document.documentElement.scrollWidth-innerWidth, over:over.slice(0,8), vb:document.querySelector('#figB .pf-stage svg').getAttribute('viewBox')}`);
  assert.ok(r.sw <= 0, '横向滚动 ' + r.sw); assert.deepEqual(r.over, []);
  assert.equal(r.vb, '0 0 380 990');
  assert.deepEqual(errorsSeen(), []);
  const hero = await evaluate(HERO);
  assert.ok(hero.loaded && hero.fills && hero.capIn && hero.capBelowSub && hero.textOnTop, '手机开场照片布局：' + JSON.stringify(hero));
  await shot('S09-03-mobile-hero', false);
  await shot('S09-03-mobile-full', true);
  await evaluate(FIG + `await to('figB',8); return 1`);
  await shotOf('#figB', 'S09-03-mobile-figB-step08', 0);
  for (let n = 1; n <= 13; n++) { await evaluate(FIG + `await to('figB',${n}); return 1`); await shotOf('#figB .pf-stage', 'S09-03-mobile-figB-all-' + String(n).padStart(2, '0'), 0); }
  for (const n of [7, 8]) await zoomAgency('S09-03-mobile-figB-agency-zoom-' + String(n).padStart(2, '0'), n);
  await evaluate(SB + `await pick('M5'); await noPred(); await radio('sb-basis',25); await run(); await end(); window.__sandbox.reveal(25); return 1`);
  await shotOf('#lab', 'S09-03-mobile-sandbox-M5', 0);
  await shotOf('#figA', 'S09-03-mobile-figA', 0);
  await viewport(1280, 900);
});
