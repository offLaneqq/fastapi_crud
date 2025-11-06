# FastAPI & React Forum Project

This project is a simplified clone of the Threads app, built using FastAPI for the backend and React for the frontend. The app allows users to create posts (threads) and leave comments on them.

## Project Structure The project is divided into two main parts:
-   `/backend`: A FastAPI application that provides a REST API for working with data.
-   `/frontend`: A React application that is the client interface for interacting with the API.

## Installation and launch
To launch the project, you will need **Python** (version 3.8+) and **Node.js** (version 18+) installed.

### 1. Running the Backend
```
bash
# 1. Go to the backend folder
cd backend

# 2. Create and activate the virtual environment
python -m venv .venv

# For Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
# The server will be available at http://127.0.0.1:8000
uvicorn main:app --reload
```

### 2. Running the Frontend
```
bash
# 1. In a new terminal window, navigate to the front end folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
# The application will be available at http://localhost:5173
npm run dev

```
