#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script để test các API endpoints mới cho YouTube URLs
"""
import requests
import json
import time

def test_youtube_urls_api():
    """Test tất cả API endpoints cho YouTube URLs"""

    print("=" * 80)
    print("🎥 TEST API ENDPOINTS CHO YOUTUBE URLs")
    print("=" * 80)

    # API base URL
    base_url = "http://localhost:8000"

    # Auth token (cần thay thế bằng token thực từ browser)
    token = "your_auth_token_here"  # Thay thế bằng token thực

    # Classroom ID và Lesson ID (thay thế bằng ID thực)
    classroom_id = "your_classroom_id_here"
    lesson_id = "your_lesson_id_here"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n🔐 HƯỚNG DẪN SETUP:")
    print("1. Mở browser và đăng nhập admin/teacher")
    print("2. F12 > Console > localStorage.getItem('auth_token')")
    print("3. Copy token và thay thế 'your_auth_token_here'")
    print("4. Tạo 1 lesson và lấy lesson_id từ URL")
    print("5. Lấy classroom_id từ database hoặc URL")

    # Test 1: Thêm YouTube URL đầu tiên
    print("\n1️⃣ TEST THÊM YOUTUBE URL ĐẦU TIÊN")
    add_url = f"{base_url}/api/lessons/{lesson_id}/youtube-urls"

    data1 = {
        "lesson_id": lesson_id,
        "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Rick Astley - Never Gonna Give You Up",
        "description": "Classic meme video",
        "sort_order": 0
    }

    print(f"POST {add_url}")
    print(f"Data: {json.dumps(data1, indent=2)}")

    try:
        response = requests.post(add_url, json=data1, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            result1 = response.json()
            youtube_url_id1 = result1['id']
            print("✅ Thành công!")
            print(f"YouTube URL ID: {youtube_url_id1}")
            print(f"Title: {result1['title']}")
        else:
            print(f"❌ Lỗi: {response.text}")
            return
    except Exception as e:
        print(f"❌ Exception: {e}")
        return

    # Test 2: Thêm YouTube URL thứ hai
    print("\n2️⃣ TEST THÊM YOUTUBE URL THỨ HAI")
    data2 = {
        "lesson_id": lesson_id,
        "youtube_url": "https://www.youtube.com/watch?v=oHg5SJYRHA0",
        "title": "Cute Cats Compilation",
        "description": "Relaxing cat videos",
        "sort_order": 1
    }

    print(f"POST {add_url}")
    print(f"Data: {json.dumps(data2, indent=2)}")

    try:
        response = requests.post(add_url, json=data2, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            result2 = response.json()
            youtube_url_id2 = result2['id']
            print("✅ Thành công!")
            print(f"YouTube URL ID: {youtube_url_id2}")
            print(f"Title: {result2['title']}")
        else:
            print(f"❌ Lỗi: {response.text}")
            return
    except Exception as e:
        print(f"❌ Exception: {e}")
        return

    # Test 3: Lấy danh sách YouTube URLs
    print("\n3️⃣ TEST LẤY DANH SÁCH YOUTUBE URLs")
    get_url = f"{base_url}/api/lessons/{lesson_id}/youtube-urls"

    print(f"GET {get_url}")

    try:
        response = requests.get(get_url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            urls = response.json()
            print("✅ Thành công!")
            print(f"Tổng số videos: {len(urls)}")
            for i, url in enumerate(urls):
                print(f"  {i+1}. {url['title']} - {url['youtube_url']}")
        else:
            print(f"❌ Lỗi: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

    # Test 4: Cập nhật YouTube URL đầu tiên
    print("\n4️⃣ TEST CẬP NHẬT YOUTUBE URL")
    update_url = f"{base_url}/api/lessons/{lesson_id}/youtube-urls/{youtube_url_id1}"

    update_data = {
        "lesson_id": lesson_id,
        "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Rick Astley - Never Gonna Give You Up (Updated)",
        "description": "Classic meme video - Updated description",
        "sort_order": 0
    }

    print(f"PUT {update_url}")
    print(f"Data: {json.dumps(update_data, indent=2)}")

    try:
        response = requests.put(update_url, json=update_data, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            updated = response.json()
            print("✅ Thành công!")
            print(f"Updated title: {updated['title']}")
        else:
            print(f"❌ Lỗi: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

    # Test 5: Xóa YouTube URL thứ hai
    print("\n5️⃣ TEST XÓA YOUTUBE URL")
    delete_url = f"{base_url}/api/lessons/{lesson_id}/youtube-urls/{youtube_url_id2}"

    print(f"DELETE {delete_url}")

    try:
        response = requests.delete(delete_url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 204:
            print("✅ Xóa thành công!")
        else:
            print(f"❌ Lỗi: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

    # Test 6: Kiểm tra danh sách sau khi xóa
    print("\n6️⃣ TEST DANH SÁCH SAU KHI XÓA")
    try:
        response = requests.get(get_url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            urls = response.json()
            print("✅ Thành công!")
            print(f"Số videos còn lại: {len(urls)}")
            for i, url in enumerate(urls):
                print(f"  {i+1}. {url['title']} - {url['youtube_url']}")
        else:
            print(f"❌ Lỗi: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

    print("\n" + "=" * 80)
    print("🎉 HOÀN THÀNH TEST API YOUTUBE URLs!")
    print("Nếu tất cả đều ✅ thì tính năng đã hoạt động!")
    print("=" * 80)

if __name__ == "__main__":
    test_youtube_urls_api()
