# Student Management System

A basic Student Management System built with Python, Flask, MySQL, and Bootstrap.

## Prerequisites

- Python 3.8+
- MySQL Server

## Setup Instructions

### 1. Database Setup

1. Start your MySQL server.
2. Create a database named `student_db`.
3. Create the `students` table using the following SQL command:

```sql
CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    course VARCHAR(100)
);
```

### 2. Backend Setup

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Update `app/config.py` with your MySQL connection details (username, password).

### 3. Run the Application

1. Ensure your virtual environment is activated and you are in the `app` directory.
2. Run the Flask application:
   ```bash
   python app.py
   ```
3. Open a web browser and navigate to `http://127.0.0.1:5000/`.
