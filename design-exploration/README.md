# MarketPilot 统一样稿

主方向 J 日常镜头，辅方向 Q 影像。主导航：首页 · 课程 · 故事，另加全站搜索。

## 预览

```bash
cd E:/MarketPilot/design-exploration
```

```bash
python -m http.server 8770 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8770/`，首页就是统一页面。

- 页面：地址末尾加 `#home`、`#courses`、`#lesson`、`#preview`、`#stories`、`#story`。
- 照片：老式黑白档案照片与早期彩色工艺名作（三色分色、奥托克罗姆、柯达克罗姆）交替使用，首页金枪鱼保持原色，见 `docs/照片审核.md`。
- 搜索：Ctrl K / ⌘ K；加 `?search=订单簿` 会直接打开搜索面板。
- 截图模式：加 `?embed=1`。
- 照片热链 Wikimedia Commons，字体来自 Google Fonts，需要联网。

## 目录

| 路径 | 内容 |
|---|---|
| `index.html` | 统一页面（第 3 轮 J＋Q 样稿） |
| `shared/` | 课程数据、照片清单（`photos.js` 原有，`photos-2.js` 照片审核后新增）、渲染辅助脚本 |
| `shots/` | 截图与截图脚本 |
| `docs/照片审核.md` | 照片审核：规则、每张照片的来源和用途 |
| `docs/round-3/README.md` | 第 3 轮信息架构、搜索、修订记录 |

前几轮的 HTML 样稿、对比画廊和截图已经移到 Windows 回收站，需要时可以从回收站还原。

## 边界

- 没有改动课程体系（4 层 · 11 阶段 · 61 课），也没有改动 `lessons/` 里的课文文件。
- 故事栏目全部是占位，没有写任何故事。
- 没有 Git 操作，没有部署。
