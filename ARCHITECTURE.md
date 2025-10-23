# DocInsight Microservices Architecture

This repository has been restructured to a microservice-friendly layout using a service registry (Eureka) and an API Gateway (Spring Cloud Gateway).

## Services

- discovery-service (Java, Spring Boot)
  - Role: Eureka service registry.
  - Port: 8761 (UI at http://localhost:8761)
  - Health: /actuator/health

- api-gateway (Java, Spring Boot)
  - Role: Single entry point; routes requests to registered services via Eureka.
  - Port: 8080
  - Health: /actuator/health
  - Routes:
    - /api/** -> analysis-service (prefix /api is stripped)

- analysis-service (Python, FastAPI)
  - Role: Document analysis (existing backend).
  - Port: 8000
  - Health: /health
  - Endpoints: /analyze, /analyze-text, /
  - Registers with Eureka using py-eureka-client.

- docinsight-frontend (Next.js)
  - Role: UI, configured to call the API Gateway at BACKEND_URL.
  - Port: 3000

## Local development

Prerequisites: Docker and Docker Compose.

To build and run all services:

- make dev-build
  or
- ./scripts/dev.sh --build
  or
- docker compose up --build

Once up:
- Frontend: http://localhost:3000
- Gateway: http://localhost:8080/actuator/health
- Eureka UI: http://localhost:8761
- Analysis service (direct, for debugging): http://localhost:8000/health

## Environment variables

- analysis-service
  - REGISTER_WITH_EUREKA=true
  - EUREKA_SERVER_URL=http://discovery-service:8761/eureka
  - SERVICE_NAME=analysis-service
  - PORT=8000

- api-gateway
  - EUREKA_SERVER_URL=http://discovery-service:8761/eureka

- docinsight-frontend
  - BACKEND_URL=http://api-gateway:8080/api

## Adding a new backend microservice (pattern)

1) Create a new service directory with its Dockerfile.
2) Ensure the service provides a /health endpoint.
3) Register the service with Eureka (language-specific client) under a unique service name.
4) Add a gateway route mapping a public path (e.g., /api/newsvc/**) to lb://new-service-name and use StripPrefix=1.
5) Update docker-compose to include the new service and environment variables.

## Next steps (optional decompositions)

- Split monolith analysis responsibilities:
  - ingestion-service: file/web ingestion and parsing
  - embeddings-service: model-based embedding generation
  - index-service: FAISS/other index operations
  - retrieval-service: semantic search + reranking
  - scoring-service: aggregation and stylometry
- Introduce async messaging (e.g., Kafka or RabbitMQ) between ingestion/embeddings/index for better decoupling.
- Centralized configuration (e.g., Spring Cloud Config) for Java services and env-based for Python.
- Observability: Prometheus + Grafana; distributed tracing (OpenTelemetry) across services.
