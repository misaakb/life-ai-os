# Life AI OS Production Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source files (Excluding .env for security)
COPY backend/ ./backend/
COPY data/ ./data/

EXPOSE 8008

CMD ["python", "backend/server.py"]
