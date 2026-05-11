<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f98f781d-d418-4417-802f-40360091d54f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

瀏覽 http://localhost:3000/admin 進入後台
登入金鑰：admin-secret-2024（可在 server.ts 修改）
每次使用者離開會議室，對話紀錄和評估報告會自動儲存

# 系統架構
### 登入與初始化流程架構 (Login & Initialization)
當玩家打開應用程式並輸入 Email 時，系統的資料流動如下：

1. 身分驗證與建檔：前端發送 API 請求，後端在 PostgreSQL 中進行 UPSERT 邏輯（有則更新最後登入時間，無則建立新玩家）。

2. 歷史資料預載：登入成功後，前端會立刻拉取該玩家的「歷史問卷」與「遊戲/分析紀錄」，這決定了後續 UI 的解鎖狀態（例如是否解鎖劇本二）。

3. 即時連線建立：初始化 Socket.IO 連線。

4. 斷線重連機制 (Reconnection)：前端會檢查 localStorage 是否殘留未結束的 roomId。若有，主動向 Socket 發送 rejoin_room，後端驗證後會下發最新的 room_state 與 player_states 幫助玩家無縫恢復遊戲畫面。

#### 登入流程 Mermaid 循序圖 (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    participant Client as React Frontend (App.tsx)
    participant API as Express API (routes.ts)
    participant DB as PostgreSQL (users, surveys)
    participant Socket as Socket.IO Server (socket.ts)

    %% 登入階段
    Client->>API: POST /api/login { email }
    API->>DB: 查詢/新增使用者 (SELECT / INSERT)
    DB-->>API: 回傳 User Data (id, email)
    API-->>Client: 200 OK (User Data)

    %% 本地快取與個人化判斷
    Note over Client: 將 User 寫入 localStorage<br/>判斷是否為新玩家 (決定是否進入選頭貼或新手教學)

    %% 非同步拉取歷史數據
    par 拉取遊戲數據
        Client->>API: GET /api/surveys/{userId}
        API-->>Client: 回傳問卷紀錄 (判定劇本解鎖進度)
    and
        Client->>API: GET /api/records/{userId}
        API-->>Client: 回傳劇本與 AI 報告紀錄
    end

    %% 即時連線與重連機制
    Client->>Socket: 建立連線 io()
    Note over Client: 檢查 localStorage 是否有 larp_active_room

    alt 發現未結束的遊戲 (斷線重連)
        Client->>Socket: emit('rejoin_room', { email, roomId })
        Socket->>Socket: 驗證房間與玩家是否存在
        Socket-->>Client: emit('player_reconnected')
        Socket-->>Client: emit('timeline_updated') & emit('your_player_state')
        Socket-->>Client: emit('room_state') (恢復遊戲進度)
    else 正常登入
        Note over Client: 進入遊戲大廳 (Phase: lobby)
    end
```

### 房間系統 (Room System)

1. 房間資料結構 (Data Schema)
在後端 socket.ts 中，Room 被定義為一個複雜的物件，負責維護所有即時狀態：

   - 基礎資訊：包含 id、scriptId（劇本 ID）與 status（waiting 或 playing）。

   - 成員管理：

      - users：儲存 RoomUser 陣列，記錄玩家的連線狀態、是否準備、房主權限以及分配的角色。

      - meetingUsers：專為 WebRTC 語音設計的清單，記錄麥克風狀態與是否為 AI 託管。

   - 遊戲進度 (Game State)：

      - phase：當前階段（例如 room_lobby, game_search, game_meeting）。

      - phaseEndTime：階段結束的毫秒時間戳，用於全域倒數計時同步。

#### 房間生命週期與序列圖
房間的運作遵循嚴格的序列：建立/加入 -> 角色分配 -> 準備就緒 -> 階段切換。

```mermaid
sequenceDiagram
    participant P1 as 玩家 A (房主)
    participant P2 as 玩家 B (加入者)
    participant S as Socket.IO Server
    participant R as Room State (Memory)

    Note over P1, S: 建立房間
    P1->>S: emit('create_room', { scriptId })
    S->>R: 初始化 Room 物件並生成 ID
    S-->>P1: emit('room_state', updatedState)

    Note over P2, S: 加入房間
    P2->>S: emit('join_room', { roomId })
    S->>R: 更新 users 陣列
    S-->>S: 廣播更新後的 room_state
    S-->>P1: emit('room_state')
    S-->>P2: emit('room_state')

    Note over P1, P2: 角色選擇與準備
    P1->>S: emit('select_character', '角色名')
    P2->>S: emit('player_ready')
    
    Note over S, R: 邏輯判定
    alt 全員在線且皆為 Ready
        S->>S: 觸發 autoNextPhase()
        S-->>P1: emit('room_state') (Phase 變更)
        S-->>P2: emit('room_state') (Phase 變更)
    end
