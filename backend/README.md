# FYP App Backend

This is the Python Flask backend for the FYP application.

## Setup Instructions

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Database Setup
- Make sure you have PostgreSQL installed and running
- Connect to PostgreSQL and create the database:
  ```bash
  psql -U postgres
  CREATE DATABASE fyp_app;
  \q
  ```
- Install PostGIS extension:
  ```bash
  psql -U postgres -d fyp_app -c "CREATE EXTENSION postgis;"
  ```
- Set up the database tables and data:
  ```bash
  psql -U postgres -d fyp_app -f database_fyp.sql
  ```
- Update the database connection string in `config.py` if needed

### 3. Environment Variables
Create a `.env` file in the backend directory with:
```
DATABASE_URL=postgresql://username:password@localhost:5432/fyp_app
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

## Running the Application

### Option 1: Using Python directly (Recommended)
```bash
python app.py
```

### Option 2: Using Flask CLI
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

### Option 3: Using Python with module syntax
```bash
python -m flask run
```

The server will start on `http://localhost:5001`

## API Endpoints

- `GET /` - Home page
- `GET /health` - Health check
- `GET /api/test` - Test API endpoint

## Database

The application uses SQLAlchemy ORM with PostgreSQL and PostGIS. 

### Quick Database Setup:
1. **Create database:**
   ```bash
   psql -U postgres
   CREATE DATABASE fyp_app;
   \q
   ```

2. **Install PostGIS extension:**
   ```bash
   psql -U postgres -d fyp_app -c "CREATE EXTENSION postgis;"
   ```

3. **Set up tables and data:**
   ```bash
   psql -U postgres -d fyp_app -f database_fyp.sql
   ```

4. **Verify setup:**
   ```bash
   psql -U postgres -d fyp_app -c "SELECT COUNT(*) FROM users;"
   ```

### Database Files:
- `database_fyp.sql` - Complete database schema and sample data
- `models.py` - SQLAlchemy ORM models
- `config.py` - Database configuration
