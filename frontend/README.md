# DocInsight Frontend (Next.js)

This is a minimal Next.js frontend for DocInsight, designed for deployment on Vercel.

It provides:
- A file upload UI.
- Visualization of originality metrics, risk spans, and sentence-level analysis.
- A server API route that either proxies to a backend (if configured) or returns mock data for local UI testing.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and set `BACKEND_URL` to your backend (optional, for real analysis):

```bash
cp .env.example .env.local
# Edit .env.local and set:
# BACKEND_URL=https://your-backend.example.com
```

3. Run the dev server:

```bash
npm run dev
```

Then open http://localhost:3000.

If `BACKEND_URL` is not set, the API route returns mocked analysis data so you can iterate on the UI.

## Backend Expectation

The API route forwards uploads to:

```
POST $BACKEND_URL/analyze
Content-Type: multipart/form-data
body: { file: <uploaded file> }
```

The response should be JSON shaped like the Streamlit pipeline output (e.g., containing `originality_analysis.originality_metrics`, `originality_analysis.top_risk_spans`, and `sentence_results`).

You currently have a Streamlit app that uses `DocumentAnalysisPipeline`. To integrate with this frontend, you can expose a small HTTP service (e.g., FastAPI) that:

- Accepts file uploads at `/analyze`.
- Invokes `DocumentAnalysisPipeline().analyze_document(<temp_path>)`.
- Returns the analysis JSON. Optionally include generated report file links if you wish.

If you want, I can scaffold a minimal FastAPI server in this repo in a separate step.

## Deploying to Vercel

- From the Vercel dashboard: New Project → Import this repo → Set the project root to `frontend/`.
- Framework preset: Next.js (auto-detected).
- Environment Variables: add `BACKEND_URL` pointing at your deployed backend.
- Build Command: `next build` (default)
- Output Directory: `.next` (default)

Once deployed, the site will be live and ready to accept uploads and call your backend.
