# 操作與 agent 交接
## 啟動
在本機技能目錄執行 `npm start`（等同 `node scripts/studio-server.mjs`），瀏覽 http://127.0.0.1:4318/ui/ 。伺服器只綁定 127.0.0.1，不要改為公開網路服務。
首次使用先安裝依賴 `npm ci --ignore-scripts`。表單與風格圖庫無第三方前端依賴；檢查與 PPTX 工具才需要 npm 依賴。
需已有可執行的 Codex CLI 與有效登入。`CODEX_BIN` 可指定 .exe 或原生可執行檔；不透過 shell 執行，不使用 .cmd 作為自訂指令。Windows 可從 Get-Command codex 查找 .exe。

## 送出
通用模式產生 bear-request.json 與 bear-prompt.md，不會假裝已交給 agent。可貼到任一工具或請工具讀檔；不能直接啟動目前桌面聊天。
勾選本機 Codex 模式後，POST 工作，由 codex exec 讀 stdin，使用 workspace-write 沙箱及現有模型設定。程序沒有繞過沙箱／核准的旗標，不能執行需互動核准的動作；遇到權限、登入或沙箱錯誤時，回報失敗，不自動提升權限。
每次工作建立獨立 output/<UUID>/；使用 BEAR_OUTPUT_DIR 可設定本機輸出位置，BEAR_PORT 可換連接埠。UI 顯示狀態與下載檔案；工作超過 30 分鐘會停止程序並保留檔案。
成功需程序正常結束、無 turn.failed，且存在 presentation.html 或 presentation.pptx；視覺驗收結果仍以 agent-result.md 為準，不能把產檔當成驗收全通過。
最多同時一項工作，重複送出回 409。關閉伺服器前先等工作完成；狀態只存記憶體，重啟後由本機 output 找回檔案，不刪舊檔。

## 本機邊界
要求同來源、嚴格 Host、隨機 session token、JSON body、大小與欄位驗證；無任意指令或任意輸出路徑的 HTTP 參數。僅可下載指定工作目錄的第一層普通檔案，不提供事件及 stderr 下載。
靜態 GitHub Pages 版本只有通用匯出，不會連到使用者的 localhost 或存取本機檔案。素材只接受文字檔或貼上文字與網址，不會把檔名誤當成已上傳完整 PDF／PPTX。大型附件請在 agent 對話直接提供。

## 本機實測限制（2026-11-04）
此機已驗證需求送達 CLI、模型回覆、失敗狀態及既有檔案保留。實際產檔受 Windows 沙箱初始化失敗阻擋；不可宣稱本機自動產檔已成功。維持 approval_policy=never，沒有啟用自動審核或繞過限制。可先使用通用匯出，在使用者已核准的 agent 對話中製作；不要把橋接程式的失敗偽裝成成功。
