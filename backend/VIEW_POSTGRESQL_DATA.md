# How to View Your PostgreSQL Database

This guide shows you multiple ways to view your PostgreSQL database data.

## Quick Connection Details

- **Host:** localhost
- **Port:** 5433
- **Database:** fyp_app
- **User:** thetmyatnoe

---

## Option 1: Using psql Command Line

### Connect to PostgreSQL
```bash
psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app
```

### Useful Commands Inside psql

#### List all tables
```sql
\dt
```

#### View table structure
```sql
\d table_name
```

#### Count rows in all tables
```sql
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users 
UNION ALL 
SELECT 'properties', COUNT(*) FROM properties 
UNION ALL 
SELECT 'agent_profiles', COUNT(*) FROM agent_profiles 
UNION ALL 
SELECT 'bookmarks', COUNT(*) FROM bookmarks 
UNION ALL 
SELECT 'price_predictions', COUNT(*) FROM price_predictions 
UNION ALL 
SELECT 'business_inquiries', COUNT(*) FROM business_inquiries;
```

#### View specific table data
```sql
-- View all users
SELECT * FROM users;

-- View agent profiles
SELECT * FROM agent_profiles;

-- View bookmarks
SELECT * FROM bookmarks;

-- View properties with images
SELECT p.*, pi.image_url 
FROM properties p 
LEFT JOIN property_images pi ON p.id = pi.property_id;
```

#### Exit psql
```sql
\q
```

---

## Option 2: Run Single Commands from Terminal

### View all tables
```bash
psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app -c "\dt"
```

### Count rows in key tables
```bash
psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app -c "
SELECT 
    'users' as table_name, COUNT(*) FROM users 
UNION ALL 
SELECT 'properties', COUNT(*) FROM properties 
UNION ALL 
SELECT 'agent_profiles', COUNT(*) FROM agent_profiles;
"
```

### View users
```bash
psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app -c "SELECT id, email, full_name, user_type FROM users;"
```

### View properties
```bash
psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app -c "SELECT * FROM properties;"
```

---

## Option 3: Use Python Script

First, install required package:
```bash
cd backend
source venv/bin/activate  # or venv_new/bin/activate
pip install python-dotenv
```

Then run:
```bash
python view_database.py
```

---

## Option 4: Use GUI Tools

### pgAdmin (Official PostgreSQL Tool)
- Download from: https://www.pgadmin.org/
- Create a new server connection with:
  - Host: localhost
  - Port: 5433
  - Database: fyp_app
  - Username: thetmyatnoe

### DBeaver (Free Cross-Platform Database Tool)
- Download from: https://dbeaver.io/
- Create a PostgreSQL connection with the same details above

### TablePlus (Mac)
- Download from: https://tableplus.com/
- Create a PostgreSQL connection

---

## Current Database Summary

- **Total Users:** 6
- **Agent Profiles:** 2
- **Agent Regions:** 5
- **Bookmarks:** 1
- **Properties:** 0
- **Price Predictions:** 0
- **Business Inquiries:** 0

---

## Key Tables in Your Database

1. **users** - User accounts (6 rows)
2. **agent_profiles** - Agent information (2 rows)
3. **agent_regions** - Agent service regions (5 rows)
4. **properties** - Property listings (0 rows)
5. **property_images** - Property photos (0 rows)
6. **bookmarks** - User bookmarks (1 row)
7. **price_predictions** - ML predictions (0 rows)
8. **business_inquiries** - Contact form inquiries (0 rows)
9. **regions** - Singapore districts (28 rows)

---

## Quick Reference: Common Queries

### View all users with their types
```sql
SELECT id, email, full_name, user_type, subscription_status 
FROM users;
```

### View agents and their regions
```sql
SELECT u.email, ar.region_name, ar.region_type 
FROM users u 
JOIN agent_regions ar ON u.id = ar.agent_id 
WHERE u.user_type = 'agent';
```

### View bookmarks
```sql
SELECT u.email, b.bookmark_type, b.address, b.created_at 
FROM bookmarks b 
JOIN users u ON b.user_id = u.id;
```

### View system content
```sql
-- FAQ entries
SELECT * FROM faq_entries;

-- Team members
SELECT * FROM team_members;

-- Features steps
SELECT * FROM features_steps;
```

---

## Troubleshooting

### Connection refused?
```bash
# Check if PostgreSQL is running
brew services list  # On macOS
# or
sudo systemctl status postgresql  # On Linux
```

### Permission denied?
```bash
# Check PostgreSQL authentication
cat /usr/local/var/postgresql@14/pg_hba.conf
```

### Password required?
Add to your `~/.pgpass` file:
```
localhost:5433:fyp_app:thetmyatnoe:your_password
```
And set permissions:
```bash
chmod 600 ~/.pgpass
```

