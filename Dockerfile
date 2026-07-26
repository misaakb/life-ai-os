# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Engine & Web Server
FROM python:3.12-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Ensure data directory exists
RUN mkdir -p data

# Copy backend code
COPY backend/ ./backend/

# Copy compiled React frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set Python path
ENV PYTHONPATH=/app/backend

EXPOSE 8008

CMD ["python", "backend/server.py"]
