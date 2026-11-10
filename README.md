# AI-Powered Decision Support System for Product Management (Gemini API)

A full-stack Decision Support System (DSS) that ingests product reviews, simulates a fine-tuned IndicBERT sentiment pipeline, performs inference through Google Gemini API, stores results in MongoDB, and provides user-side analytics plus company-side product recommendations.

## Tech Stack

- Frontend: React + Vite + Recharts
- Backend: Node.js + Express + Mongoose
- Database: MongoDB (Atlas/local)
- AI Service: Google Gemini API (`@google/generative-ai`)

## System Architecture (AI-as-a-Service)

```text
React Frontend (User + Company Dashboards)
        |
        v
Node.js/Express API (orchestration, DSS logic, ingestion)
        |
        +--> Gemini API (sentiment classification)
        |
        v
MongoDB (products, reviews, sentiments)
```

### Data Flow

1. Upload or load default CSVs: `reviews_master.csv` and `smartphones.csv`.
2. Backend maps reviews to products and stores both in MongoDB.
3. Backend runs IndicBERT simulation steps: language detection -> tokenization -> model load abstraction.
4. Inference is delegated to Gemini and returned in IndicBERT-style schema:
        `{ sentiment, confidence, model, language }`.
5. Sentiment output is persisted in `sentiments` collection.
6. Analytics endpoints aggregate real data for charts and DSS alerts.
7. Company dashboard highlights high-risk products and improvement actions.
### IndicBERT Simulation Layer

- Service module: `backend/services/indicbert_model.js`
- Simulated steps:
        - language detection (basic script detection)
        - tokenization
        - fine-tuned model loading abstraction
        - prediction pipeline using Gemini inference backend

Model abstraction allows switching between local IndicBERT and cloud LLM.

### Multilingual Support

The simulation detects language per review (English, Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Urdu) and routes all inputs through the same unified sentiment pipeline.

## Required API Endpoints

All endpoints are served under `/api`:

- `POST /analyze-review`
- `GET /model/indicbert-info`
- `GET /products`
- `GET /reviews/:productId`
- `POST /upload`

Additional project endpoints:

- `POST /analyze-product/:productId`
- `GET /analytics/overview`
- `GET /analytics/charts`
- `GET /dss/insights`

## Local Setup

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

To load an authentic dashboard-ready dataset:

```bash
cd backend
npm run seed:dashboard
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

### 3. Environment Variables

Backend (`backend/.env`):

- `PORT=5000`
- `MONGO_URI=mongodb+srv://...` or local URI
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=gemini-1.5-flash`
- `GEMINI_ANALYZE_LIMIT=120`
- `NEGATIVE_ALERT_THRESHOLD=0.35`

Frontend (`frontend/.env`):

- `VITE_API_URL=http://localhost:5000/api`

## Frontend Pages

- Dashboard: KPIs, sentiment overview, DSS alerts
- Product Page: product details, review listing, per-review Gemini analysis
- Analytics: sentiment distribution, product-wise sentiment, rating vs sentiment
- Company DSS Console: upload/ingest, batch analysis, threshold-based alerts, top issues and recommendations

## DSS Rules Implemented

- Alert when negative sentiment ratio exceeds threshold (`NEGATIVE_ALERT_THRESHOLD`)
- Extract top complaint themes from negative reviews (battery/camera/performance/display/software/price)
- Recommend product improvements by issue category

## Deployment

- Frontend -> Vercel
- Backend -> Render
- Database -> MongoDB Atlas

### Deployment Notes

1. Set backend environment variables in Render.
2. Set `VITE_API_URL` in Vercel to Render backend URL (`https://<backend>/api`).
3. Enable CORS in backend for frontend domain.
4. Use Atlas IP/network settings for Render deployment.

## PPT + Report Checklist

- Explain Gemini prompt and JSON response parsing strategy
- Show architecture and data flow
- Include real dashboard charts
- Compare Gemini API approach vs traditional ML training pipelines
- Highlight benefits: faster iteration, no training overhead, domain-adaptable prompting
