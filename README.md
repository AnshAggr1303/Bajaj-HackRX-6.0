# Insurance Claim System

This project consists of a **FastAPI backend** and a **Next.js frontend** for an insurance claim system.

## 🚀 Setup Instructions

### 🛠 Backend Setup (Python 3.11 required)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python 3.11 virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file in the `backend/` folder with the following content:**
   ```env
   GOOGLE_API_KEY=your_api_key
   CHROMA_DB_PATH=./chroma_db
   LOG_LEVEL=INFO
   ```

5. **Run the backend server:**
   ```bash
   uvicorn app.main:app --reload
   ```

### 🌐 Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```
   > ⚠️ **Note:** If the above fails, try:
   > ```bash
   > npm install --force
   > ```

3. **Create a `.env.local` file in the `frontend/` folder with the following content:**
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   
   # Optional: For production deployment
   # NEXT_PUBLIC_API_URL=https://your-backend-api.com
   ```

4. **Run the frontend development server:**
   ```bash
   npm run dev
   ```

## 📝 Notes

- Ensure Python 3.11 is installed on your system before setting up the backend
- Replace `your_api_key` with your actual Google API key in the backend `.env` file
- The frontend will be available at `http://localhost:3000` (default Next.js port)
- The backend API will be available at `http://localhost:8000` (default FastAPI port)