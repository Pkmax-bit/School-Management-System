#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script để tạo bài học chỉ với YouTube URL (không có file)
"""
import requests
import json
import os

def test_create_youtube_only_lesson():
    """Test tạo bài học chỉ với YouTube URL"""

    # API endpoint
    api_url = "http://localhost:8000/api/lessons/upload"

    # Token (cần được set từ localStorage của browser)
    # Bạn có thể lấy token từ browser console: localStorage.getItem('auth_token')
    token = "your_auth_token_here"  # Thay thế bằng token thực

    # Classroom ID (từ URL hoặc database)
    classroom_id = "cb22c232-ebea-4995-95df-bd5ca6b7c6fe"  # Thay thế bằng classroom ID thực

    # Tạo FormData tương tự như frontend
    import io

    # Tạo multipart form data
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    data = []

    # Thêm các field
    fields = {
        'classroom_id': classroom_id,
        'title': 'Test YouTube Only Lesson',
        'description': 'Bài học chỉ có YouTube video, không có file đính kèm',
        'youtube_url': 'https://www.youtube.com/watch?v=E733Wtwl9lk',
        'sort_order': '1'
    }

    for key, value in fields.items():
        data.append(f'--{boundary}')
        data.append(f'Content-Disposition: form-data; name="{key}"')
        data.append('')
        data.append(str(value))

    # Kết thúc multipart
    data.append(f'--{boundary}--')
    data.append('')

    body = '\r\n'.join(data)

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }

    print("=" * 60)
    print("TEST TAO BAI HOC CHI VOI YOUTUBE URL")
    print("=" * 60)

    print("\nDu lieu gui:")
    for key, value in fields.items():
        print(f"  {key}: {value}")

    print("\nHeaders:")
    print(f"  Authorization: Bearer {token[:20]}...")
    print(f"  Content-Type: multipart/form-data")

    print("\nDang gui request...")

    try:
        response = requests.post(api_url, data=body, headers=headers)

        print(f"\nResponse Status: {response.status_code}")

        if response.status_code == 200:
            print("✅ Thanh cong!")
            result = response.json()
            print(f"Lesson ID: {result.get('id')}")
            print(f"Title: {result.get('title')}")
            print(f"YouTube URL: {result.get('youtube_url')}")
            print(f"File URL: {result.get('file_url')}")
        else:
            print("❌ That bai!")
            print(f"Error: {response.text}")

    except Exception as e:
        print(f"❌ Loi: {str(e)}")

    print("\nHUONG DAN LAY TOKEN:")
    print("1. Mo browser, dang nhap vao admin/teacher")
    print("2. Mo Developer Tools (F12)")
    print("3. Chay lenh: localStorage.getItem('auth_token')")
    print("4. Copy token va thay the vao bien token trong script")

    print("\nHUONG DAN LAY CLASSROOM_ID:")
    print("1. Vao trang classroom")
    print("2. Copy ID tu URL")
    print("3. Hoac query database: SELECT id FROM classrooms LIMIT 1")

if __name__ == "__main__":
    test_create_youtube_only_lesson()
