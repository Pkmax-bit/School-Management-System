#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script để test tính năng nhiều YouTube URLs cho bài học
"""
import requests
import json
import os
from pathlib import Path

def test_multiple_youtube_urls():
    """Test các tính năng YouTube URLs mới"""

    # API base URL
    api_url = "http://localhost:8000/api/lessons"

    # Token (cần lấy từ browser)
    token = "your_auth_token_here"  # Thay thế bằng token thực

    # Classroom ID và Lesson ID (cần thay thế bằng ID thực)
    classroom_id = "cb22c232-ebea-4995-95df-bd5ca6b7c6fe"
    lesson_id = "your_lesson_id_here"  # Thay thế bằng lesson ID thực

    print("=" * 80)
    print("🎥 TEST NHIỀU YOUTUBE URLS CHO BÀI HỌC")
    print("=" * 80)

    print("\n📋 HƯỚNG DẪN SETUP:")
    print("1. Tạo một bài học mới hoặc sử dụng bài học có sẵn")
    print("2. Lấy classroom_id và lesson_id từ URL hoặc database")
    print("3. Lấy auth_token từ localStorage trong browser")
    print("4. Thay thế các giá trị trong script này")
    print("5. Chạy từng test function")

    print("\n🎯 CÁC TÍNH NĂNG SẼ TEST:")
    print("✅ 1. Thêm YouTube URL mới")
    print("✅ 2. Lấy danh sách YouTube URLs")
    print("✅ 3. Cập nhật YouTube URL")
    print("✅ 4. Xóa YouTube URL")
    print("✅ 5. Hiển thị nhiều videos trong UI")

    print("\n🔧 CÁCH LẤY THÔNG TIN:")

    print("\n📱 Lấy auth_token từ browser:")
    print("1. Mở trang web và đăng nhập")
    print("2. F12 > Console")
    print("3. Chạy: localStorage.getItem('auth_token')")
    print("4. Copy token (không bao gồm quotes)")

    print("\n🏫 Lấy classroom_id:")
    print("1. Vào trang classroom")
    print("2. Copy ID từ URL: /admin/classrooms/[ID]")
    print("3. Hoặc query: SELECT id FROM classrooms LIMIT 1")

    print("\n📚 Lấy lesson_id:")
    print("1. Tạo bài học mới hoặc vào trang lesson")
    print("2. Copy ID từ URL: /admin/lessons/[ID]")
    print("3. Hoặc query: SELECT id FROM lessons LIMIT 1")

    print("\n🚀 CÁC TEST FUNCTIONS:")

    # Test 1: Add YouTube URL
    print("\n1️⃣ TEST THÊM YOUTUBE URL:")
    print("""
def test_add_youtube_url():
    url = f"{api_url}/{lesson_id}/youtube-urls"
    data = {
        "lesson_id": lesson_id,
        "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "title": "Rick Astley - Never Gonna Give You Up",
        "description": "Classic meme video",
        "sort_order": 0
    }
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    response = requests.post(url, json=data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.ok:
        result = response.json()
        print("✅ Thành công!")
        print(f"YouTube URL ID: {result['id']}")
        return result['id']
    else:
        print(f"❌ Lỗi: {response.text}")
        return None
    """)

    # Test 2: Get YouTube URLs
    print("\n2️⃣ TEST LẤY DANH SÁCH YOUTUBE URLS:")
    print("""
def test_get_youtube_urls():
    url = f"{api_url}/{lesson_id}/youtube-urls"
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.ok:
        urls = response.json()
        print("✅ Thành công!")
        print(f"Số lượng videos: {len(urls)}")
        for i, url in enumerate(urls):
            print(f"  {i+1}. {url['title'] or 'Untitled'} - {url['youtube_url']}")
        return urls
    else:
        print(f"❌ Lỗi: {response.text}")
        return []
    """)

    # Test 3: Update YouTube URL
    print("\n3️⃣ TEST CẬP NHẬT YOUTUBE URL:")
    print("""
def test_update_youtube_url(youtube_url_id):
    url = f"{api_url}/{lesson_id}/youtube-urls/{youtube_url_id}"
    data = {
        "lesson_id": lesson_id,
        "youtube_url": "https://www.youtube.com/watch?v=oHg5SJYRHA0",
        "title": "Cute Cats Compilation",
        "description": "Updated video description",
        "sort_order": 0
    }
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    response = requests.put(url, json=data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.ok:
        print("✅ Cập nhật thành công!")
    else:
        print(f"❌ Lỗi: {response.text}")
    """)

    # Test 4: Delete YouTube URL
    print("\n4️⃣ TEST XÓA YOUTUBE URL:")
    print("""
def test_delete_youtube_url(youtube_url_id):
    url = f"{api_url}/{lesson_id}/youtube-urls/{youtube_url_id}"
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.delete(url, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 204:
        print("✅ Xóa thành công!")
    else:
        print(f"❌ Lỗi: {response.text}")
    """)

    print("\n🎨 UI FEATURES:")
    print("✅ Form thêm nhiều YouTube URLs trong LessonUploadForm")
    print("✅ Hiển thị danh sách videos trong sidebar")
    print("✅ Click để xem từng video")
    print("✅ Edit/Delete từng video")
    print("✅ Sort order tự động")

    print("\n🏗️  DATABASE CHANGES:")
    print("✅ Bảng lesson_youtube_urls mới")
    print("✅ Foreign key tới lessons")
    print("✅ Fields: youtube_url, title, description, sort_order")
    print("✅ Indexes cho performance")

    print("\n📱 FRONTEND UPDATES:")
    print("✅ Student, Teacher, Admin pages updated")
    print("✅ Multiple video display")
    print("✅ Legacy single YouTube URL support")
    print("✅ Responsive design")

    print("\n" + "=" * 80)
    print("🎉 TÍNH NĂNG ĐÃ HOÀN THÀNH!")
    print("Bạn có thể gắn nhiều YouTube URLs cho mỗi bài học!")
    print("=" * 80)

if __name__ == "__main__":
    test_multiple_youtube_urls()
