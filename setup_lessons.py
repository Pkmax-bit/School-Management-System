import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
service_role_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

# Use service role key if available for admin tasks, otherwise try with anon key (might fail for bucket creation)
admin_key = service_role_key if service_role_key else key
supabase: Client = create_client(url, admin_key)

def setup_storage():
    print("Setting up Supabase Storage...")
    bucket_name = "lesson-materials"
    
    try:
        # Check if bucket exists
        buckets = supabase.storage.list_buckets()
        bucket_exists = False
        for bucket in buckets:
            if bucket.name == bucket_name:
                bucket_exists = True
                break
        
        if not bucket_exists:
            print(f"Creating bucket '{bucket_name}'...")
            supabase.storage.create_bucket(bucket_name, options={"public": True})
            print(f"Bucket '{bucket_name}' created successfully.")
        else:
            print(f"Bucket '{bucket_name}' already exists.")
            
    except Exception as e:
        print(f"Error setting up storage: {e}")

def setup_database():
    print("Setting up Database Schema...")
    
    # Read SQL file
    try:
        with open("lessons_schema.sql", "r", encoding="utf-8") as f:
            sql_content = f.read()
            
        # Supabase-py doesn't support direct SQL execution easily without extensions or RPC.
        # However, if we are using the postgres connection string we could use psycopg2 or similar.
        # But here we only have the HTTP client.
        # We can try to use the 'rpc' call if there is a function to exec sql, but usually there isn't one by default.
        
        print("IMPORTANT: Please run the SQL in 'lessons_schema.sql' in your Supabase SQL Editor.")
        print("Content of lessons_schema.sql:")
        print("-" * 20)
        print(sql_content)
        print("-" * 20)
        
    except Exception as e:
        print(f"Error reading SQL file: {e}")

if __name__ == "__main__":
    setup_storage()
    setup_database()