```
2. Socket.IO Server (即時通訊伺服器)
這就是你的 Node.js 後端程式（具體來說是 socket.ts 這支檔案）。

- 它的角色：就像是一個「總機」或「交通警察」。前端（React）會透過網路連線到這個 Server。它負責接收來自各個玩家的動作（例如：加入房間、開啟麥克風、投票），然後再把更新後的狀態廣播給房間裡的其他玩家。

- 為什麼是後端：因為它是跑在雲端主機或伺服器上，負責統籌和驗證所有來自客戶端（瀏覽器）的請求，確保沒有人可以作弊，並維持遊戲秩序。

3. Room State (Memory) (記憶體中的房間狀態)
這也是存在於後端伺服器的記憶體（RAM）中。

- 它的角色：在 socket.ts 裡面，有一行程式碼類似這樣：const rooms = new Map<string, Room>();。這就是 Room State。它記錄了當前所有正在進行的遊戲房間的即時資訊（誰在哪個房間、現在是哪個階段、輪到誰發言等）。

- 為什麼放記憶體，而不是放資料庫 (PostgreSQL)？：
因為即時遊戲的狀態改變得太快了！如果玩家每開關一次麥克風，或是計時器每一秒的倒數，都要去讀寫硬碟裡的 PostgreSQL 資料庫，伺服器會因為來不及處理而卡頓。
因此，後端會把這些「需要極速讀寫、且暫時性」的狀態放在 RAM (Memory) 裡面，等到一個大階段結束（例如：整局遊戲結束產生對話紀錄時），才會把最終結果寫入 PostgreSQL 永久保存。

簡單總結：前端（React）只負責「顯示畫面」和「發送使用者的操作」。所有的「遊戲規則判定（Socket.IO Server）」和「當前遊戲進度暫存（Room State Memory）」都是在後端緊密運作

## 階段切換機制
1. 全員共識驅動 (Ready-Driven)
這就是我們剛剛討論的標準模式。大家必須都按下「準備好了，下一步」，伺服器才會呼叫 autoNextPhase 推進到下一關。

- 適用階段：room_lobby 、 character_preview 

- 後端邏輯：玩家觸發 player_ready，當 room.readyUsers.size >= playingCount 時切換。

2. 伺服器強制倒數 (Time-Driven)
劇本殺不能讓玩家無限期卡在某個階段，因此一旦進入搜查或閱讀階段，後端會啟動定時炸彈 (phaseTimeout)。時間一到，就算有人還沒按準備，伺服器也會強制把你拉進下一個階段。

- 適用階段：game_profile 、 mission_briefing、game_search (預設 300 秒)、diary_reveal (劇本二專屬的 270 秒閱讀時間)。

- 後端邏輯：在 startPhase 中設定 setTimeout，時間到直接執行 autoNextPhase 或強制跳轉。前端的倒數計時只是視覺效果，真正的生殺大權在伺服器手裡。

3. 房主/劇情控制 (Host-Driven)
有些階段是跟著「戲劇演出 (Act)」走的，或是需要房主來推動進度，而不是看全員準備狀態。

- 適用階段：幕演出

- 演出切換：房主觸發 start_act ➔ 大家看完 ➔ 房主觸發 end_act ➔ 自動跳轉搜查。

- 結局結算：房主按下按鈕觸發 start_ending_phase，強制所有人進入勝負結算畫面。

4. 絕對隔離的個人切換 (Personal Override)
這是系統中最特別的例外！當遊戲徹底結束，進入「真相大白 (truth_revealed)」階段時，系統打破了房間必須同步的規則。

- 適用場景：有人看真相看得很慢，有人看很快想先退房。

- 後端邏輯：當玩家點擊進入真相大白時，前端會發送 start_truth_phase。後端不會廣播 room_state，而是使用一個專屬事件 socket.emit('personal_phase_override', { phase: 'truth_revealed' })。

- 為何這樣設計：這保證了已經在看真相的玩家，不會因為其他玩家離開導致房間狀態變更，而突然被踢出去。

## 「會議微狀態機」 與 「WebRTC 雙軌語音架構」
#### 會議室的「微狀態機」 (The Meeting Micro-State Machine)
當房間進入 phase: 'game_meeting' 後，大階段 (phase) 就不再變動了。系統將控制權交給了 socket.ts 中的 meetingStage。這是一個混合了「強制倒數定時器」與「玩家手動準備 (meeting_ready)」的雙重驅動狀態機。

```mermaid
stateDiagram-v2
    direction LR
    
    state "準備發言\n(pre_round_organizing)" as S1
    state "輪流發言\n(round_robin)" as S2
    state "整理思緒\n(organizing)" as S3
    state "延長表決\n(voting_prompt)" as S4
    state "自由討論\n(free_discussion)" as S5
    state "進入投票\n(game_voting)" as End

    [*] --> S1 : 進入會議室
    S1 --> S2 : 倒數 2 分鐘 或\n全員按下準備
    S2 --> S3 : 所有玩家發言完畢
    
    S3 --> S5 : 第一輪 (直接進討論)
    S3 --> S4 : 第二輪 (倒數或準備)
    
    S4 --> S5 : 有人投「是」
    S4 --> End : 全員投「否」或\n倒數 30 秒結束
    
    S5 --> 第二輪搜查 : (若為第一輪) 5 分鐘結束
    S5 --> End : (若為第二輪) 5 分鐘結束
