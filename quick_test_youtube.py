#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick test để kiểm tra YouTube URLs API hoạt động
"""
import requests
import json

def quick_test():
    """Test nhanh API YouTube URLs"""

    print("🎥 QUICK TEST: YouTube URLs API")
    print("=" * 50)

    # Test với lesson ID mẫu (thay đổi theo lesson thật)
    lesson_id = "your_lesson_id_here"  # Thay bằng ID lesson thật

    # Test lấy danh sách YouTube URLs
    url = f"http://localhost:8000/api/lessons/{lesson_id}/youtube-urls"
    headers = {
        "Authorization": "Bearer your_token_here"  # Thay bằng token thật
    }

    print(f"Testing: GET {url}")

    try:
        response = requests.get(url, headers=headers, timeout=5)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ API hoạt động! Tìm thấy {len(data)} YouTube URLs")
            if data:
                for i, item in enumerate(data):
                    print(f"  {i+1}. {item.get('title', 'Untitled')} - {item['youtube_url']}")
            else:
                print("  📝 Chưa có YouTube URLs nào")
        elif response.status_code == 401:
            print("❌ Lỗi: Unauthorized - Cần token hợp lệ")
        elif response.status_code == 404:
            print("❌ Lỗi: Lesson không tồn tại hoặc sai lesson_id")
        else:
            print(f"❌ Lỗi: {response.status_code} - {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Lỗi: Không thể kết nối đến backend (có đang chạy không?)")
    except Exception as e:
        print(f"❌ Lỗi: {e}")

    print("\n💡 Để test đầy đủ:")
    print("1. python test_youtube_urls_api.py")
    print("2. Hoặc test qua UI trong browser")

if __name__ == "__main__":
    quick_test()
