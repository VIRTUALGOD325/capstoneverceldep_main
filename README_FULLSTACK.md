# DocInsight - Full Stack Document Originality Analysis

A production-ready web application for document originality analysis using advanced ML techniques including semantic similarity, cross-encoder reranking, and stylometric analysis.

## 🚀 Features

- **Advanced ML Pipeline**: Semantic similarity search with fine-tuned models, cross-encoder reranking, and stylometry
- **Modern Web UI**: Drag-and-drop file upload, real-time progress tracking, detailed analysis visualization
- **Production Ready**: Docker containerization, cloud deployment configurations, comprehensive error handling
- **Multiple Deployment Options**: Vercel + cloud backend, Docker Compose, or fully containerized

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/REST    ┌──────────────────┐
│                 │ ──────────────→ │                  │
│  Next.js        │                 │  FastAPI         │
│  Frontend       │ ←────────────── │  Backend         │
│  (Vercel)       │    JSON/API     │  (Cloud)         │
└─────────────────┘                 └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  DocInsight      │
                                    │  Pipeline        │
                                    │  • Semantic      │
                                    │  • Cross-Encoder │
                                    │  • Stylometry    │
                                    └──────────────────┘
```

### Components

1. **Frontend** (`/frontend/`): Next.js application with modern UI
2. **Backend** (`/backend/`): FastAPI server that wraps your existing pipeline
3. **Pipeline**: Your existing `DocumentAnalysisPipeline` with all trained models

## 🚀 Quick Start

### Local Development with Docker

```bash
# Clone and start services
git clone <your-repo>
cd DocInsight
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Manual Setup

#### Backend
```bash
pip install -r requirements.txt
pip install -r backend/requirements.txt
cd backend && python run_dev.py
```

#### Frontend
```bash
cd frontend
npm install && npm run dev
```

## 📊 Analysis Features

### Document-Level Metrics
- **Originality Score**: Overall document originality percentage
- **Plagiarism Coverage**: Percentage of content flagged as potentially plagiarized
- **Severity Index**: Average severity of detected matches
- **Plagiarism Factor**: Composite risk score with component breakdown

### Risk Analysis
- **Risk Distribution**: Sentence-level classification (High/Medium/Low)
- **Top Risk Spans**: Clustered high-risk sections with detailed breakdowns
- **Sentence Analysis**: Individual sentence scores with similarity matches

### Processing Information
- **Component Status**: Real-time status of ML components
- **Model Information**: Details about loaded semantic models
- **Processing Pipeline**: Visibility into analysis workflow

## 🎨 UI Features

- **Modern Design**: Clean, professional interface with intuitive navigation
- **Drag & Drop**: Easy file upload with visual feedback
- **Real-time Progress**: Analysis progress tracking with status updates
- **Interactive Results**: Expandable sections, detailed breakdowns, color-coded risk levels
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error messages and recovery suggestions

## 🔧 Configuration

### Backend Configuration
Located in `config.py` - all your existing configuration options are preserved:
- Model paths and fine-tuning settings
- Scoring thresholds and weights
- Processing parameters
- Feature flags

### Environment Variables
- `BACKEND_URL`: URL of your deployed backend (frontend)
- `DOCINSIGHT_USE_FINE_TUNED`: Enable fine-tuned models
- `DOCINSIGHT_EXTENDED_CORPUS`: Enable extended training corpus
- `LOG_LEVEL`: Logging verbosity (DEBUG, INFO, WARNING)

## 🚀 Deployment Options

### Option 1: Vercel + Cloud Backend (Recommended)

**Frontend on Vercel:**
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend/`
3. Add environment variable: `BACKEND_URL=https://your-backend.com`
4. Deploy automatically on git push

**Backend on Railway/Render/DigitalOcean:**
1. Connect repository
2. Set start command: `python backend/main.py`
3. Configure environment variables
4. Deploy with 4GB+ memory for models

### Option 2: Full Docker Deployment

```bash
# Use provided docker-compose.yml
docker-compose up --build

# Or deploy to cloud container services
docker build -f backend/Dockerfile -t docinsight-backend .
docker build -f frontend/Dockerfile -t docinsight-frontend .
```

### Option 3: Kubernetes

Use the provided Kubernetes manifests in `k8s/` for production-scale deployment.

## 📈 Performance

- **Analysis Speed**: Typically 30-60 seconds for average documents
- **Concurrent Users**: Backend designed for multiple simultaneous analyses
- **Model Loading**: Cached models for fast subsequent requests
- **Memory Usage**: ~2-4GB for full model suite

## 🔍 API Endpoints

### POST `/analyze`
Upload and analyze a document file.

**Request**: `multipart/form-data` with `file` field
**Response**: JSON with originality analysis, risk spans, and sentence details

### POST `/analyze-text`
Analyze raw text content.

**Request**: JSON with `text` field
**Response**: Same as `/analyze`

### GET `/health`
Check backend status and component availability.

**Response**: Service health and model status information

## 🤝 Integration

The backend preserves full compatibility with your existing DocInsight pipeline:

- All configuration options maintained
- Existing model loading logic preserved
- Same analysis output format
- Compatible with your trained models

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Comprehensive deployment instructions
- [API Reference](http://localhost:8000/docs) - Interactive API documentation
- [Configuration Guide](config.py) - All configuration options

## 🔒 Security

- File type validation and size limits
- Temporary file cleanup
- CORS configuration for frontend integration
- Error handling that doesn't expose sensitive information

## 🛠️ Development

### Adding New Features

1. **Backend**: Extend FastAPI routes in `backend/main.py`
2. **Frontend**: Add React components in `frontend/app/`
3. **Pipeline**: Modify your existing pipeline code as usual

### Testing

```bash
# Backend tests
cd backend && python -m pytest

# Frontend tests
cd frontend && npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📄 License

[Your License Here]

## 🆘 Support

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
2. View logs: `docker-compose logs -f`
3. Test backend directly: `curl http://localhost:8000/health`
4. Check component status in the UI "Processing Information" section

---

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.