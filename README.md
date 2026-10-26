# 托业全真练习 · TOEIC 女踢腿四套题

基于“女踢腿”封面《新托业全真题库》的四套听力与阅读自测工具，提供**电脑离线版**与在线版。书中试题是出版模拟试题，不标称 ETS 官方历年真题。共 800 题，没有原创扩充题、口语模块或生成式评分。

## 电脑离线版：推荐使用

**无需购买域名或服务器，无需 VPN、登录、Node.js 或 Python。完整下载后，练习不再需要联网。**

1. [下载最新电脑离线包 toeic-offline.zip](https://github.com/GrittingLeo/toeic-four-tests/releases/latest/download/toeic-offline.zip)，或打开 [Releases 发布页](https://github.com/GrittingLeo/toeic-four-tests/releases/latest)，下载附件中的 `toeic-offline.zip`。不要下载页面自动生成的 `Source code`，那是开发源码。
2. 将 ZIP **完整解压**到电脑上的固定文件夹，不能在压缩包预览中打开。
3. 双击 `toeic-offline/开始练习.html`，用桌面版 Edge 或 Chrome 打开即可。
4. 点击录音播放器或“重听本题”播放音频。图片、录音、题库全部随包提供；请勿只移动 HTML，也不要删除 `images`、`media` 或 JS 文件。

离线版保留全部练习功能，资源解压后约 247 MB。GitHub 下载在部分国内网络下仍可能不畅；可以由能下载的人取得完整包后，通过适用授权范围内的文件传输渠道交付。**“离线运行”不等于保证 GitHub 下载在所有网络下畅通。**

### 学习记录与版本更新

- 记录只保存在当前浏览器，不写入离线包，也不上传服务器。
- 本地文件的浏览器存储行为存在差异；请使用正常窗口，并固定浏览器和文件夹位置。
- **移动或重命名文件夹、换电脑/浏览器、更新离线包、清理浏览器数据前，先点击首页“备份学习记录”。**
- 在新位置打开练习后，点击“恢复学习记录”，选择之前的 JSON 备份并确认即可。
- 在线版与离线版不自动共享记录，可通过上述备份/恢复迁移。若浏览器禁止保存，关闭页面前必须导出备份。

### 在线入口

[打开在线版](https://toeic-four-tests-private.olixu99.chatgpt.site/)（国内部分网络可能无法直连，电脑用户优先使用离线包）。本次增加离线发行包，不改变现有在线站点。

## 使用

- 整套、听力或阅读专项；自由练习与模拟考试。
- 自由练习按完整题组揭晓解析；模拟考试听力使用连续原录音，阅读限时 75 分钟。
- Part 1 作答只显示 A/B/C/D，Part 2 只显示 A/B/C，英文选项仅在提交后复盘时显示；Part 3/4 保留书面题干与选项。
- 自由练习与复盘使用 216 段独立短音频：Part 1、2 每题一段，Part 3、4 每组三题共用一段；模拟考试保留整套连续录音。
- 长阅读支持文字、原书排版、全屏及放大；Part 1 图片和听力图表保留原图。
- 原书中文解析与解析页对照；错题入口简化为“听力错题”“阅读错题”，反复出错优先，连续两次答对后标记巩固；细分考点保留在解析内。
- 原书词汇和短语：遮盖词性与释义、自测、掌握标记；全部 1041 个条目补充中文词性标签（名词 n.、动词 v.、形容词 adj. 等），区分短语类型，多词性并列标出。词性按当前收录释义标注，不穷举所有词典用法；词频仅计算四套可提取试题文本，不是官方词频。
- 答案、练习记录、错题与词汇掌握度仅存本地浏览器，支持 JSON 备份与恢复。没有登录、跨设备同步、广告或分析追踪。清理站点数据前请备份，建议一次只开一个作答窗口。
- 仅报告正确数和正确率，不提供未经校准的 990 分换算。

## 开发与构建（普通使用者不需要）

需要 Node.js 20 或更新版本，网站运行不依赖框架。

```sh
npm start
# 打开 http://127.0.0.1:4173
npm test
npm run validate
npm run build
npm run build:offline
```

在线部署目录为 `dist/client`，离线输出为 `dist/offline/toeic-offline`。所有路径相对引用。`web/index.html` 是在线源码入口，不能直接双击；**离线构建生成的 `开始练习.html` 才支持双击运行**。

离线构建将题库 JSON 转换为本地普通脚本，并将前端模块合并为一个普通脚本，不使用 `file://` 下受限制的 JSON 请求或模块加载；保留本地图片和音频文件。离线页面以内容安全策略禁用网络数据请求。不引入第三方构建依赖，不包含用户记录、原 PDF 或账号凭据。

Windows 发布包构建：

```powershell
npm test
npm run validate
powershell -NoProfile -File tools/package-offline.ps1
```

输出：`dist/toeic-offline.zip` 与 `dist/toeic-offline.zip.sha256`。发布 ZIP 作为 GitHub Release 附件，不把重复的大文件压缩包提交进 Git 历史。

## 目录

- `web/`：前端源码、题库 JSON、题页图片和网页用音频。
- `web/data-loader.js`：共享数据加载逻辑；在线读取 JSON，离线使用预打包数据。
- `tools/build-offline.mjs`、`tools/package-offline.ps1`：生成可双击的电脑离线版及 ZIP 发行包。
- `tools/extract-book.py`：从持有的 PDF 提取题目、答案、解析、原图和词汇，包含已核对的提取修正。
- `tools/prepare-audio.py`、`tools/build-audio-index.mjs`、`tools/split-audio.py`：原音频转码、题组索引与独立短音频生成；重建索引后需重新运行切分脚本。
- `tools/listening_options.py`：从已提取的原书听力文本补齐 Part 1、2 英文选项；PDF 提取脚本复用同一解析规则。
- `tools/vocabulary-pos.json`、`tools/vocabulary_pos.py`：按词条保存的词性标注与构建脚本，PDF 重提取时自动复用；新增词条缺少标注时会报错，不按词尾猜测。
- `tests/`：练习引擎测试；`tools/validate-banks.mjs`：全题库一致性与资源检查。

原 PDF 和原始高码率录音不包含在仓库中。网站音频为同一原录音的 64 kbps 单声道副本，不是 TTS。题组定位由语音识别时间戳与题号对齐，少量遗漏标题依据相邻内容修正；并非逐秒人工试听认证。


## ETS 官方免费 Sample

ETS 不公开历年正式考卷。可练习的官方免费材料是 [TOEIC Listening & Reading Sample Test（PDF）](https://www.ets.org/pdfs/toeic/toeic-listening-reading-sample-test.pdf)（Form ST-05）：

- 约 **60 题**（听力/阅读各约 30），不是完整 200 题卷
- PDF 内含 **Sample Form Correct Answers** 与听力 **Script**
- **没有**与本 Sample Form 一一对应、可直接切段进本站播放器的官方整卷音频（香港 [Download Zone](https://www.toeic.com.hk/index/showarticle/itpdownload/en) 上的 Practice Test 音轨是另一套练习材料）
- 因此本仓库 **不把 Sample 题干内嵌进题库 JSON / Pages**，首页提供官方 PDF 外链，避免再分发受版权保护的样题正文

若要增加站内可播的完整套数，请使用你合法持有的正版模拟书/官方练习，再走提取脚本。

## 内容与授权边界

书本题目、答案、中文解析、词汇释义、截图及录音属于第三方资料，不能由网站代码的开放推导出第三方内容的再授权。本项目所有者在发布准备时确认持有公开分发授权；授权方和可展示的具体授权说明由所有者补充维护。此说明不代表对授权文件的独立审核，也不授予访问者额外的复制、商业使用或再分发权限。

TOEIC 是 ETS 的商标。本项目不是 ETS 官方产品，与 ETS 无关联，未经 ETS 认可。使用时请核对原书，发现提取错误可提交 issue，注明套数及题号。

## 自测限制

纯前端会把正确答案发送到浏览器，适合个人练习，不适合防作弊或正式测评。文本提取可能损失复杂表格、聊天布局或细小标点；遇到不确定内容请切换原书排版。空白题计入总题数，但不会直接加入错题本。
