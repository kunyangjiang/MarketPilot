/* 发布目录检查：tools/build-dist.js 生成的目录只含运行时文件，内容与源文件逐字节相同，两次生成结果一致。
 * 运行：node --test site/tests/site-dist.test.js（输出到临时目录，不动 E:\MarketPilot\dist） */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const D = require('../tools/build-dist.js');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mp-dist-test-'));
const walk = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')]).sort();

let A, B;
test.before(() => { A = D.build(tmp()); B = D.build(tmp()); });
test.after(() => { for (const r of [A, B]) fs.rmSync(r.out, { recursive: true, force: true }); });

test('只含运行时文件：首页、两课、它们引用的样式、脚本、图片和搜索索引', () => {
  const files = walk(A.out);
  assert.deepEqual(files, A.files.map(f => f.file));
  for (const need of ['index.html', '404.html', 'assets/search-index.js', 'assets/catalog.js', 'assets/shell.js', 'assets/search.js', 'lessons/S02-01/index.html', 'lessons/S02-02/index.html', 'lessons/S02-03/index.html', 'lessons/S02-04/index.html', 'lessons/S09-03/index.html', 'engine/orderbook.js'])
    assert.ok(files.includes(need), '缺少 ' + need);
  for (const f of files) for (const re of D.EXCLUDE) assert.ok(!re.test(f), '不应发布：' + f);
  for (const f of files) assert.ok(/\.(html|css|js|png|jpe?g|webp|svg|woff2?)$/i.test(f), '不是网页运行时文件：' + f);
  assert.ok(!files.some(f => /(^|\/)(tests|tools|shots|proto[^/]*)\//.test(f)));
});

test('逐字节等于源文件；两次生成的清单和总哈希相同', () => {
  for (const f of A.files) assert.ok(fs.readFileSync(path.join(A.out, f.file)).equals(fs.readFileSync(path.join(D.SITE, f.file))), f.file);
  assert.equal(A.digest, B.digest);
  assert.deepEqual(A.files, B.files);
  assert.equal(B.indexRegenerated, false, '第二次生成时搜索索引不应再变化');
});

test('发布目录里每个 HTML 的站内引用都能在发布目录里找到', () => {
  for (const f of A.files.filter(x => x.file.endsWith('.html'))) {
    const base = path.posix.dirname(f.file);
    for (const u of D.localRefs(fs.readFileSync(path.join(A.out, f.file), 'utf8'), D.ROOT_LINKS_OK.has(f.file))) {
      let r = path.posix.normalize(path.posix.join(base, u));
      if (u.endsWith('/') || r === '.') r = path.posix.join(r === '.' ? '' : r, 'index.html');
      assert.ok(fs.existsSync(path.join(A.out, r)), f.file + ' → ' + u + ' 不在发布目录里');
    }
  }
});

test('保护措施：每个页面都有 noindex；不能输出到 site/ 里面；根相对路径会被拒绝', () => {
  for (const f of A.files.filter(x => x.file.endsWith('.html')))
    assert.match(fs.readFileSync(path.join(A.out, f.file), 'utf8'), /<meta name="robots" content="noindex">/, f.file);
  assert.throws(() => D.build(path.join(D.SITE, 'dist')), /不能在 site\//);
  assert.throws(() => D.localRefs('<a href="/x/">'), /根相对路径/);
});
