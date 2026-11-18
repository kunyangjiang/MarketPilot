# MarketPilot 站点（本地实现 · 尚未部署）

`site/` 是要发布的网站本身：首页、课程目录、故事栏目、全站搜索，以及已经写好的两节课。
没有 Git、没有部署、没有构建系统，也没有 npm 依赖。

## 路由

所有链接都是相对路径。站点放在域名根目录（`/`）或子路径（如 `/mp/`）下都能用。

| 地址（相对于站点根目录） | 内容 |
|---|---|
| `./` 或 `./#home` | 首页 |
| `./#courses` | 课程目录（4 层 · 11 个阶段 · 61 课） |
| `./#layer-1` … `./#layer-4` | 目录中的某一层 |
| `./#S01` … `./#S11` | 目录中的某个阶段（自动展开） |
| `./#S02-02` 等课号 | 目录中这一课所在的行（标出这一行） |
| `./#stories` | 故事栏目 |
| `./?search=词` | 打开搜索面板（课程页页头的搜索按钮用它） |
| `lessons/S02-01/` | S02-01 一家公司为什么要发行股票，你买股票的钱又去了哪里？ |
| `lessons/S02-02/` | S02-02 股价到底是谁决定的？ |
| `lessons/S02-03/` | S02-03 为什么屏幕上显示 $100，你下单却可能花 $100.30？ |
| `lessons/S02-04/` | S02-04 点击 Buy 之后，你的股票究竟经历了什么？ |
| `lessons/S09-03/` | S09-03 1907 年，一场失败的铜矿股逼空…… |

课程页的面包屑回到 `../../#层级` 和 `../../#阶段`。从目录打开一课时，地址会先换成该课所在的阶段，所以按浏览器的"返回"会回到这个阶段。

## 课程页

课程页按成品处理：没有「改看静态版」按钮，互动图默认就是分步版。系统设置了「减少动态效果」或打印时，页面自动显示全部步骤。

## 已写好的课与目录

`assets/catalog.js` 里的 `MP.readable` 列出已写好的课（目前是 S02-01 至 S02-04 和 S09-03），它们在目录里链接到课程页。其余 56 课只列课号和标题，不链接到任何页面。**网站上不显示任何写作或开放状态**（没有「可阅读 / 筹备中」之类的标签），`tests/site-product.test.js` 会拦下这类字样。

开放一节新课的步骤：
1. 放好 `lessons/<课号>/index.html`；
2. 在 `MP.readable` 里加一行；
3. 运行 `node site/tools/build-search-index.js`。

## 搜索索引

`assets/search-index.js` 由 `tools/build-search-index.js` 生成。生成脚本只读正式课程页的读者可见正文：开场的标题、核心问题和学习目标，以及 `<article>` 里每个带 id 的小节。以下内容不收：带 `hidden` 属性的元素（小题的提示与答案、沙盘的揭晓，免得搜索摘要提前透露答案）、只在「自由实验」模式出现的 `free-only` 控件、`<noscript>`、图的表格视图（`details.tbl`，只有数字）。它不读课文原稿、核验记录或设计样稿。

**课程页改动后必须重新生成。** `tests/site-search.test.js` 会把索引和课程页对比，索引过期测试就会失败。

还没写的课不进这个文件。搜索面板按课号和标题收录它们，标「目录」，没有摘要，点击后只定位到目录里对应的那一行。已写好的课的结果标「课程」（课程页）或「小节」（课程页里的某一节）。

## 发布目录

```bash
node site/tools/build-dist.js
```

输出到 `E:/MarketPilot/dist/`（每次整个重建）。脚本先重新生成搜索索引，再从 `index.html`、`404.html` 和每一节已写好的课出发，顺着站内 `href`/`src` 收集文件，原样复制，最后打印每个文件的 sha256 和总哈希。没被页面引用的文件不会进入发布目录；`tests/`、`tools/`、`shots/`、`.md`、`.pdf`、原型和点文件即使被引用也会直接报错。根相对路径（`/xxx`）也会报错，因为子路径部署时会失效；唯一的例外是 `404.html`。

发布目录只有 24 个文件（约 470 KB）。

