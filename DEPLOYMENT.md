# DocInsight Deployment Guide

This guide covers multiple deployment options for the DocInsight application, which consists of a FastAPI backend and Next.js frontend.

## Architecture Overview

- **Backend**: FastAPI server that uses your existing `DocumentAnalysisPipeline` with all trained models
- **Frontend**: Next.js application optimized for Vercel deployment
- **Models**: Your semantic models, cross-encoder, and stylometry components

## Quick Start (Local Development)

### Option 1: Docker Compose (Recommended)

```bash
# Build and run both services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Backend docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend
```bash
# Install backend dependencies
pip install -r requirements.txt
pip install -r backend/requirements.txt

# Run development server
cd backend
python run_dev.py
```

#### Frontend
```bash
# Install and run frontend
cd frontend
npm install
npm run dev
```

## Production Deployment

### Backend Deployment Options

#### Option A: Docker Container

```bash
# Build backend image
docker build -f backend/Dockerfile -t docinsight-backend .

# Run with your models mounted
docker run -p 8000:8000 \
  -v $(pwd)/models:/app/models:ro \
  -v $(pwd)/embeddings:/app/embeddings:ro \
  -v $(pwd)/index:/app/index:ro \
  -e DOCINSIGHT_USE_FINE_TUNED=true \
  docinsight-backend
```

#### Option B: Cloud Platforms

**Railway/Render/DigitalOcean:**
1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt && pip install -r backend/requirements.txt`
3. Set start command: `python backend/main.py`
4. Set environment variables:
   - `PORT=8000`
   - `DOCINSIGHT_USE_FINE_TUNED=true`
   - `DOCINSIGHT_EXTENDED_CORPUS=true`

**Google Cloud Run / AWS ECS:**
1. Build and push Docker image to registry
2. Deploy with appropriate memory (4GB+ recommended for models)
3. Set timeout to 300s+ for analysis requests

### Frontend Deployment

#### Option A: Vercel (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set **Root Directory** to `frontend/`

2. **Configure Build**:
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Environment Variables**:
   ```
   BACKEND_URL=https://your-backend.example.com
   ```

4. **Deploy**: Vercel will automatically deploy on git push

#### Option B: Netlify

1. Connect repository, set base directory to `frontend/`
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variable: `BACKEND_URL=https://your-backend.example.com`

#### Option C: Docker

```bash
cd frontend
docker build -t docinsight-frontend .
docker run -p 3000:3000 -e BACKEND_URL=https://your-backend.example.com docinsight-frontend
```

## Environment Variables

### Backend
- `PORT`: Server port (default: 8000)
- `LOG_LEVEL`: Logging level (INFO, DEBUG)
- `DOCINSIGHT_USE_FINE_TUNED`: Use fine-tuned models (true/false)
- `DOCINSIGHT_EXTENDED_CORPUS`: Enable extended corpus (true/false)
- `DOCINSIGHT_CHUNK_SIZE`: Document chunk size (default: 512)

### Frontend
- `BACKEND_URL`: URL of your deployed backend
- `NEXT_PUBLIC_APP_NAME`: App name for branding (optional)

## Model Requirements

### Required Models and Data
Your backend needs access to:
- `/models/`: Fine-tuned semantic models (if using)
- `/embeddings/`: Pre-computed embeddings
- `/index/` or `/indexes/`: FAISS indexes
- `/checkpoints/`: Model checkpoints

### Model Loading
The backend will automatically:
1. Try to load fine-tuned models if `DOCINSIGHT_USE_FINE_TUNED=true`
2. Fall back to base models (downloaded automatically)
3. Initialize stylometry analyzer with spaCy
4. Load cross-encoder for reranking

## Health Checks and Monitoring

### Backend Health Check
```bash
curl http://your-backend.example.com/health
```

Returns component status and model information.

### Frontend Health Check
The frontend automatically connects to the backend. If `BACKEND_URL` is not set, it uses mock data for UI testing.

## Troubleshooting

### Backend Issues

1. **Models not loading**:
   - Check that model paths exist: `/models/`, `/embeddings/`, `/index/`
   - Verify environment variables: `DOCINSIGHT_USE_FINE_TUNED`
   - Check logs for specific model loading errors

2. **Out of memory**:
   - Increase container memory to 4GB+
   - Reduce `DOCINSIGHT_CHUNK_SIZE`
   - Use smaller base models if needed

3. **Slow analysis**:
   - Check that FAISS indexes are properly loaded
   - Ensure cross-encoder model is available
   - Monitor CPU/memory usage during analysis

### Frontend Issues

1. **Backend connection failed**:
   - Verify `BACKEND_URL` environment variable
   - Check CORS settings in backend
   - Test backend health endpoint directly

2. **File upload errors**:
   - Check file size limits (adjust in Vercel settings if needed)
   - Verify supported file types: PDF, DOCX, TXT
   - Check backend logs for processing errors

### Performance Optimization

1. **Backend**:
   - Use persistent storage for models to avoid reloading
   - Enable model caching in pipeline
   - Consider using GPU instances for large models

2. **Frontend**:
   - Enable Vercel's CDN and edge caching
   - Optimize images and static assets
   - Use streaming responses for long-running analysis

## Security Considerations

1. **API Security**:
   - Add API key authentication for production
   - Implement rate limiting
   - Use HTTPS for all communications

2. **File Processing**:
   - Validate file types and sizes
   - Scan uploaded files for malware
   - Implement temporary file cleanup

3. **Environment Variables**:
   - Never commit secrets to git
   - Use platform-specific secret management
   - Rotate API keys regularly

## Support

For deployment issues:
1. Check the logs from both frontend and backend
2. Verify all environment variables are set correctly
3. Test the backend API endpoints directly
4. Ensure all required models and data are available

The system is designed to gracefully handle missing components - check the "Processing Information" section in the UI to see which components are available.