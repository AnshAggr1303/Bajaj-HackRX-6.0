# Insurance Claim System

This project consists of a backend API and a Next.js frontend for an insurance claim system.

## Setup

### Backend

1.  Navigate to the `backend` directory.
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment.
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  Install the required dependencies.
    ```bash
    pip install -r requirements.txt
    ```

4.  Run the backend server.
    ```bash
    uvicorn app.main:app --reload
    ```

### Frontend

1.  Navigate to the `frontend` directory.
    ```bash
    cd frontend
    ```

2.  Install the dependencies.
    ```bash
    npm install
    ```

3.  Run the development server.
    ```bash
    npm run dev
    ```