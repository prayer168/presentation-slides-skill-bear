# PPTX 流程
使用本技能 npm 安裝的 PptxGenJS；API 範例見鎖定版本 vendor/PptxGenJS。不要假設任意 HTML 能無損轉成原生 PPT 物件。
- 使用原生文字、形狀、線條、表格與圖表；不把整頁截圖貼入 PPTX 後宣稱可編輯。
- 設寬螢幕、繁中字體、語言、母片與安全邊界，使用 addNotes 保存講者筆記和必要來源。
- 圖像維持比例，圖表資料、單位與期間清楚。互動若不能重現，改成清楚的步驟或分頁並說明。
- JS 與資料一同交付；從本技能安裝位置解析依賴，不假設輸出目錄有 node_modules。
先執行 smoke-pptx 驗證引擎。正式檔使用可用的 PowerPoint、LibreOffice 或簡報渲染工具產生逐頁圖像或 PDF，再檢查換行、替代字體、溢位、圖表與對齊。另檢查 ZIP 中頁數與原生文字物件。
沒有渲染工具時可交付原稿及結構檢查結果，但要明列視覺驗收未完成；不要用 HTML 預覽替代 PPTX 預覽。

## PowerPoint 開檔完整性
圖形的 w/h 與 OOXML a:ext 的 cx/cy 不可為負。向上或向左的連線需換成非負外框，再以 flipV/flipH 或端點方向表達，不能直接傳負高度。產檔後執行 `node scripts/pptx-integrity.cjs <deck.pptx>`；若失敗，修正原稿後重建，再以 PowerPoint 實際開啟與渲染。橋接對 PPTX 會自動執行此檢查，未通過不能標成 completed。結構通過仍不代表版面已通過。
