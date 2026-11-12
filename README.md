# 柒柒游陪玩网站

HTML、CSS、JavaScript 与 PHP 组成的网站，包含玩法价格、活动、陪玩社区、交流社区、加入与考核、客服及管理页面。浏览器端无需构建，Node.js 仅用于资源维护和 Playwright 验证。

## 本地运行

本地已使用 PHP 8.4.26 验证。需要启用 `fileinfo`、`gd`、`mbstring` 等接口使用的扩展。

```powershell
php -S 127.0.0.1:8000 -t .
```

打开 `http://127.0.0.1:8000/`。PHP 内置服务用于本地开发；正式服务器需按实际目录配置站点、HTTPS 和私有目录访问规则。根目录 `.user.ini` 中的 `open_basedir` 是现有宝塔部署路径，迁移时应按服务器目录调整。

## 开发验证

使用 Node.js 20+ 和本机 Chrome：

```powershell
npm ci
npm run test:price
npm run test:icons
npm run test:sidebar-icons
```

先启动本地 PHP 服务。验证默认访问 `http://127.0.0.1:8000`；可通过 `--origin` 指定地址。仓库包含无账号数据的测试基线，报告与截图写入已忽略的 `_本地工作记录/`。

价格探针、资源维护及验证参数见 [scripts/README.md](scripts/README.md)。彩色服务图标映射位于 `content/service-icons.json`；侧边栏“新版 A · 精细双色”源 SVG 位于 `images/sidebar-icons/`。

```powershell
npm run probe:price
npm run build:sidebar-icons
```

服务图标的 WebP 已包含在仓库中；`build:icons` 使用本机保存的原始生成 PNG，首次克隆后若需重新编码，须用 `--sources` 提供自己的源文件清单。设计预览和原始生成记录默认保留在本地工作记录目录。

## 运行数据与管理员

`api/_join-private/` 保存账号、密码哈希、业务状态、用户上传图片与媒体等运行数据，**不提交至 Git**。仓库仅保留该目录的访问拒绝文件；站点数据需要在服务器上独立维护和备份。依赖目录、环境文件、日志和本地工作记录同样不提交。

首次部署可在服务器终端执行：

```powershell
php api/join-init.php your_admin_name
```

根据终端提示输入管理员密码；命令行不会内置或提交初始账号密码。部署时必须禁止直接访问 `/api/_join-private/`；已有 Nginx 配置文件中包含相关规则。不要用仓库内容覆盖服务器现有运行数据。