```
#### 輪流發言 (round_robin) 的核心機制：

- 發言權控制 (currentSpeakerIndex)：伺服器會維護一個當前發言者的索引。前端的 App.tsx 會監聽 meeting_state，如果發現 currentSpeaker?.id !== socket.id，前端會強制切斷該玩家的麥克風實體收音 (track.enabled = false)，防止搶話。

- 靜音防呆 (silenceCheckInterval)：後端每秒會檢查當前發言者。如果前端超過 10 秒沒有發送 user_speaking 事件（代表麥克風沒收到音量），後端會下發 silence_warning，觸發前端 5 秒的紅色倒數警告彈窗。時間一到若仍無聲音，直接跳過該回合 (nextTurn)。

#### 雙軌語音架構：WebRTC (即時聽) + MediaRecorder (AI 分析)

這個應用的語音處理架構非常高級。為了同時滿足「玩家之間通話零延遲」與「AI 需要完整高音質片段來做逐字稿與分析」，前端 App.tsx 將麥克風的媒體流 (localStreamRef.current) 兵分兩路：

##### A 軌道：WebRTC 點對點網狀網路 (Mesh Network)
這條路負責讓玩家互相聽到聲音。

1. 預熱機制 (Pre-warming)：只要進入可能需要語音的階段（例如角色預覽），系統就會提早向瀏覽器索要麥克風權限 (getUserMedia) 並建立 AudioContext，但先將軌道設為 enabled = false。

2. 防閃爍 (Signaling Glare Prevention)：建立 PeerConnection 時，直接使用 pc.addTransceiver('audio', { direction: 'sendrecv' }) 強制打通雙向音訊通道。

3. 無縫開關麥：當玩家點擊開麥克風時，不需要重新發送 Offer/Answer 協商（這會造成卡頓），而是直接使用 sender.replaceTrack(track) 將實體收音軌道塞進已經建好的通道中，實現毫秒級的開關麥。

##### B 軌道：MediaRecorder 錄音與 STT
這條路負責將語音轉換為精準的文字，供後續 LLM 分析。

1. 鎖定回合：當 isMicOn 變為 true 且處於 game_meeting 階段，啟動 MediaRecorder。在啟動瞬間，利用 Closure（閉包）鎖定當下的 round 與 startTimestamp。

2. Timeslice 切片：設定 mediaRecorder.start(1000)，每秒產出一個 chunk。這確保了即使網路閃斷或瀏覽器崩潰，已經錄下的音檔也不會遺失。

3. Opus 編碼上傳：關麥時，將 chunks 打包成 webm/opus 格式的 Blob，並透過 FormData 發送到後端 /api/process-voice-turn。

##### 即時音量與語速回饋
在發言時，下方儀表板會跳動音量條並顯示 CPM (每分鐘字數)，這是怎麼做到的？

1. 音量條 (currentVolume)：前端利用 Web Audio API 的 AnalyserNode。每 200ms 執行一次 Fast Fourier Transform (FFT)，算出當下頻率陣列的平均值。如果平均值大於 10，就透過 Socket 發送 speaking_data 讓其他人看到你在說話。

2. 語速計 (currentCPM)：每 3 秒計算一次 subtitles 陣列最後一句話的字數，並回推成 60 秒的字數比例。

```mermaid
sequenceDiagram
    autonumber
    participant Client as 玩家前端 (React)
    participant Peers as 其他玩家 (WebRTC)
    participant Socket as 狀態伺服器 (Socket.IO)
    participant API as 分析伺服器 (Express API)
    participant AI as AI 引擎 (Groq + NVIDIA)

    Note over Client, Peers: 階段 A：預熱與連線建立
    Client->>Client: 取得麥克風權限 (getUserMedia)
    Client->>Peers: 建立 RTCPeerConnection (雙向通道)
    Note right of Client: 預設音軌設為 false (實體靜音)

    Note over Client, Socket: 階段 B：開麥與即時通訊
    Client->>Client: 玩家點擊開啟麥克風 (音軌設為 true)
    Client->>Peers: [軌道 A] WebRTC 傳輸音訊 (毫秒級延遲)
    Client->>Socket: emit('toggle_mic', true)
    
    par 背景即時運算
        Client->>Client: 啟動 MediaRecorder [軌道 B]
        loop 每 200ms
            Client->>Client: Web Audio API 運算當下音量
            Client->>Socket: emit('speaking_data', { volume })
        end
    end

    Note over Client, AI: 階段 C：關麥與 AI 分析
    Client->>Client: 玩家點擊關閉麥克風
    Client->>Client: 停止錄音並打包為 webm 音檔
    Client->>API: POST /api/process-voice-turn 上傳音檔
    
    API->>AI: 傳送至 Groq Whisper 進行極速語音轉文字
    AI-->>API: 回傳原始逐字稿
    
    API->>AI: 送交 NVIDIA LLM 結合劇本詞表進行校正
    AI-->>API: 回傳校正後逐字稿
    
    API-->>Client: 200 OK 回傳最終文字
    Client->>Socket: emit('final_transcript', line)
    Socket-->>Peers: 廣播最終逐字稿至所有人筆記本
