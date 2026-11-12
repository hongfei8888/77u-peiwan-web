# 价格页同步工具

这些是静态站点的开发工具，无需前端打包。使用 Node.js 20+ 和本机 Chrome。

默认验证基线随代码保存在 `tests/fixtures/`，仅包含公开页面资源映射、菜单结构及文件哈希，不包含账号状态或用户上传数据。克隆仓库后启动本地PHP服务即可运行验证；不依赖本机历史工作记录。

```powershell
npm ci
npm run probe:price
```

探针默认读取 `https://www.77uclub.com/price/index.html`，逐层遍历价格分类、单图详情和多图标签。它只读取官网，将报告、截图、更新图片和原本地菜单快照写入 `_本地工作记录/price-sync/<时间>/`，**不覆盖站点内容**。JSON 报告保留页面层级、完整版本 URL、图片尺寸、SHA-256、HTTP 状态和本地差异；`complete: false` 代表遍历或资源不完整，不能用于更新。

```powershell
npm run probe:price -- --output _本地工作记录/price-sync/my-snapshot
npm run sync:price -- --report _本地工作记录/price-sync/my-snapshot/report.json
npm run test:price -- --report _本地工作记录/price-sync/my-snapshot/report.json
```

`sync:price` 是显式的站点写入步骤：先验证完整报告、全部待用资源的哈希和尺寸，再复制新增或变更图片，更新海报数据、三个菜单入口、无 JavaScript 链接及缓存版本。保留旧项目 ID、多图前缀顺序、未变更的品牌展示图片和原文件。它不会访问或修改后台业务数据。

老板权益的20条文字存于 `content/owner-rights.json`，人工对照官方原图维护。其 `sourceSha256` 必须匹配报告中的权益海报；官方原图变更时，先核对并更新文字及来源哈希，再运行同步。同步器遇到未知首页服务、现有服务缺失或海报减少时会停止，需要先核实新的官网结构；不自动删除本地内容。

`test:price` 默认使用本机 `http://127.0.0.1:8000`，验证390、768、1440像素下全部34项服务和50张海报，以及旧链接、键盘标签操作、返回位置、失败重试、禁用 JavaScript 和不完整采集的保护行为。报告与截图保存到本地工作记录。

可选参数：

- `--chrome <Chrome完整路径>` 或环境变量 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`：指定浏览器。
- 探针：`--source <价格页URL>`、`--output <目录>`、`--no-screenshots`。
- 验证：`--origin <本地站点URL>`、`--report <完整报告路径>`、`--output <目录>`。

2026-11-11首次同步报告：`_本地工作记录/price-sync/2026-11-11-before/report.json`。本轮共40张未变、2张变更、8张新增；14个去重资源写入站点，包括10张海报和4张新图标。本地开发依赖及工作记录不属于站点发布资源。

## 网站服务图标

2026-11-12采用用户选定的B版“游戏道具插画”图标。7张透明原图及完整生成提示词保存在 `_本地工作记录/icon-assets/2026-11-12-game-items/`；网页使用的192像素透明WebP位于 `images/service-icons/`，资源映射见 `content/service-icons.json`。

```powershell
npm run build:icons
npm run test:icons
```

构建只规范透明留白并编码为网页尺寸，保留图像颜色和alpha；分别替换首页、完整玩法菜单中的7个入口，以及旧首页现有的4个对应入口。两个现有头像、文字和链接保持原样。图标带内容哈希，CSS版本同时更新。价格同步脚本保留这些入口的现有图标标记。

验证覆盖390、768、1440像素下的明暗主题、108次图标加载检查、原有文字/链接/头像对照，以及7个入口的键盘跳转。默认报告位于 `_本地工作记录/icon-assets/2026-11-12-game-items/validation/`。

## 侧边栏图标

用户选定的“新版 A · 精细双色”以原生SVG接入，源文件在 `images/sidebar-icons/`，资源清单为 `content/sidebar-icons.json`。采用深灰轮廓和蓝、青、金局部填色；深色主题使用更明亮的轮廓和强调色。导航尺寸统一22像素，保留原有文字、链接、选中状态、菜单布局和手机菜单行为。

```powershell
npm run build:sidebar-icons
npm run test:sidebar-icons
```

构建器更新所有具有对应导航入口的17个页面，并自动处理价格详情页的相对路径和CSS版本。SVG直接内嵌，不依赖额外图片请求或运行时替换脚本。页面特有的“入驻与考核”“发布帖子”等入口保留原样。验证包括全部页面的静态覆盖与非图标内容保护、390/768/1440像素的明暗主题、键盘操作、手机菜单、点击SVG跳转和无JavaScript降级；报告位于 `_本地工作记录/sidebar-icons/2026-11-12-mature-a/validation/`。

## 标题字体

标题使用的 Glacier Display 是 Noto Sans SC Black（900 字重）的本地子集。子集外的字会回退到系统字体，在同一个标题里显得更细，所以**改过任何页面文案后都要运行检查**：

```powershell
npm run test:font
```

检查不依赖 `npm ci`。它读取全部页面、`js/` 和 `content/` 中出现的字符，对照 `fonts/glacier-display.css` 的 `unicode-range`；同时核对字体文件哈希、`content/glacier-font.json` 清单和各页面的 CSS 版本。出现缺字时按文件列出，退出码为 1。

重建需要 Python 的 fonttools 与 brotli，以及源字体 `NotoSansSC-Black.otf`（[notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) 的 `Sans/SubsetOTF/SC/`，约 8.9 MB，不随仓库保存）：

```powershell
pip install fonttools brotli
npm run build:font -- --source <NotoSansSC-Black.otf 的路径>
```

`fonttools` 不在 PATH 时用 `--fonttools <路径>` 指定。构建输出四个 WOFF2：`glacier-display-900.woff2` 包含全站文案用字，每个页面都会加载；`glacier-display-900-ext1~3.woff2` 是 GB 2312 一级汉字中其余的常用字，浏览器只在标题里实际出现这些字（如陪玩昵称、帖子标题、公告）时才下载对应文件。构建同时重写 `fonts/glacier-display.css`、更新全部页面的 CSS 版本并生成清单。源字体本身没有的符号记录在清单的 `unsupported` 中，继续使用系统字体。字体许可见 `fonts/glacier-display-OFL.txt`。
