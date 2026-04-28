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