```

如果高精準度的 AI（Groq + NVIDIA）是在玩家「關閉麥克風」後才整包上傳音檔去分析的，那發言當下儀表板上的「即時語速 (CPM)」和「畫面上的即時字幕」到底是哪裡來的？

答案隱藏在前端的 useSubtitles.ts 裡面。這套系統其實實作了「雙層語音辨識 (Two-Tier ASR) 架構」，它不只語音兵分兩路，連「文字」也是兵分兩路的：

##### 第一層：瀏覽器內建的 Web Speech API (打草稿與算語速)
為了達到真正的「零延遲」視覺回饋，前端在玩家開麥克風的當下，除了啟動錄音，還同時呼叫了瀏覽器原生的 SpeechRecognition (Web Speech API)。

- 特性：它是免費的、直接在玩家的設備（或瀏覽器底層）運算，文字幾乎是邊講邊吐出來的。

- 用途：

   1. 產生 liveCaptions（即時字幕）。這就是畫面上會不斷跳動、修正的暫時性文字。

   2. 計算 CPM (每分鐘字數)。前端就是拿這串即時吐出來的 liveCaptions 字數，每 3 秒去推算一次語速儀表板。

- 缺點：精準度普通，且不懂劇本裡的專有名詞。

##### 第二層：Groq + NVIDIA 引擎 (最終定稿與 AI 分析)
這就是我們剛剛提到的「B 軌道」。當玩家講完話、關閉麥克風的那一刻：

- 覆蓋機制：後端處理完那包高品質的 .webm 音檔，並經過 NVIDIA 的劇本詞表校正後，會透過 Socket 廣播 final_transcript 回來。

- 狀態切換：在 useSubtitles.ts 的 appendFinal 函式中，你會看到一個很精妙的操作：
```tsx
// 當收到最終高品質文字時
setFinalSubtitles(prev => [...prev, line]); // 把完美文字塞進最終陣列
delete next[speaker];                       // 🌟 同時把剛剛 Web Speech 產生的粗糙 liveCaption 刪除！
```

## 多 Agent 協作法官
為了達到「專業 AI 法官」的水準，你的 engine.ts 與 prompts.ts 實作了非常經典且強大的 「多 Agent 協作管線 (Multi-Agent Pipeline)」 與 「思維鏈拆解」 策略。

我們把這個 AI 引擎拆解成 「模型調度」、「五步分析管線」 與 「防呆機制」 三個核心來看。

1. 多模型協同作戰 (Model Orchestration)
打開 prompts.ts 的 MODELS 常數，可以看到你非常精明地根據任務特性，把工作分配給了最適合的模型，而不是全部砸給同一個：

極速聽寫 (ASR)：交給 deepgram/nova-2 (或 Groq Whisper)，專注於最快把音檔轉成粗糙的文字。

上下文校正 (P0_STT)：交給速度極快、便宜的 Llama 3，搭配 entity.ts 裡定義的「劇本專屬詞表 (glossary)」（例如：新亭洞、崔製作人），把 ASR 聽錯的同音字修回來。

深層邏輯推理 (Judge)：交給具備強大推理能力的 Nvidia Nemotron 或是 Qwen。這些模型（可能帶有 <think> 思維鏈能力）負責最複雜的邏輯糾錯與給分。

2. 核心大腦：五步分析管線 (The 5-Step Analysis Pipeline)
在 prompts.ts 開頭的註解完美詮釋了這個管線的流轉。這是 engine.ts 中 analyseSession 函式的底層邏輯

```mermaid
graph TD
    Audio[玩家音檔 .webm] -->|ASR| RawSTT[原始逐字稿]
    
    subgraph Stage1 [第一階段：文本淨化]
        RawSTT -->|P0_STT + 劇本詞表| CleanText[完美校正版逐字稿]
    end
    
    subgraph Stage2 [第二階段：發言定性]
        CleanText -->|P1_TYPE| Type{分類器}
        Type -->|閒聊或系統外| Skip[不計入評分]
        Type -->|推論、敘事、提問| Proceed[進入深度分析]
    end
    
    subgraph Stage3 [第三階段：三維度並行分析]
        Proceed -->|P2_LOGIC| P2[邏輯專家：找漏洞與因果]
        Proceed -->|P3_ACCESSIBILITY| P3[理解專家：抓代名詞模糊]
        Proceed -->|P4_STRUCTURE| P4[結構專家：檢查表達條理]
    end
    
    subgraph Stage4 [第四階段：法官裁決]
        P2 --> Judge{法官綜合評分}
        P3 --> Judge
        P4 --> Judge
        Type --> Judge
        CleanText -->|P_JUDGE| Judge
    end
    
    Judge -->|輸出結構化 JSON| Report[最終評估報告]
