# 整合來源與安裝
本技能整合四個上游的工作方法，原始 repo 保存在專案 vendor，未修改上游。獨立上游 skill 已安裝到 Codex；其實際位置記錄於 upstream-lock.json。PptxGenJS 為程式庫，透過 npm 安裝，不偽裝成 skill。

| 專案 | 固定 commit | 授權 |
|---|---|---|
| impeccable | [9fadc41729c3](https://github.com/pbakaus/impeccable/commit/9fadc41729c38fd47d7ae622b501558653f9d2e9) | Apache-2.0 |
| frontend-slides | [9906a34d640d](https://github.com/zarazhangrui/frontend-slides/commit/9906a34d640d2111f724544cbc50f7f130569ae1) | MIT |
| revealjs-skill | [d0ccd344c4aa](https://github.com/ryanbbrown/revealjs-skill/commit/d0ccd344c4aaf9f045e5a15be6a2ab67b595796f) | MIT |
| PptxGenJS | [3c9ec1b687c1](https://github.com/gitbrent/PptxGenJS/commit/3c9ec1b687c174952166f6a34b5e87ebf69fa469) | MIT |

## 如何使用
- Impeccable：HTML 視覺審查，讀 installed_skill/SKILL.md 與相應 reference。Windows launcher 位於 scripts/impeccable.cmd。
- Frontend Slides：HTML 主流程，讀 installed_skill/SKILL.md 與需要的 CSS／模板。
- revealjs：講者筆記與進階播放，讀 installed_skill/SKILL.md。原始 check-overflow.js 依賴 Puppeteer，與上游 package.json 不一致；本整合使用自有 Playwright 檢查工具，避免直接執行缺依賴的上游腳本。
- PptxGenJS：本技能 npm dependencies 中的 4.0.1；範例見 source 路徑，正式製作以安裝版 API 為準。

## 衝突處理
Frontend Slides 避用系統字體，Reveal.js 建議 web-safe 字體；本整合以繁中可讀性與實際可用字體優先。Frontend Slides 固定像素畫布與 Reveal.js 的單位規則分別沿用，不混合。
上游的每階段提問、部署與網站行銷規則不自動啟用；遵循使用者指定受眾、時間、輸出格式和已給的授權。

## 授權與可攜性
原始授權保存在 licenses/；Impeccable 的第三方 NOTICE 一併保留。新撰寫的品牌與流程指令不代表上游作者背書。
複製到 Claude Code 或 Antigravity 時，將完整技能資料夾置於該工具的技能目錄，執行 npm ci --ignore-scripts，並依 lock 安裝相同 commit 的上游 skill、更新 installed_skill 路徑。Codex 的 $ 呼叫方式不保證適用其他工具；其他工具可直接讀 SKILL.md。沒有安裝或實測的平台不得宣稱已驗證。

## 本機環境
Google Drive 虛擬磁碟對 npm 解壓發生 EBADF；依賴安裝在本機 Codex 技能目錄，工作區保留可維護的源碼。未將失敗的 node_modules 納入套件。

## 可攜套件
已安裝版與 ZIP 包含 upstream/ 三套 skill 快照；優先使用 lock 的 bundled_skill 相對路徑，找不到時再用 installed_skill。工作區的核心原始碼可使用同機已安裝上游。ZIP 解壓後在本機磁碟執行 npm ci --ignore-scripts；瀏覽器檢查預設需要 Edge，可改用已安裝 Chrome。Impeccable 引擎由上游 launcher 按固定版本下載並核驗。

## GitHub 版本
repo 內已包含三套上游 skill 快照，使用 bundled_skill 相對路徑。source 為固定版本的 GitHub 連結；installed_skill 留空以避免綁定作者的電腦。PptxGenJS 由 npm lock 安裝。
