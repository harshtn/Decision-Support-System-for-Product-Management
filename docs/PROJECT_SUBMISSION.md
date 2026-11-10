# Project Submission: AI-Powered DSS for Product Management using Gemini API

## 1. System Architecture

### Architecture Style

AI-as-a-Service architecture with a clear separation between application logic and AI inference:

- React frontend for user and company dashboards
- Express backend for orchestration, ingestion, and DSS rules
- Gemini API for sentiment inference
- MongoDB for persistent storage

### Component Flow

```text
Frontend (React)
  -> Backend API (Express)
    -> Gemini API (sentiment inference)
    -> MongoDB (Products, Reviews, Sentiments)
```

### Data Flow Explanation

1. Reviews and product specs are loaded from CSV files.
2. Backend maps `reviews_master.csv` rows to product entries from `smartphones.csv`.
3. Mapped data is stored in MongoDB collections.
4. Backend sends review text to Gemini using a structured sentiment prompt.
5. Gemini response is parsed and stored with confidence scores.
6. Analytics and DSS endpoints generate management insights from stored sentiment.

## 2. Data Handling

### Dataset Processing

- Input files:
  - `reviews_master.csv`
  - `smartphones.csv`
- Mapping key:
  - normalized combination of brand and model
- Storage targets:
  - `products`
  - `reviews`
  - `sentiments`

### Ingestion Options

- Upload both CSVs via API (`POST /api/upload`)
- Or use default workspace CSV files when upload files are omitted

## 3. Gemini API Integration

### API Setup

- Backend package: `@google/generative-ai`
- Environment variable: `GEMINI_API_KEY`
- Model default: `gemini-1.5-flash`

### Prompt Design Used

```text
Classify the sentiment of this review as Positive, Negative, or Neutral. Also give a confidence score.
Return ONLY JSON:
{"sentiment":"Positive|Negative|Neutral","confidence":0.0,"reason":"short explanation"}
Review: <review text>
```

### Integration Function

- Service file: `backend/services/geminiService.js`
- Core function: `analyzeReviewSentiment(reviewText)`
- Output fields: `label`, `confidence`, `reason`

## 4. Backend (Node + Express)

### Required Endpoints Implemented

- `POST /api/analyze-review`
- `GET /api/products`
- `GET /api/reviews/:productId`
- `POST /api/upload`

### Additional DSS/Analytics Endpoints

- `POST /api/analyze-product/:productId`
- `GET /api/analytics/charts`
- `GET /api/analytics/overview`
- `GET /api/dss/insights`

## 5. Frontend (React)

### Pages Implemented

- Dashboard
- Product Page
- Analytics
- Company DSS Console

### Features

- Real-time display of Gemini sentiment outputs
- Product and review exploration
- Company-side upload and analysis controls
- Risk alerts and recommendations

## 6. Visualization with Real Data

Charts built using Recharts (Chart.js-compatible approach also acceptable):

- Sentiment distribution
- Product-wise sentiment (stacked)
- Rating vs sentiment (line chart)

All charts are generated from stored MongoDB sentiment data.

## 7. DSS Logic

Implemented decision rules:

- Negative sentiment threshold alert:
  - if negative ratio > configured threshold, product is flagged
- Top issue detection:
  - keyword extraction from negative-review corpus
- Recommendation generation:
  - issue-based actionable suggestions

## 8. Project Structure

```text
/frontend
/backend
/data
```

## 9. Deployment Plan

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

### Deployment Steps

1. Deploy backend on Render with `MONGO_URI` and `GEMINI_API_KEY`.
2. Deploy frontend on Vercel with `VITE_API_URL` pointing to Render backend.
3. Use Atlas connection string in backend environment.
4. Configure CORS for production frontend domain.

## 10. PPT + Report Content Guidance

### Slide/Report Topics

- Problem statement and objectives
- AI-as-a-Service architecture and data flow
- Gemini API integration and prompt engineering
- Dashboard screenshots and chart insights
- DSS alerting and recommendation examples
- Deployment architecture (Vercel + Render + Atlas)

### Gemini vs Traditional ML Comparison

- Gemini advantages:
  - no model training pipeline needed
  - faster integration and iteration
  - adaptable prompt behavior
- Traditional ML tradeoffs:
  - requires labeling/training/retraining
  - stronger controllability but higher maintenance

## Strict Rules Compliance

- No ML model training used for sentiment scoring in production flow
- Gemini API used for sentiment analysis operations
- Full-stack user and company workflows implemented
- Project structure and endpoint requirements satisfied
