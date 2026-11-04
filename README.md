# presentation-slides-skill-bear

黑熊老師的繁體中文簡報製作 skill，支援教學、研習與分享簡報。

整合 Impeccable 的視覺審查、Frontend Slides 的 HTML 製作、Reveal.js 的播放功能，以及 PptxGenJS 的可編輯 PPTX 輸出。預設品牌風格可依使用者素材調整。

## Codex 安裝
將此 repo 複製到 Codex 的 skills 目錄，例如 `~/.codex/skills/presentation-slides-skill-bear`，然後在該目錄執行：

```sh
npm ci --ignore-scripts
```

Windows 建議安裝在本機磁碟；Google Drive 虛擬磁碟可能無法正常解壓 npm 套件。重新開啟對話後使用：

```text
使用 $presentation-slides-skill-bear，製作給國小五年級的水循環簡報，共 12 頁，輸出可編輯 PPTX。
```

Claude Code 或 Antigravity 可依其技能載入方式讀取 SKILL.md；這兩個平台尚未實測。

## 工具驗證

```sh
node scripts/smoke-pptx.cjs verification-output/bear-smoke.pptx
node scripts/check-reveal.cjs path/to/deck.html verification-output/html
```

HTML 檢查預設使用已安裝的 Edge。可透過 `BEAR_BROWSER_CHANNEL=chrome` 指定 Chrome。檢查結果仍須逐頁查看截圖。

## 來源與授權

上游快照放在 upstream/，版本固定於 upstream-lock.json，原始授權保存在 licenses/ 及上游目錄。第三方內容依各自授權使用；本專案未替新撰寫內容另行指定開源授權。

詳細流程見 SKILL.md，驗證範圍見 VALIDATION.md。安裝不會自動發布簡報或設定全專案 hooks。

本次初始整合與驗證由 Codex 協助完成。
