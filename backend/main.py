"""
FastAPI backend for DocInsight that integrates with the existing DocumentAnalysisPipeline.
This provides a REST API endpoint for document analysis using all your trained models.
"""

import os
import sys
import tempfile
import traceback
import logging
from pathlib import Path
from typing import Dict, Any
import asyncio

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Add parent directory to path to import DocInsight modules
sys.path.append(str(Path(__file__).parent.parent))

from enhanced_pipeline import DocumentAnalysisPipeline
from config import SUPPORTED_EXTENSIONS, LOG_LEVEL, LOG_FORMAT

# Configure logging
logging.basicConfig(level=getattr(logging, LOG_LEVEL), format=LOG_FORMAT)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DocInsight API",
    description="Document originality analysis using semantic similarity, cross-encoder reranking, and stylometry",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure more restrictively in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance (initialized on startup)
pipeline: DocumentAnalysisPipeline = None

@app.on_event("startup")
async def startup_event():
    """Initialize the DocumentAnalysisPipeline on startup."""
    global pipeline
    try:
        logger.info("Initializing DocumentAnalysisPipeline...")
        pipeline = DocumentAnalysisPipeline()
        logger.info("DocumentAnalysisPipeline initialized successfully")
        
        # Log available components
        if hasattr(pipeline, 'semantic_engine') and pipeline.semantic_engine:
            logger.info(f"Semantic engine available: {pipeline.semantic_engine.model_source}")
        if hasattr(pipeline, 'cross_encoder') and pipeline.cross_encoder:
            logger.info("Cross-encoder reranker available")
        if hasattr(pipeline, 'stylometry') and pipeline.stylometry:
            logger.info("Stylometry analyzer available")
            
    except Exception as e:
        logger.error(f"Failed to initialize DocumentAnalysisPipeline: {e}")
        logger.error(traceback.format_exc())
        # Don't fail startup completely, but pipeline will be None
        pipeline = None

def cleanup_temp_file(temp_path: str):
    """Clean up temporary file after processing."""
    try:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
            logger.debug(f"Cleaned up temporary file: {temp_path}")
    except Exception as e:
        logger.warning(f"Could not clean up temporary file {temp_path}: {e}")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "DocInsight API is running",
        "pipeline_ready": pipeline is not None,
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check with component status."""
    if pipeline is None:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "pipeline_initialized": False,
                "components": {}
            }
        )
    
    components = {}
    try:
        # Check semantic engine
        if hasattr(pipeline, 'semantic_engine') and pipeline.semantic_engine:
            components["semantic_engine"] = {
                "available": pipeline.semantic_engine.model is not None,
                "model_source": getattr(pipeline.semantic_engine, 'model_source', 'unknown'),
                "model_path": getattr(pipeline.semantic_engine, 'model_path', 'unknown')
            }
        
        # Check cross-encoder
        if hasattr(pipeline, 'cross_encoder') and pipeline.cross_encoder:
            components["cross_encoder"] = {
                "available": pipeline.cross_encoder.model is not None
            }
            
        # Check stylometry
        if hasattr(pipeline, 'stylometry') and pipeline.stylometry:
            components["stylometry"] = {
                "available": pipeline.stylometry.nlp is not None
            }
            
    except Exception as e:
        logger.error(f"Error checking component status: {e}")
    
    return {
        "status": "healthy",
        "pipeline_initialized": True,
        "components": components
    }

@app.post("/analyze")
async def analyze_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Analyze a document for originality using the DocInsight pipeline.
    
    Returns JSON with originality metrics, risk spans, and sentence-level analysis.
    """
    if pipeline is None:
        raise HTTPException(
            status_code=503, 
            detail="DocumentAnalysisPipeline not initialized. Check server logs."
        )
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    
    # Save uploaded file to temporary location
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_path = temp_file.name
            content = await file.read()
            temp_file.write(content)
        
        logger.info(f"Processing file: {file.filename} ({len(content)} bytes)")
        
        # Analyze document using the pipeline
        result = pipeline.analyze_document(temp_path)
        
        # Schedule cleanup of temporary file
        background_tasks.add_task(cleanup_temp_file, temp_path)
        
        logger.info(f"Analysis completed for: {file.filename}")
        return result
        
    except Exception as e:
        # Clean up temp file immediately on error
        if temp_path and os.path.exists(temp_path):
            cleanup_temp_file(temp_path)
            
        logger.error(f"Error analyzing document {file.filename}: {e}")
        logger.error(traceback.format_exc())
        
        # Return a more user-friendly error message
        if "not found" in str(e).lower() or "no such file" in str(e).lower():
            raise HTTPException(status_code=400, detail="Could not process the uploaded file")
        elif "unsupported" in str(e).lower():
            raise HTTPException(status_code=400, detail=str(e))
        else:
            raise HTTPException(status_code=500, detail="An error occurred during document analysis")

@app.post("/analyze-text")
async def analyze_text(request_data: Dict[str, Any]):
    """
    Analyze raw text content for originality.
    
    Expects JSON body with 'text' field.
    """
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="DocumentAnalysisPipeline not initialized"
        )
    
    text = request_data.get('text')
    if not text or not isinstance(text, str):
        raise HTTPException(status_code=400, detail="Missing or invalid 'text' field")
    
    if len(text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text too short for analysis")
    
    temp_path = None
    try:
        # Save text to temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8') as temp_file:
            temp_path = temp_file.name
            temp_file.write(text)
        
        # Analyze using the pipeline
        result = pipeline.analyze_document(temp_path)
        
        logger.info(f"Text analysis completed ({len(text)} characters)")
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An error occurred during text analysis")
        
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            cleanup_temp_file(temp_path)

if __name__ == "__main__":
    # Run the server
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting DocInsight API server on {host}:{port}")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,  # Set to True for development
        log_level=LOG_LEVEL.lower()
    )