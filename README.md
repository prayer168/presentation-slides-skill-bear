# 黑熊老師跨領域簡報工作室 · v2.0.0

從國小、國中、高中到大學與專業場合，適用語文、數學、社會、藝術、科學、工程、商業等領域。先選格式、目的與風格，再製作視覺化簡報。

## 開啟工作室

1. 將 repo 放到本機 Codex 技能目錄，例如 `~/.codex/skills/presentation-slides-skill-bear`。
2. 在該目錄執行：

```sh
npm ci --ignore-scripts
npm start
```

3. 開啟 **http://127.0.0.1:4318/ui/**。

Windows 建議用本機磁碟安裝 npm 依賴；Google Drive 虛擬磁碟可能解壓失敗。

## 點選流程

1. `.html` 網頁簡報或 `.pptx` 可編輯 PowerPoint。
2. 簡報目的、受眾／學段、領域、主題與目標。
3. 從 **30 種風格、90 張原創樣板圖**選擇，或選「讓 AI 建議」。可分類、搜尋及查看封面／內容／圖解。
4. 頁數、時間、密度、互動、補充說明與文字素材。
5. 檢查摘要並送出。

## 兩種送出方式

- **通用模式**：下載 bear-request.json 與 bear-prompt.md，交給 Codex、Claude Code 或 Antigravity。公開靜態網頁使用此模式。
- **本機 Codex**：在確認頁勾選「送出後啟動本機 Codex 製作」。需已安裝並登入 Codex CLI。使用現有模型設定，可能消耗帳戶用量；另啟動 CLI 工作，不是目前桌面聊天。頁面顯示狀態、輸出位置與可下載檔案。

本機伺服器只綁定 127.0.0.1，使用同來源檢查與隨機工作憑證，不收集 API key。以 workspace-write 沙箱執行，不繞過核准或沙箱。若登入、權限或沙箱不可用，回報失敗，通用匯出仍可用。

`CODEX_BIN` 可指定 Codex 的原生可執行檔（Windows 請用 .exe）；`BEAR_OUTPUT_DIR` 可指定輸出資料夾；`BEAR_PORT` 可換連接埠。輸出預設保存在 output/UUID/。不自動刪除工作檔，重啟後可從本機目錄找回。

## 視覺與互動

HTML 支援點選揭示、測驗、分支與模擬。PPTX 優先保留原生文字、形狀和圖表，採超連結、答案頁或外部模擬連結。兩者均依內容選擇流程圖、比較圖、時間軸、概念圖、照片及圖表，不把互動或裝飾當成內容。

風格圖為設計規則示意，不是完整學科模板。研究來源與授權界線見 [風格來源](references/style-sources.md)。上游版本見 upstream-lock.json，授權見 licenses/。新撰寫內容未另指定開源授權；公開 repo 不等於所有內容均無條件授權。

## 驗證

```sh
npm test
node scripts/smoke-pptx.cjs verification-output/bear-smoke.pptx
node scripts/check-reveal.cjs path/to/deck.html verification-output/html
node scripts/test-studio.cjs http://127.0.0.1:4318 verification-output/ui
```

瀏覽器驗證需要本機 Edge（Playwright 檢查工具）。自動檢查後仍要逐頁看實際 HTML／PPTX 渲染；細節見 VALIDATION.md。Claude Code、Antigravity 可讀技能與需求檔，但未驗證其自動執行整合。

## 在對話中使用

```text
使用 $presentation-slides-skill-bear，先開啟需求表單，讓我選擇格式、目的與風格。
```

完整流程見 SKILL.md。本技能由 Codex 協助開發；上游作者未對本整合背書。