`404.html`：Cloudflare Pages 对找不到的地址返回它（状态 404）。它可能出现在任意深度的地址上，所以样式全部内联，链接用根路径 `/` 和 `/#courses`，按部署在域名根目录设计。字体来自 Google Fonts，照片热链 `upload.wikimedia.org`，都不在发布目录里。

## 本地预览

```bash
python -m http.server 8772 --bind 127.0.0.1 --directory E:/MarketPilot/site
```

然后打开 <http://127.0.0.1:8772/>。要看发布目录，把 `--directory` 换成 `E:/MarketPilot/dist`。

## 测试

需要 Node 22 及以上。浏览器测试会以无头模式启动本机 Chrome（`C:/Program Files/Google/Chrome/Application/chrome.exe`，可以用 `CHROME` 环境变量覆盖）。字体和照片来自外网，所以需要联网。运行时请写出文件名或带引号的通配符；`node --test tests/` 这种写法不会运行这些测试。

```bash
cd E:/MarketPilot
node --test "site/tests/*.test.js" "lessons/S09-03/preflight/*.test.js"
```

| 文件 | 内容 |
|---|---|
| `tests/site-catalog.test.js` | 层级、阶段、61 课的课号、标题和顺序，与 `MarketPilot-课程体系-v1.0.md` 逐字核对；目录数据不提供状态文字 |
| `tests/site-search.test.js` | 索引是否新鲜、链接和锚点是否存在、文字是否来自课程页、有没有草稿字样；隐藏内容、表格视图、`<noscript>` 不进索引 |
| `tests/site-dist.test.js` | 发布目录：只含运行时文件、与源文件逐字节相同、两次生成哈希一致、引用都能解析、每页都有 noindex |
| `tests/site-product.test.js` | 课程页和外壳上没有开发过程的痕迹（「改看静态版」、流程用语、内部文件名、状态标签等） |
| `tests/site-browser.test.js` | **测的是临时生成的发布目录**（设 `MP_ROOT=src` 改测源目录）。根路径与子路径各一遍，桌面 1280 与手机 390 各一遍：首页、目录、层级跳转、地址片段（11 个阶段和 61 个课号全部直接打开）、课程往返、搜索、故事、直接打开课程地址、链接普查、发布范围；另有一项在浏览器里核对搜索索引：每一句都在课程页初始可见文字里，初始隐藏的内容一句都不在索引里 |
| `tests/engine.test.js`、`content-fidelity.test.js`、`browser.test.js` | S02-02 |
| `tests/s02-batch01-*.test.js` | S02-01、S02-03、S02-04（内容与数字；真实浏览器中的交互、键盘、减少动态效果、打印、手机） |
| `tests/s0903-*.test.js`、`lessons/S09-03/preflight/*.test.js` | S09-03（含时间线来源代号与图中来源的对照） |

截图写到 `shots/`。

## 文件

| 路径 | 作用 |
|---|---|
| `index.html` | 站点外壳：首页、课程目录、故事、搜索面板 |
| `assets/site.css` | 站点通用样式：令牌、页头、照片热点、课文阅读布局、页脚、回到顶部 |
| `assets/shell.css` | 首页、目录、故事、搜索的样式，搬自统一样稿 |
| `assets/catalog.js` | 61 课目录数据和已写好的课的清单 |
| `assets/photos.js` | 外壳用到的 9 张照片及其来源 |
| `404.html` | 找不到页面时显示 |
| `assets/search-index.js` | 搜索索引（自动生成） |
| `assets/shell.js`、`assets/search.js`、`assets/totop.js` | 路由与渲染、搜索、回到顶部 |
| `tools/build-search-index.js` | 生成搜索索引 |
| `tools/build-dist.js` | 生成发布目录 |
| `engine/`、`lessons/S02-0*/`、`lessons/S09-03/` | 五节课及 S02-02 的撮合引擎（S02-03 也调用它） |
| `tests/`、`tools/`、`shots/` | 开发用，**不应发布** |

## 不在本目录里的东西

- `design-exploration/`：设计样稿，只作参考，网站不链接它。
- `lessons/S02-02/proto-v4/`：S02-02 的图组件原型，已从 `site/` 移出，只作参考。
