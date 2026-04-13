<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1E2kwh9vrAiQIVB0fBy98Ya5VNb1bfJTO

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set your Gemini key:
   `VITE_GEMINI_API_KEY=your_api_key_here`
3. Run the app:
   `npm run dev`

## Deploying on Railway

1. Push this repository to GitHub and connect it to Railway.
2. In Railway's dashboard, add an environment variable:
   - `VITE_GEMINI_API_KEY` = your Gemini API key
3. Set the build command to:
   `npm install && npm run build`
4. Set the start command to:
   `npm start`
5. Railway should detect the app as a Node/Vite service and deploy the static build.

> Note: This app currently calls Gemini from the frontend, so the API key is included in the built JavaScript bundle. For production security, consider moving Gemini calls to a backend server or function.
