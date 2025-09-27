#!/usr/bin/env python3
"""
Development server runner for DocInsight FastAPI backend.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

import uvicorn

if __name__ == "__main__":
    # Set development environment
    os.environ.setdefault("LOG_LEVEL", "DEBUG")
    
    print("Starting DocInsight FastAPI backend in development mode...")
    print("API will be available at: http://localhost:8000")
    print("API docs will be available at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )