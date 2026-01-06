#!/usr/bin/env python3
"""
Test script to check Supabase client initialization
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

def test_supabase_client():
    """Test Supabase client creation"""
    load_dotenv()

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    print(f"SUPABASE_URL: {SUPABASE_URL}")
    print(f"SUPABASE_KEY: {'*' * len(SUPABASE_KEY) if SUPABASE_KEY else None}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY")
        return False

    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("SUCCESS: Supabase client created successfully")
        print(f"Client type: {type(client)}")
        return True
    except Exception as e:
        print(f"ERROR: Error creating Supabase client: {e}")
        print(f"Error type: {type(e)}")
        return False

if __name__ == "__main__":
    test_supabase_client()
