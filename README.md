
# Run and deploy your AI Studio app

This contains everything you need to run your app locally or on cloud.

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
