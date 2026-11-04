# 操作與 agent 交接
## 啟動
在本機技能目錄執行 `npm start`（等同 `node scripts/studio-server.mjs`），瀏覽 http://127.0.0.1:4318/ui/ 。伺服器只綁定 127.0.0.1，不要改為公開網路服務。
首次使用先安裝依賴 `npm ci --ignore-scripts`。表單與風格圖庫無第三方前端依賴；檢查與 PPTX 工具才需要 npm 依賴。
需已有可執行的 Codex CLI 與有效登入。`CODEX_BIN` 可指定 .exe 或原生可執行檔；不透過 shell 執行，不使用 .cmd 作為自訂指令。Windows 可從 Get-Command codex 查找 .exe。

## 送出
通用模式產生 bear-request.json 與 bear-prompt.md，不會假裝已交給 agent。可貼到任一工具或請工具讀檔；不能直接啟動目前桌面聊天。
勾選本機 Codex 模式後，POST 工作，由 codex exec 讀 stdin，使用 workspace-write 沙箱及現有模型設定。使用者已明確授權本機橋接使用 --approve-for-me。該旗標已包含 workspace-write 沙箱設定，不能再與 --sandbox 併用：必要的權限請求交由 Codex 自動審核；仍保留 workspace-write 沙箱，不使用繞過核准或沙箱的旗標。若審核拒絕、登入失敗或環境問題無法修復，如實回報，不繞過。
每次工作建立獨立 output/<UUID>/；使用 BEAR_OUTPUT_DIR 可設定本機輸出位置，BEAR_PORT 可換連接埠。UI 顯示狀態與下載檔案；工作超過 30 分鐘會停止程序並保留檔案。
成功需程序正常結束、無 turn.failed，且存在 presentation.html 或 presentation.pptx；視覺驗收結果仍以 agent-result.md 為準，不能把產檔當成驗收全通過。
最多同時一項工作，重複送出回 409。關閉伺服器前先等工作完成；狀態只存記憶體，重啟後由本機 output 找回檔案，不刪舊檔。

## 本機邊界
要求同來源、嚴格 Host、隨機 session token、JSON body、大小與欄位驗證；無任意指令或任意輸出路徑的 HTTP 參數。僅可下載指定工作目錄的第一層普通檔案，不提供事件及 stderr 下載。
靜態 GitHub Pages 版本只有通用匯出，不會連到使用者的 localhost 或存取本機檔案。素材只接受文字檔或貼上文字與網址，不會把檔名誤當成已上傳完整 PDF／PPTX。大型附件請在 agent 對話直接提供。

## 本機實測紀錄（2026-11-04）
v2.0.0 的嚴格模式受 Windows 沙箱初始化失敗阻擋，原始失敗紀錄保留於 VALIDATION.md。
使用者明確授權後，v2.0.1 改用 --approve-for-me，實際已完成一頁 HTML 自動產檔、Edge 畫面與互動驗證，並確認 HTTP 下載內容與本機成品一致。這是受審核的權限申請，沒有使用繞過限制旗標。
每個新工作的成功與驗收範圍仍以該工作 agent-result.md、驗收紀錄及實際成品為準；不可把單一案例通過當成任意簡報皆已驗證。

PPTX 的 completed 另需通過 pptx-integrity.cjs：不合法 ZIP、負圖形尺寸或遺失內部關係會回報 failed；仍需查看驗收文件的實際渲染範圍。
