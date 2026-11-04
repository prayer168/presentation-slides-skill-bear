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
