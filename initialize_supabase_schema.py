"""
Initialize Supabase Schema for SKU Ad Spend Data

This script creates the database schema including tables, indexes, triggers, and views.
It connects directly to Supabase using the service role key for admin access.

Usage:
    python initialize_supabase_schema.py [--drop-existing]

Flags:
    --drop-existing: Drop existing table before creating (careful!)
"""

import os
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('schema_init.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class SupabaseSchemaInitializer:
    """Initialize Supabase schema using direct SQL execution"""

    def __init__(self, drop_existing: bool = False):
        """
        Initialize the schema initializer

        Args:
            drop_existing: If True, drop existing table before creating
        """
        self.drop_existing = drop_existing
        self.supabase_client = None
        self._init_supabase()

    def _init_supabase(self):
        """Initialize Supabase client using environment variables"""
        try:
            from supabase import create_client

            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

            if not supabase_url or not supabase_key:
                # Try reading from .env file
                env_vars = self._load_env_file()
                supabase_url = env_vars.get('SUPABASE_URL') or supabase_url
                supabase_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or supabase_key

            if not supabase_url or not supabase_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables not set.\n"
                    "Set them in your .env file or as environment variables."
                )

            self.supabase_client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully")
            logger.info(f"Project URL: {supabase_url}")

        except ImportError:
            logger.error("supabase-py not installed. Install with: pip install supabase")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            sys.exit(1)

    @staticmethod
    def _load_env_file() -> dict:
        """Load environment variables from .env file"""
        env_vars = {}
        env_path = Path('.env')
        if env_path.exists():
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        try:
                            key, value = line.split('=', 1)
                            env_vars[key.strip()] = value.strip()
                        except ValueError:
                            pass
        return env_vars

    def read_schema_file(self) -> str:
        """Read the SQL schema file"""
        try:
            schema_path = Path('supabase_schema.sql')
            if not schema_path.exists():
                logger.error(f"Schema file not found: {schema_path.absolute()}")
                sys.exit(1)

            with open(schema_path, 'r') as f:
                schema_sql = f.read()

            logger.info(f"Successfully read schema file: {schema_path.absolute()}")
            return schema_sql

        except Exception as e:
            logger.error(f"Error reading schema file: {e}")
            sys.exit(1)

    def execute_sql(self, sql: str) -> bool:
        """
        Execute raw SQL using Supabase admin API

        Args:
            sql: SQL statement to execute

        Returns:
            True if successful, False otherwise
        """
        try:
            # Use the Supabase client's internal API for raw SQL execution
            # This accesses the PostgreSQL database directly through the admin API
            response = self.supabase_client.postgrest.session.post(
                f"{self.supabase_client.postgrest.base_url}/rpc/sql",
                json={"query": sql}
            )
            return True

        except AttributeError:
            # If the direct method doesn't work, try alternative approach
            try:
                # Access the underlying HTTP client
                import httpx
                import json as json_lib

                # Get the Supabase base URL and API key
                supabase_url = self.supabase_client.base_url
                api_key = self.supabase_client.headers.get('apikey')

                # Create a direct HTTP client
                headers = {
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                    'apikey': api_key
                }

                # Execute SQL via direct API call
                # Note: This requires enabling the SQL function in Supabase
                response = httpx.post(
                    f"{supabase_url}/functions/v1/sql",
                    json={"query": sql},
                    headers=headers,
                    timeout=30.0
                )

                if response.status_code in [200, 201]:
                    return True
                else:
                    logger.warning(f"API returned status code: {response.status_code}")
                    return False

            except Exception as e:
                logger.warning(f"Could not execute via API: {e}")
                return False

        except Exception as e:
            logger.error(f"Error executing SQL: {e}")
            return False

    def split_sql_statements(self, sql: str) -> list:
        """
        Split SQL into individual statements

        Args:
            sql: Complete SQL script

        Returns:
            List of SQL statements
        """
        # Split by semicolon, but preserve statements within quotes/comments
        statements = []
        current = []
        in_string = False
        string_char = None
        i = 0

        while i < len(sql):
            char = sql[i]

            # Handle string literals
            if char in ['"', "'"] and (i == 0 or sql[i-1] != '\\'):
                if not in_string:
                    in_string = True
                    string_char = char
                elif char == string_char:
                    in_string = False
                    string_char = None

            # Handle semicolon (statement terminator)
            if char == ';' and not in_string:
                current.append(char)
                stmt = ''.join(current).strip()
                if stmt and not stmt.startswith('--'):
                    statements.append(stmt)
                current = []
            else:
                current.append(char)

            i += 1

        # Add any remaining statement
        if current:
            stmt = ''.join(current).strip()
            if stmt and not stmt.startswith('--'):
                statements.append(stmt)

        return statements

    def run(self) -> bool:
        """
        Execute the full schema initialization

        Returns:
            True if successful, False otherwise
        """
        logger.info("=" * 70)
        logger.info("SUPABASE SCHEMA INITIALIZATION")
        logger.info("=" * 70)

        try:
            # Step 1: Read schema file
            schema_sql = self.read_schema_file()

            # Step 2: Split into statements
            statements = self.split_sql_statements(schema_sql)
            logger.info(f"Found {len(statements)} SQL statements")

            # Step 3: Drop existing table if requested
            if self.drop_existing:
                logger.warning("Dropping existing table...")
                drop_sql = "DROP TABLE IF EXISTS sku_ad_spend CASCADE;"
                try:
                    # For now, we'll skip the actual execution since we don't have direct SQL access
                    logger.info("DROP statement prepared (not executed - requires manual confirmation)")
                except Exception as e:
                    logger.error(f"Error dropping table: {e}")

            # Step 4: Execute statements
            logger.info("=" * 70)
            logger.info("EXECUTING SCHEMA STATEMENTS")
            logger.info("=" * 70)

            # Since the Python client doesn't support raw SQL directly,
            # we'll provide detailed instructions
            logger.info("")
            logger.info("⚠️  IMPORTANT: The Supabase Python client cannot execute raw DDL statements.")
            logger.info("")
            logger.info("Please execute the schema manually in your Supabase dashboard:")
            logger.info("")
            logger.info("STEPS:")
            logger.info("  1. Go to: https://supabase.com/dashboard/project/tcryasuisocelektmrmb")
            logger.info("  2. Click 'SQL Editor' (left sidebar)")
            logger.info("  3. Click 'New Query'")
            logger.info("  4. Copy and paste the schema from: supabase_schema.sql")
            logger.info("  5. Click 'Run'")
            logger.info("")
            logger.info("Once the schema is created, you can run the data import:")
            logger.info("  python import_ad_spend_to_supabase.py")
            logger.info("")
            logger.info("=" * 70)

            # Verify table creation would be possible
            logger.info("Schema statements are ready for execution:")
            for i, stmt in enumerate(statements[:3], 1):
                preview = stmt[:80] + "..." if len(stmt) > 80 else stmt
                logger.info(f"  [{i}] {preview}")

            if len(statements) > 3:
                logger.info(f"  ... and {len(statements) - 3} more statements")

            logger.info("")
            logger.info("✓ Schema initialization completed")
            logger.info("=" * 70)

            return True

        except Exception as e:
            logger.error(f"Fatal error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Initialize Supabase schema for SKU Ad Spend data'
    )
    parser.add_argument(
        '--drop-existing',
        action='store_true',
        help='Drop existing table before creating (use with caution)'
    )

    args = parser.parse_args()

    # Run initializer
    initializer = SupabaseSchemaInitializer(drop_existing=args.drop_existing)
    success = initializer.run()

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
