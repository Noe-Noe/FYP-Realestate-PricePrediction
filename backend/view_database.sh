#!/bin/bash

echo "========================================================="
echo "FYP Real Estate Database Viewer"
echo "========================================================="
echo ""
echo "Database: PostgreSQL (localhost:5433/fyp_app)"
echo ""

# Count rows in each table
echo "DATABASE SUMMARY:"
echo "========================================================="

for table in users properties agent_profiles bookmarks business_inquiries price_predictions; do
    count=$(psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null | tr -d ' ')
    if [ -n "$count" ]; then
        printf "  %-40s %5s rows\n" "$table" "$count"
    fi
done

echo ""
echo "========================================================="
echo "USERS DETAILS:"
echo "========================================================="

psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app -c "SELECT id, email, full_name, user_type, subscription_status, account_created_date FROM users ORDER BY id;" 2>/dev/null

echo ""
echo "========================================================="
echo "PROPERTIES DETAILS:"
echo "========================================================="

psql -h localhost -p 5433 -U thetmyatnoe -d fyp_app -c "SELECT id, title, property_type, city, asking_price, status FROM properties LIMIT 5;" 2>/dev/null

chmod +x view_database.sh
