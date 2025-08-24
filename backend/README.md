# FYP App Backend

This is the Python Flask backend for the FYP application.

## Setup Instructions

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Database Setup
- Make sure you have PostgreSQL installed and running
- Install PostGIS extension: `CREATE EXTENSION postgis;`
- Create a database named `fyp_app`
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

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /` - Home page
- `GET /health` - Health check
- `GET /api/test` - Test API endpoint

## Database

The application uses SQLAlchemy ORM with PostgreSQL and PostGIS. Make sure to:
1. Have PostgreSQL running
2. Install PostGIS extension: `CREATE EXTENSION postgis;`
3. Create the database
4. Run the SQL scripts from `database.sql` to set up tables
