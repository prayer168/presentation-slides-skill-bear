# v2.0.2 乾淨安裝驗證（2026-11-04）
已將 JSZip 宣告對齊既有鎖檔 3.10.2。在全新本機暫存目錄執行 npm ci --ignore-scripts，成功安裝 22 個套件；以該目錄的依賴重跑七項 Node 測試，全部通過。以下保留自動製作、PowerPoint 修正與歷史驗證紀錄。

# v2.0.1 實際自動製作驗證（2026-11-04）

使用者已明確授權將本機橋接改為 --approve-for-me。該旗標自帶 workspace-write，與 --sandbox 同時傳入會被 CLI 拒絕；已修正此參數衝突，未使用繞過沙箱或核准的旗標。

## 已通過
- 一頁大學／藝術與設計 HTML：表單需求由橋接送入真實 Codex CLI，經自動審核後成功產檔，狀態 completed。
- HTML 使用本機 Edge 155.0.4283.45 與 Playwright：揭示、收合、鍵盤、列印媒體說明可見、390px 16:9 等比縮放；JavaScript 錯誤 0。已查看初始、揭示與手機三張圖。
- HTTP 下載 HTML 與原檔位元組一致，SHA256 575a475f04d6360b943ea39c54889bebc8f20acd5c43b9913bd63f58ff0835c0。
- 兩頁 PPTX：真實 Codex CLI 已產生原生文字、圖形及雙向內部連結。
- PPTX 首次渲染失敗；獨立診斷找到向上箭頭的負 cy。由維護端修正原稿為非負外框加 flipV，再重建；不是首次 agent 輸出即完整通過。
- 修正後 PPTX：2 頁、44 個原生物件、內部關係目標存在、無負尺寸。PowerPoint 成功開檔並匯出兩張 PNG，已逐頁視覺查看。HTTP 下載與修正後原檔一致（83,431 bytes）。
- 新增 scripts/pptx-integrity.cjs 與橋接完成關卡，檢查 ZIP 必要部分、投影片、負尺寸及內部關係；未通過不得標成 completed。這仍不取代 PowerPoint 視覺驗收。
- 七項 Node 測試通過，含負尺寸與遺失內部連結回歸案例；技能結構有效。表單 UI、篩選、預覽、匯出及手機布局測試通過。

## 限制
PPTX 超連結已做結構驗證，尚未進行實際放映點擊測試。HTML 確認列印媒體樣式，但未實體列印／匯出 PDF。Claude Code／Antigravity 自動整合及任意主題內容品質沒有全面評測。
原始工作檔保存在本機 verification/studio-jobs，未把完整會話或工具日誌上傳 GitHub；不刪除失敗測試檔。

---
以下保留 v2.0.0 的歷史驗證紀錄，該版的本機產檔限制已由上述 v2.0.1 測試更新。

# v2.0.0 驗證紀錄（2026-11-04）

## 已通過
- 原始碼與已安裝版的 quick_validate.py 結構驗證。
- 五項 Node 測試：30 套風格與90張 SVG、需求保真、錯誤輸入、跨學段／領域資料，以及橋接授權／來源／路徑與啟動失敗處理。
- Edge 瀏覽器實測：格式必填、目的／受眾、30張風格卡片、分類篩選、三頁預覽、篩選後保留選擇、18頁 PPTX 需求匯出、HTML 字串安全顯示、390px 手機版無水平溢位。
- 90 張風格 SVG 皆載入成功，已查看圖庫總覽與代表頁；圖庫提供原創設計示意，非上游官方模板。
- 國小語文、國中歷史、高中數學、大學藝術四組程式化工具案例，各產生 HTML 與兩頁 PPTX。HTML 揭示／隱藏通過；PPTX 原生物件與雙向跳頁關係通過 ZIP 檢查。
- 四份 PPTX 由 PowerPoint 匯出八張 PNG，已逐頁查看文字、邊界與版面。上述為引擎案例，不等於完整課程或 agent 教學品質評測。

## 實際 Codex 交接測試
一頁「大學／藝術與設計」需求已由本機橋接交給 Codex，模型有回覆，但 Windows 沙箱初始化失敗，命令、Node 與寫檔工具無法啟動，未產出 presentation.html。橋接正確回報 failed，保留需求與結果，沒有誤報成功。
本版保留 workspace-write 與 approval_policy=never。擬改用 --approve-for-me 的動作被自動核准審查拒絕，未套用、未繞過；需使用者另行明確同意這項持續性核准控制變更。通用 JSON／Markdown 匯出不受此問題影響。
未完成：此機本機 Codex 自動產檔成功驗證；Claude Code／Antigravity 自動整合實測；任意領域教材的全面內容品質評測。

## 重跑
npm test
node scripts/test-studio.cjs http://127.0.0.1:4318 verification-output/ui
node tests/fixtures/render-formats.cjs verification-output/formats
