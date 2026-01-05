"""
Test upload functionality after fixing storage policies
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def test_upload():
    print("Testing upload after storage policy fix")
    print("=" * 50)

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        print("ERROR: Missing environment variables")
        return

    try:
        supabase = create_client(supabase_url, supabase_key)
        print("OK: Connected to Supabase")
    except Exception as e:
        print(f"ERROR: Failed to connect: {e}")
        return

    # Test upload to Assignments bucket
    print("\nTesting upload to Assignments bucket:")
    test_content = b"This is a test file to verify upload works after policy fix"
    test_path = "test_upload_fix.txt"

    try:
        result = supabase.storage.from_("Assignments").upload(
            test_path,
            test_content,
            {"content-type": "text/plain"}
        )

        if hasattr(result, 'error') and result.error:
            print(f"ERROR: Upload failed: {result.error}")
            return False
        else:
            print("SUCCESS: File uploaded to Assignments bucket")

            # Get public URL
            try:
                public_url = supabase.storage.from_("Assignments").get_public_url(test_path)
                if public_url:
                    print(f"SUCCESS: Public URL generated: {public_url}")
                else:
                    print("WARNING: No public URL generated")
            except Exception as e:
                print(f"WARNING: Failed to get public URL: {e}")

    except Exception as e:
        print(f"ERROR: Upload exception: {e}")
        return False

    # Test upload to lesson-materials bucket
    print("\nTesting upload to lesson-materials bucket:")
    try:
        result = supabase.storage.from_("lesson-materials").upload(
            test_path,
            test_content,
            {"content-type": "text/plain"}
        )

        if hasattr(result, 'error') and result.error:
            print(f"ERROR: Upload failed: {result.error}")
            return False
        else:
            print("SUCCESS: File uploaded to lesson-materials bucket")

            # Get public URL
            try:
                public_url = supabase.storage.from_("lesson-materials").get_public_url(test_path)
                if public_url:
                    print(f"SUCCESS: Public URL generated: {public_url}")
                else:
                    print("WARNING: No public URL generated")
            except Exception as e:
                print(f"WARNING: Failed to get public URL: {e}")

    except Exception as e:
        print(f"ERROR: Upload exception: {e}")
        return False

    # Cleanup test files
    print("\nCleaning up test files:")
    try:
        supabase.storage.from_("Assignments").remove([test_path])
        print("OK: Cleaned up Assignments test file")
    except Exception as e:
        print(f"WARNING: Failed to cleanup Assignments file: {e}")

    try:
        supabase.storage.from_("lesson-materials").remove([test_path])
        print("OK: Cleaned up lesson-materials test file")
    except Exception as e:
        print(f"WARNING: Failed to cleanup lesson-materials file: {e}")

    print("\n" + "=" * 50)
    print("SUCCESS: Upload functionality is working!")
    print("You can now upload files in the School Management System.")
    print("=" * 50)
    return True

if __name__ == "__main__":
    test_upload()




