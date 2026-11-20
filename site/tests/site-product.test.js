/* 成品检查：已开放的课程页和站点外壳上，不出现开发过程的痕迹。
 *   - 没有「改看静态版」切换（默认就是动态版；减少动态效果和打印时由页面自动处理，不需要按钮）；
 *   - 没有内容清单式的标签（图几张、小题几道）和关于播放方式的说明；
 *   - 没有「未发布 / 发布前须核对 / 终验 / 试写稿 / 候选」等流程用语，也不引用读者看不到的内部文件；
 *   - 不显示任何写作或开放状态：首页、目录、搜索、故事都没有「可阅读 / 筹备中 / 写作中 / 开发中」之类的标签；
 *   - 说明性短句不以句号结尾的那几处保持简短。
 * 运行：node --test site/tests/site-product.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SITE = path.resolve(__dirname, '..');
const rd = p => fs.readFileSync(path.join(SITE, p), 'utf8');
const strip = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

const BAD = ['modebtn', '改看静态版', '改看分步', '不会自动播放', 'chip inc', '未发布', '发布前', '终验', '试写稿', '候选', '待审核',
  '《史实时间线》', '《核验记录》', '幕后研究文件', '共用同一个撮合引擎', '暂不能阅读', '只列标题', '图解和互动都在课里',
  '可阅读', '筹备中', '写作中', '开发中', '未公开发布', '档案照片待核实', '现在可读', '暂不能打开', '敬请期待'];

for (const p of ['lessons/S01-01/index.html', 'lessons/S01-02/index.html', 'lessons/S01-03/index.html', 'lessons/S01-04/index.html', 'lessons/S01-05/index.html', 'lessons/S01-06/index.html', 'lessons/S02-01/index.html', 'lessons/S02-02/index.html', 'lessons/S02-03/index.html', 'lessons/S02-04/index.html', 'lessons/S09-03/index.html', 'index.html', '404.html', 'assets/shell.js', 'assets/search.js', 'assets/catalog.js', 'assets/photos.js']) {
  test('没有开发过程的痕迹：' + p, () => {
    const s = strip(rd(p));
    for (const b of BAD) assert.ok(!s.includes(b), p + ' 仍有「' + b + '」');
  });
}

test('首页：推荐卡片不挂状态标签；层级说明是「4 层 · 11 个阶段 · 61 课」', () => {
  const js = strip(rd('assets/shell.js'));
  const now = js.slice(js.indexOf("$('h-now')"), js.indexOf("$('h-lsum')"));
  assert.ok(!/class="stat/.test(now), '首页推荐卡片仍有状态标签');
  assert.match(js, /\$\('h-lsum'\)\.textContent = MP\.layers\.length \+ ' 层 · ' \+ MP\.stages\.length \+ ' 个阶段 · ' \+ MP\.lessons\.length \+ ' 课';/);
});

test('首页层级说明正好是「4 层 · 11 个阶段 · 61 课」：没有后续句子，没有句末标点', () => {
  global.window = {}; for (const m of ['../assets/catalog.js', '../assets/photos.js']) delete require.cache[require.resolve(m)]; require('../assets/catalog.js'); const MP = global.window.MP; delete global.window;
  const sum = MP.layers.length + ' 层 · ' + MP.stages.length + ' 个阶段 · ' + MP.lessons.length + ' 课';
  assert.equal(sum, '4 层 · 11 个阶段 · 61 课');
});

test('目录数据不再提供状态文字；照片清单是统一样稿里外壳用的 9 张', () => {
  global.window = {}; for (const m of ['../assets/catalog.js', '../assets/photos.js']) delete require.cache[require.resolve(m)]; require('../assets/catalog.js'); require('../assets/photos.js'); const W = global.window; delete global.window;
  assert.equal(W.MP.status, undefined);
  assert.deepEqual(Object.keys(W.PH).filter(k => typeof W.PH[k] === 'object'), ['tuna', 'broadSt', 'abbottRoof', 'melons', 'abbottSkyline', 'crowd29c', 'chicagoTrains', 'panic1907', 'strand1915']);
});
