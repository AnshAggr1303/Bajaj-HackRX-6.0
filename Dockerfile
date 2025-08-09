FROM python:3.11-slim

WORKDIR /code

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app directory
COPY app/ ./app/

# Optional: Only copy .env if it exists and contains non-sensitive defaults
# COPY .env ./app/.env

# Set PYTHONPATH so imports work correctly
ENV PYTHONPATH=/code

# Expose port 7860 (required by HF Spaces)
EXPOSE 7860

# Run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]