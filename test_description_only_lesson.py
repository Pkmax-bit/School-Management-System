#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script để tạo bài học chỉ với tiêu đề và mô tả (không cần file hoặc YouTube)
"""
import os
import json
from pathlib import Path

def create_description_only_lesson():
    """Tạo bài học chỉ với mô tả"""

    # API endpoint
    api_url = "http://localhost:8000/api/lessons/upload"

    # Token (cần được set từ localStorage)
    token = "your_auth_token_here"  # Thay thế bằng token thực từ browser

    # Lesson data - chỉ có title và description
    lesson_data = {
        "classroom_id": "your_classroom_id_here",  # Thay thế bằng classroom ID thực
        "title": "Bài học chỉ với mô tả",
        "description": """
# Bài học về Lập trình Python

## Giới thiệu
Đây là bài học giới thiệu về lập trình Python dành cho người mới bắt đầu.

## Nội dung chính
1. **Cài đặt Python**: Hướng dẫn cài đặt Python trên máy tính
2. **Biến và kiểu dữ liệu**: Học về biến, số, chuỗi, list, dict
3. **Câu lệnh điều kiện**: if, elif, else
4. **Vòng lặp**: for và while loop
5. **Hàm**: Định nghĩa và sử dụng hàm

## Bài tập thực hành
- Viết chương trình tính tổng hai số
- Tạo danh sách và thực hiện các thao tác cơ bản
- Viết hàm kiểm tra số nguyên tố

## Tài liệu tham khảo
- Python Documentation: https://docs.python.org/3/
- W3Schools Python: https://www.w3schools.com/python/

*Lưu ý: Bài học này tập trung vào lý thuyết và hướng dẫn. Code mẫu sẽ được cung cấp trong bài học tiếp theo.*
        """,
        "sort_order": 1
    }

    print("=" * 60)
    print("TAO BAI HOC CHI VOI MO TA")
    print("=" * 60)

    print("\n📝 Dữ liệu bài học:")
    print(f"Title: {lesson_data['title']}")
    print(f"Description: {lesson_data['description'][:100]}...")
    print("Files: Không có")
    print("YouTube URL: Không có")
    print("\n🔄 Để test thực tế:")
    print("1. Mở browser và đăng nhập")
    print("2. Vào trang tạo bài học")
    print("3. Điền chỉ tiêu đề và mô tả (bỏ trống file và YouTube)")
    print("4. Submit và xem kết quả")

    print("\n✅ Validation backend sẽ cho phép:")
    print("- Không cần file")
    print("- Không cần YouTube URL")
    print("- Chỉ cần title và description")

if __name__ == "__main__":
    create_description_only_lesson()