```

## 結局結算：資料持久化與 API 路由 (routes.ts & db.ts)
遊戲結束後，記憶體 (Room State) 裡的資料會灰飛煙滅，這時候就需要 REST API 與 PostgreSQL 登場了。

- 資料庫綱要 (db.ts)：
你設計了四個核心表：users (玩家基本資料)、surveys (問卷紀錄，作為解鎖劇本的依據)、script_records (對話紀錄) 以及 assessment_reports (AI 評估報告)。

- API 路由 (routes.ts)：
當 AI 分析引擎背景跑完後，會呼叫 db.query 將最終的 JSON 報告寫入 assessment_reports 表。前端會透過 polling (輪詢) 或是在查看報告頁面時發送 GET /api/reports/:userId，將熱騰騰的 AI 報告拉回前端展示給玩家。

- 甚至還有一個隱藏的 /admin/users 路由，能讓管理者查看所有玩家的遊玩軌跡與問卷。

```mermaid
flowchart LR
    subgraph Client ["💻 玩家裝置 (瀏覽器)"]
        UI("前端 UI 畫面")
        LS["📦 localStorage"]
        
        UI <-->|"讀寫"| LS
    end

    subgraph Backend ["☁️ 遠端伺服器"]
        API("Express API / Socket")
    end

    subgraph Database ["🗄️ 資料庫層"]
        DB[("PostgreSQL")]
    end

    Client <-->|"透過網路連線"| Backend
    Backend <-->|"SQL 查詢"| DB
```