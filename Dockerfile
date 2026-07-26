# Life AI OS Production Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Ensure data directory exists
RUN mkdir -p data

# Copy backend code
COPY backend/ ./backend/

EXPOSE 8008

CMD ["python", "backend/server.py"]
