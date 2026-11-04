# 可重複自動驗收

## 指令
在已安裝依賴的技能目錄執行：

```text
npm run acceptance
npm run acceptance:live
npm run acceptance:verify -- --run "既有驗收資料夾完整路徑"
npm run acceptance:negative -- --run "既有驗收資料夾完整路徑"
```

- acceptance：Playwright 操作真實表單、保存與解析附件，由固定 subprocess 驅動產生六頁 HTML 與 PPTX，不呼叫模型。此模式驗證管線與驗收器，不代表 AI 品質。
- acceptance:live：相同表單與附件，透過現有 Codex 登入與設定各製作一次 HTML／PPTX，會消耗模型用量；不自動重試；等待逾時會要求停止本次 Codex 程序並保留現有檔案。沿用已授權 --approve-for-me，不另加 sandbox 或繞過旗標。
- acceptance:negative：建立缺頁及透明 HTML 副本，確認驗收器會拒絕，不修改原簡報也不呼叫模型。
- acceptance:verify：只重新驗收已保存的兩份成品，在原 run 的 rechecks/ 建新報告及畫面；不重叫模型、不覆蓋原結果。

完整執行可加 `--output "資料夾"`、`--channel msedge`（Windows 預設）或 `--channel chromium`、`--timeout-minutes 30`。每個 run 建唯一資料夾，全部保留；禁止自動清理。預設位置 verification-output/acceptance/，不進 Git。

## 前置條件
Node 24、npm ci --ignore-scripts、可用的 Edge 或 Playwright Chromium。Windows 需要已安裝 Microsoft PowerPoint，透過 COM 開啟本次產物並逐頁輸出 PNG；其他平台未配置渲染器時明確失敗，不能改用 HTML 預覽冒充 PPTX 渲染。PowerPoint 不修改原檔，不關閉使用者既有簡報。真實模式另需 Codex CLI 原生執行檔與有效登入；以 CODEX_BIN 指定 .exe，避免 .cmd。兩模式使用新連接埠與獨立工作目錄，不重啟或占用正在使用的 4318 工作室。

## 固定案例
六頁教師研習簡報：Markdown 核心句、CSV 示範人數 A組12／B組18、PDF 指定文字、PNG 流程圖。檢查核心句、資料及示例標示是否進入內容，原始圖是否採用，附件及下載是否逐位元一致。此為可控測試資料，不是真實成效數據。
HTML 的 data-qa-* 標記只供本案例導覽與測驗，不對所有技能產物強制規定。實際使用其他主題時需另定內容與互動斷言。

## 驗證與報告
report.json/report.md 記錄每階段通過、失敗、錯誤、版本、模式、工作位置及用量（若 CLI 回傳）。html/、pptx/ 保存下載成品、附件 ZIP、工作及檢查 JSON、表單畫面與逐頁 render/ 與 contact-sheet.png 總覽圖；jobs/ 保留模型原稿、原始附件與詳細事件紀錄。請勿將私人素材或事件紀錄提交 Git。
HTML 檢查六頁、前後翻頁、方向鍵、答題前後回饋、桌面／手機、圖片載入、原圖 bytes、外部資源與列印可見性；截圖前等待投影片實際不透明且位於視窗內；印出 PDF。PPTX 檢查六頁、原生物件、指定文字、原圖 bytes、內部連結結構與 PowerPoint 逐頁渲染；框線越界另列提醒。
任何必要檢查失敗，命令回傳非零。成功標示 automated-checks-passed，不宣稱內容／美感完全合格。未實際點擊 PowerPoint 播放模式的超連結；未進行獨立模型事實審查或字形辨識。截圖可供後續 AI 或人工檢視。

## 環境與故障
此流程使用 Playwright，不依賴先前啟動失敗的 computer use runtime。模型工作失敗、PowerPoint 未安裝、登入問題或解析錯誤都保留產物並揭露；不要以固定驅動結果替代真實模式成功。
CODEX_PREFIX_ARGS 為本機環境的 JSON 字串陣列，僅供固定驅動／測試執行檔前置參數；HTTP 不接受此設定。真實驗收會清除此環境變數，避免誤跑假模型。
