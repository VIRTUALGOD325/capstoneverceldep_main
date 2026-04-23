FROM python:3.10-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first (saves ~500MB vs default CUDA build)
RUN pip install --no-cache-dir \
    torch==2.1.0 --extra-index-url https://download.pytorch.org/whl/cpu

# Install remaining requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Download model data at build time (faster cold start)
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

CMD ["python", "backend/main.py"]
