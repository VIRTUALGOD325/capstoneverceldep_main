#!/usr/bin/env python3
"""
Integration test script to verify the full stack functionality.
"""

import sys
import os
import json
from pathlib import Path

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    
    try:
        import fastapi
        print("✅ FastAPI available")
    except ImportError as e:
        print(f"❌ FastAPI import failed: {e}")
        return False
    
    try:
        import uvicorn
        print("✅ Uvicorn available")
    except ImportError as e:
        print(f"❌ Uvicorn import failed: {e}")
        return False
    
    try:
        from enhanced_pipeline import DocumentAnalysisPipeline
        print("✅ DocumentAnalysisPipeline import successful")
    except Exception as e:
        print(f"⚠️  DocumentAnalysisPipeline import failed: {e}")
        print("This might be due to missing dependencies - check requirements.txt")
        return False
    
    return True

def test_backend_structure():
    """Test that backend files are properly structured."""
    print("\nTesting backend structure...")
    
    backend_dir = Path("backend")
    required_files = [
        "main.py",
        "requirements.txt",
        "Dockerfile",
        "run_dev.py"
    ]
    
    for file in required_files:
        path = backend_dir / file
        if path.exists():
            print(f"✅ {path} exists")
        else:
            print(f"❌ {path} missing")
            return False
    
    return True

def test_frontend_structure():
    """Test that frontend files are properly structured."""
    print("\nTesting frontend structure...")
    
    frontend_dir = Path("frontend")
    required_files = [
        "package.json",
        "next.config.mjs",
        "tsconfig.json",
        "app/layout.tsx",
        "app/page.tsx",
        "app/api/analyze/route.ts"
    ]
    
    for file in required_files:
        path = frontend_dir / file
        if path.exists():
            print(f"✅ {path} exists")
        else:
            print(f"❌ {path} missing")
            return False
    
    return True

def test_configuration():
    """Test configuration files."""
    print("\nTesting configuration...")
    
    try:
        from config import SUPPORTED_EXTENSIONS, SBERT_MODEL_NAME, LOG_LEVEL
        print(f"✅ Config loaded - Supported extensions: {SUPPORTED_EXTENSIONS}")
        print(f"✅ SBERT model: {SBERT_MODEL_NAME}")
        print(f"✅ Log level: {LOG_LEVEL}")
        return True
    except Exception as e:
        print(f"❌ Config import failed: {e}")
        return False

def test_package_json():
    """Test frontend package.json structure."""
    print("\nTesting frontend package.json...")
    
    try:
        with open("frontend/package.json") as f:
            package = json.load(f)
        
        required_deps = ["next", "react", "react-dom"]
        required_scripts = ["dev", "build", "start"]
        
        for dep in required_deps:
            if dep in package.get("dependencies", {}):
                print(f"✅ {dep} dependency found")
            else:
                print(f"❌ {dep} dependency missing")
                return False
        
        for script in required_scripts:
            if script in package.get("scripts", {}):
                print(f"✅ {script} script found")
            else:
                print(f"❌ {script} script missing")
                return False
        
        return True
    except Exception as e:
        print(f"❌ Package.json test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 DocInsight Full Stack Integration Test\n")
    
    tests = [
        test_backend_structure,
        test_frontend_structure,
        test_configuration,
        test_package_json,
        test_imports
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            results.append(False)
    
    print(f"\n📊 Test Summary:")
    print(f"✅ Passed: {sum(results)}/{len(results)}")
    print(f"❌ Failed: {len(results) - sum(results)}/{len(results)}")
    
    if all(results):
        print("\n🎉 All tests passed! Your DocInsight full stack is ready.")
        print("\nNext steps:")
        print("1. Install backend dependencies: pip install -r requirements.txt && pip install -r backend/requirements.txt")
        print("2. Install frontend dependencies: cd frontend && npm install")
        print("3. Start services: docker-compose up --build")
        print("4. Or run manually: python backend/run_dev.py (backend) and npm run dev (frontend)")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        print("Make sure all dependencies are installed and files are in place.")
        return 1

if __name__ == "__main__":
    exit(main())