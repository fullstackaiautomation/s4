#!/usr/bin/env python3
"""
Setup All Time Sales Table in Supabase
Uses PostgreSQL connection string to create schema
"""

import psycopg2
from psycopg2 import sql
import os

# Connection details - use host, user, password separately to avoid encoding issues
DB_HOST = "tcryasuisocelektmrmb.db.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Gr@ssm1ck123"
DB_PORT = 5432

def create_schema():
    """Create all_time_sales table and views"""
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cursor = conn.cursor()

        print("Connected to Supabase")

        # Read SQL schema
        with open(r"c:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\all_time_sales_schema.sql", 'r', encoding='utf-8') as f:
            sql_content = f.read()

        # Execute the entire SQL file
        cursor.execute(sql_content)
        conn.commit()

        print("Schema created successfully!")

        # Verify table was created
        cursor.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'all_time_sales');")
        exists = cursor.fetchone()[0]

        if exists:
            print("✓ Table 'all_time_sales' created successfully")
        else:
            print("⚠ Table creation may have failed")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")
        return False

    return True

if __name__ == "__main__":
    create_schema()
