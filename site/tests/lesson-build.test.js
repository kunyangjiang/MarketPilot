/* 课程页组装检查：S01-01 至 S01-06、S02-01、S02-03、S02-04 的页面只依赖仓库内的文件就能重新生成，
 * 连续生成两次逐字节相同，并且与已验收的 site/lessons/<课号>/ 逐字节相同。
 * 运行：node --test site/tests/lesson-build.test.js（输出到临时目录，不动 site/lessons） */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { execFileSync } = require('child_process');

const SITE = path.join(__dirname, '..');
const ROOT = path.join(SITE, '..');
const TOOL = path.join(SITE, 'tools', 'lesson-build', 'assemble.js');
const LESSONS = ['S01-01', 'S01-02', 'S01-03', 'S01-04', 'S01-05', 'S01-06', 'S02-01', 'S02-03', 'S02-04'];
const FILES = ['index.html', 'lesson.css', 'steps.js'];
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
// 仓库里存的是 LF；在 core.autocrlf=true 的 Windows 检出里，已验收页面的工作副本可能是 CRLF，比较时先统一换行
const shaLF = f => crypto.createHash('sha256').update(fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')).digest('hex');

for (const id of LESSONS) {
  test(`${id}：连续生成两次结果相同，并与已验收页面逐字节一致`, () => {
    const a = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-lesson-a-'));
    const b = fs.mkdtempSync(path.join(os.tmpdir(), 'mp-lesson-b-'));
    try {
      execFileSync(process.execPath, [TOOL, id, a], { stdio: 'pipe' });
      execFileSync(process.execPath, [TOOL, id, b], { stdio: 'pipe' });
      for (const f of FILES) {
        assert.equal(sha(path.join(a, f)), sha(path.join(b, f)), `${id}/${f} 两次生成不一致`);
        assert.equal(shaLF(path.join(a, f)), shaLF(path.join(SITE, 'lessons', id, f)), `${id}/${f} 与已验收页面不一致`);
      }
    } finally {
      fs.rmSync(a, { recursive: true, force: true });
      fs.rmSync(b, { recursive: true, force: true });
    }
  });
}

test('组装工具和课程页配置只引用仓库内的文件：没有绝对路径、临时目录或 scratchpad', () => {
  const files = [TOOL, ...['md2html.js', 'base.css', 'steps.js'].map(f => path.join(SITE, 'tools', 'lesson-build', f))];
  for (const id of LESSONS) files.push(path.join(ROOT, 'lessons', id, '页面配置', 'config.js'), path.join(ROOT, 'lessons', id, '页面配置', 'figs.css'));
  for (const f of files) {
    assert.ok(fs.existsSync(f), '缺少文件：' + path.relative(ROOT, f));
    const s = fs.readFileSync(f, 'utf8');
    assert.ok(!/scratchpad|AppData|[\\/]Temp[\\/]|\b[A-Z]:[\\/]/i.test(s), '含有仓库外的路径：' + path.relative(ROOT, f));
  }
  for (const id of LESSONS) {
    const cfg = require(path.join(ROOT, 'lessons', id, '页面配置', 'config.js'));
    assert.ok(path.resolve(cfg.md).startsWith(path.join(ROOT, 'lessons', id)), id + ' 的课文不在本课目录下');
    assert.ok(fs.existsSync(cfg.md), id + ' 的课文不存在');
  }
});
