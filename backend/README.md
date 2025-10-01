# BangaloreNow Backend

FastAPI backend for the BangaloreNow events application.

## 🚀 Cloud Run Deployment

### Prerequisites
- Google Cloud CLI installed and authenticated
- Docker installed locally
- Project with billing enabled

### Build and Deploy to Cloud Run

1. **Set your Google Cloud project:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Build and push to Google Container Registry:**
   ```bash
   # Build the image
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/bangalorenow-backend

   # Or use Docker and push manually:
   # docker build -t gcr.io/YOUR_PROJECT_ID/bangalorenow-backend .
   # docker push gcr.io/YOUR_PROJECT_ID/bangalorenow-backend
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy bangalorenow-backend \
     --image gcr.io/YOUR_PROJECT_ID/bangalorenow-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars ENVIRONMENT=production \
     --set-env-vars FRONTEND_HOST=https://your-frontend-domain.com
   ```

4. **Set environment variables (optional):**
   ```bash
   gcloud run services update bangalorenow-backend \
     --set-env-vars POSTGRES_SERVER=your-db-host \
     --set-env-vars POSTGRES_USER=your-db-user \
     --set-env-vars POSTGRES_PASSWORD=your-db-password \
     --set-env-vars POSTGRES_DB=your-db-name
   ```

### Quick Deploy Script
```bash
#!/bin/bash
PROJECT_ID="your-project-id"
SERVICE_NAME="bangalorenow-backend"
REGION="us-central1"

# Build and deploy in one command
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars ENVIRONMENT=production
```

## 🛠 Local Development

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Run the application:**
   ```bash
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Access the API:**
   - API: http://localhost:8000
   - Health check: http://localhost:8000/api/health
   - API docs: http://localhost:8000/docs

## 🔧 Configuration

The application uses environment variables for configuration. See `.env.example` for required variables.

## 📦 Docker

**Build locally:**
```bash
docker build -t bangalorenow-backend .
```

**Run locally:**
```bash
docker run -p 8000:8000 --env-file .env bangalorenow-backend
```