FYP App Backend (macOS Setup Guide)

This guide helps you set up and run the Flask backend on macOS (Apple Silicon and Intel).

1) Prerequisites

- macOS 12+
- Homebrew installed (/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)")
- Python 3.10+ (python3 --version)

2) Install system dependencies (Homebrew)

```
# Dev tools
xcode-select --install || true

# Postgres + PostGIS
brew install postgresql@14 postgis

# Geospatial libs required by Shapely/GeoAlchemy stack
brew install gdal geos proj

# Optional: SSL if you hit OpenSSL-related errors
brew install openssl
```

Ensure pg_config is on PATH (needed for psycopg2):

```
# Apple Silicon (M1/M2/M3)
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"

# Intel Macs (uncomment if needed)
# export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
```

3) Create and activate a virtual environment

```
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip wheel setuptools
```

4) Install Python dependencies

macOS-optimized requirements (uses psycopg2 instead of psycopg2-binary):

```
pip install -r requirements.macos.txt
```

If you prefer a single file and your system already has Postgres headers correctly set up, requirements.txt also works.

5) Database setup (PostgreSQL + PostGIS)

Start PostgreSQL (first time):

```
brew services start postgresql@14
```

Create database and enable PostGIS:

```
psql -U postgres -c "CREATE DATABASE fyp_app;"
psql -U postgres -d fyp_app -c "CREATE EXTENSION postgis;"
```

Load schema:

```
psql -U postgres -d fyp_app -f database_fyp.sql
```

6) Environment variables

Create a .env file in backend/:

```
DATABASE_URL=postgresql://postgres:@localhost:5432/fyp_app
SECRET_KEY=replace-with-a-secure-random-string
FLASK_ENV=development
```

If your Postgres user/password differs, update DATABASE_URL accordingly.

7) Run the server

Option A: direct Python
```
python app.py
```

Option B: Flask CLI
```
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

Server runs at http://localhost:5001.

8) Common issues on macOS

- psycopg2 build errors: ensure pg_config is on PATH and Postgres 14 is installed (brew info postgresql@14).
- Shapely/GEOS/GDAL errors: confirm `brew install gdal geos proj` completed; then reinstall: `pip install --no-cache-dir -r requirements.macos.txt`.
- Permission denied for Postgres: initialize DB cluster or use the postgres superuser created by Homebrew; reset with `brew services restart postgresql@14`.

9) Useful commands

```
# Stop/start Postgres
brew services stop postgresql@14
brew services start postgresql@14

# Connect to DB
psql -U postgres -d fyp_app

# Verify tables
psql -U postgres -d fyp_app -c "\\dt"
```

---
If you run into setup issues on macOS, share the exact error output and your chip type (Apple Silicon vs Intel) so we can tailor the fix.

