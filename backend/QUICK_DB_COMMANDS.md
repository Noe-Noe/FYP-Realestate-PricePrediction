# Quick Database Commands

## Database Location
- **File**: `backend/instance/fyp_app.db`
- **Type**: SQLite

## Common Commands

### View All Tables
```bash
sqlite3 instance/fyp_app.db ".tables"
```

### View Table Data
```bash
sqlite3 instance/fyp_app.db "SELECT * FROM users;" -header -column
sqlite3 instance/fyp_app.db "SELECT * FROM properties;" -header -column
```

### Count Records in All Tables
```bash
sqlite3 instance/fyp_app.db "SELECT name FROM sqlite_master WHERE type='table';" | \
  while read table; do 
    echo "$table: $(sqlite3 instance/fyp_app.db \"SELECT COUNT(*) FROM $table\")"
  done
```

### View Table Structure
```bash
sqlite3 instance/fyp_app.db ".schema users"
```

### Interactive SQLite Shell
```bash
sqlite3 instance/fyp_app.db
```

### Using Python
```bash
# Run the database viewer script
python3 view_database.py
```

## GUI Option
Install **DB Browser for SQLite**: https://sqlitebrowser.org/
Then open: `backend/instance/fyp_app.db`

