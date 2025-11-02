#!/usr/bin/env python3
"""
Database Viewer Script - Updated for PostgreSQL
Run this script to view data from your FYP database
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///instance/fyp_app.db')

print(f"\n{'='*80}")
print("FYP Real Estate Database Viewer")
print("="*80)
print(f"\nDatabase: {DATABASE_URL}")
print()

# Create database connection
if DATABASE_URL.startswith('postgresql://'):
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    print("✅ Connected to PostgreSQL database")
else:
    print("⚠️  SQLite database (note: your app uses PostgreSQL)")
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'fyp_app.db')
    session = sqlite3.connect(db_path)
    print(f"📁 Connected to SQLite database: {db_path}")

try:
    # Get all tables
    if DATABASE_URL.startswith('postgresql://'):
        result = session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result]
    else:
        cursor = session.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
    
    print(f"\nTotal Tables: {len(tables)}")
    print("\nAvailable Tables:")
    for i, table in enumerate(tables, 1):
        print(f"  {i:2}. {table}")
    print()
    
    # Show summary
    print("\n" + "="*80)
    print("DATABASE SUMMARY")
    print("="*80)
    
    for table in tables:
        try:
            if DATABASE_URL.startswith('postgresql://'):
                result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
            else:
                cursor = session.cursor()
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
            
            print(f"  {table:40} {count:5} rows")
        except Exception as e:
            print(f"  {table:40} Error: {str(e)}")
    
    # Show users detail
    print("\n" + "="*80)
    print("USER DETAILS")
    print("="*80)
    
    try:
        if DATABASE_URL.startswith('postgresql://'):
            result = session.execute(text("""
                SELECT id, email, full_name, user_type, subscription_status, 
                       account_created_date, last_login
                FROM users
                ORDER BY id
            """))
            users = result.fetchall()
        else:
            cursor = session.cursor()
            cursor.execute("SELECT id, email, full_name, user_type, subscription_status FROM users")
            users = cursor.fetchall()
        
        if users:
            print(f"\n{'ID':<5} {'Email':<30} {'Name':<20} {'Type':<10} {'Status':<10}")
            print("-" * 80)
            for user in users:
                print(f"{user[0]:<5} {str(user[1]):<30} {str(user[2]):<20} {str(user[3]):<10} {str(user[4]):<10}")
        else:
            print("\nNo users found.")
    except Exception as e:
        print(f"\nError fetching users: {e}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    if DATABASE_URL.startswith('postgresql://'):
        session.close()
    else:
        session.close()
