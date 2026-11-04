# HTML 流程
依 upstream-lock.json 找到 Frontend Slides 或 revealjs skill。Frontend Slides 按需讀 SKILL.md、STYLE_PRESETS.md、viewport-base.css、模板；Reveal.js 模式讀 revealjs/SKILL.md 與檢查腳本。不要照抄 Claude 專屬路徑。
Frontend Slides 適合獨立 HTML；Reveal.js 適合講者模式、筆記、分步展示。Reveal.js 與 Playwright 已列為本技能 npm 依賴；優先使用本機資源，採 CDN 時記錄離線限制。
選定一種畫布系統，維持 16:9、均勻縮放與安全邊界。不要混用兩套模板的單位、縮放和顯示規則。動畫服務內容，支援 reduced-motion，列印版不能遺失尚未顯示的內容。
用實際繁中內容檢查換行。逐頁播放檢查鍵盤、圖片、缺字、層級、最後一頁；檢查 DOM 溢位並查看渲染畫面。DOM 通過不能取代視覺檢查。
PDF 每頁一張，隱藏播放控制並保留背景，匯出後另看 PDF 的裁切、頁數與文字。

## Impeccable
先讀已安裝 Impeccable SKILL.md，依其版本執行 context、載入相應 critique/audit/polish 參考及 craft-floor，再在此次簡報範圍內操作。其網站轉換率與互動 UI 建議不直接適用投影教材。
若引擎失敗，遵循上游 fallback 並說明；可繼續人工檢查，不能宣稱通過自動檢測。不要自動開啟全專案 hooks 或改變無關設定。

## 可重用檢查工具
執行 `node scripts/check-reveal.cjs <deck.html> <output-dir>`，使用 Playwright 與本機 Edge，逐頁截圖並檢查溢位、圖片與頁面錯誤；以 report.json 回報。可用 BEAR_BROWSER_CHANNEL 指定 chrome。截圖仍須逐頁查看，不能宣稱自動涵蓋對比、缺字或物件重疊。
