"""
Simple script to check Supabase Storage configuration
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def main():
    print("Checking Supabase Storage Configuration")
    print("=" * 50)

    # Check environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in environment")
        return

    print("OK: Environment variables configured")

    # Create Supabase client
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("OK: Supabase client created")
    except Exception as e:
        print(f"ERROR: Failed to create Supabase client: {e}")
        return

    # Check database connection
    try:
        response = supabase.table("classrooms").select("id").limit(1).execute()
        print("OK: Database connection works")
    except Exception as e:
        print(f"ERROR: Database connection failed: {e}")
        return

    # Check storage buckets
    print("\nChecking Storage Buckets:")
    try:
        buckets_result = supabase.storage.list_buckets()
        buckets = buckets_result if isinstance(buckets_result, list) else buckets_result.data

        bucket_names = [b.get('name') or b.get('id') for b in buckets]
        print(f"Found buckets: {bucket_names}")

        required_buckets = ["Assignments", "lesson-materials"]
        missing = [b for b in required_buckets if b not in bucket_names]

        if missing:
            print(f"ERROR: Missing buckets: {missing}")
        else:
            print("OK: All required buckets exist")

    except Exception as e:
        print(f"ERROR: Failed to check buckets: {e}")
        return

    # Test upload to Assignments bucket
    print("\nTesting upload to Assignments bucket:")
    test_file = b"Test file content"
    test_path = "test_permissions.txt"

    try:
        upload_result = supabase.storage.from_("Assignments").upload(
            test_path,
            test_file,
            {"content-type": "text/plain"}
        )

        if hasattr(upload_result, 'error') and upload_result.error:
            print(f"ERROR: Upload failed: {upload_result.error}")
        else:
            print("OK: Upload successful")

            # Try to get public URL
            try:
                public_url = supabase.storage.from_("Assignments").get_public_url(test_path)
                if public_url:
                    print("OK: Public URL generated")
                else:
                    print("WARNING: No public URL generated")
            except Exception as e:
                print(f"WARNING: Failed to get public URL: {e}")

            # Cleanup
            try:
                supabase.storage.from_("Assignments").remove([test_path])
                print("OK: Test file cleaned up")
            except Exception as e:
                print(f"WARNING: Failed to cleanup test file: {e}")

    except Exception as e:
        print(f"ERROR: Upload test failed: {e}")

    # Test upload to lesson-materials bucket
    print("\nTesting upload to lesson-materials bucket:")
    try:
        upload_result = supabase.storage.from_("lesson-materials").upload(
            test_path,
            test_file,
            {"content-type": "text/plain"}
        )

        if hasattr(upload_result, 'error') and upload_result.error:
            print(f"ERROR: Upload failed: {upload_result.error}")
        else:
            print("OK: Upload successful")

            # Try to get public URL
            try:
                public_url = supabase.storage.from_("lesson-materials").get_public_url(test_path)
                if public_url:
                    print("OK: Public URL generated")
                else:
                    print("WARNING: No public URL generated")
            except Exception as e:
                print(f"WARNING: Failed to get public URL: {e}")

            # Cleanup
            try:
                supabase.storage.from_("lesson-materials").remove([test_path])
                print("OK: Test file cleaned up")
            except Exception as e:
                print(f"WARNING: Failed to cleanup test file: {e}")

    except Exception as e:
        print(f"ERROR: Upload test failed: {e}")

    print("\n" + "=" * 50)
    print("If uploads are failing, you need to configure RLS policies.")
    print("Run the SQL setup script in Supabase Dashboard > SQL Editor")

if __name__ == "__main__":
    main()
