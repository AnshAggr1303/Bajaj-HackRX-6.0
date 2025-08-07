# backend/startup.sh

# Navigate to the backend directory
cd backend

# Use Gunicorn as a process manager for Uvicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
