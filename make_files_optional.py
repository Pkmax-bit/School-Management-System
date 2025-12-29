#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để cập nhật schema database để cho phép file_url và file_name là optional
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables from backend/.env if exists
backend_env = Path("backend/.env")
if backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()  # Try root .env

# Try to import psycopg2
try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("❌ Cần cài đặt psycopg2:")
    print("   pip install psycopg2-binary")
    sys.exit(1)

def get_database_connection():
    """Lấy connection string từ environment variables"""
    # Try DATABASE_URL first
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        # Nếu DATABASE_URL có db.okauzglpkrdatujkqczc, thử dùng direct connection
        if "db.okauzglpkrdatujkqczc" in database_url:
            # Sử dụng direct connection với port 5432
            # Format: postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
            return database_url  # Giữ nguyên DATABASE_URL từ .env
        return database_url

    # Fallback: thử tạo từ project ref
    supabase_url = os.getenv("SUPABASE_URL", "")
    if "okauzglpkrdatujkqczc" in supabase_url:
        project_ref = "okauzglpkrdatujkqczc"
        db_password = os.getenv("DB_PASSWORD", "150819Kt")
        # Direct connection
        return f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"

    # Fallback to individual components
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT", "5432")  # Direct connection port
    db_name = os.getenv("DB_NAME", "postgres")
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD")

    if not db_password:
        raise ValueError(
            "Cần cấu hình DATABASE_URL hoặc DB_PASSWORD trong .env file"
        )

    if not db_host:
        raise ValueError(
            "Cần cấu hình DATABASE_URL hoặc DB_HOST trong .env file"
        )

    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

def read_sql_file(file_path: str) -> str:
    """Đọc nội dung SQL file"""
    sql_file = Path(file_path)
    if not sql_file.exists():
        raise FileNotFoundError(f"Không tìm thấy file: {file_path}")

    with open(sql_file, "r", encoding="utf-8") as f:
        return f.read()

def execute_sql(connection_string: str, sql_content: str):
    """Thực thi SQL trên Supabase database"""
    print("=" * 60)
    print("🔧 CẬP NHẬT SCHEMA LESSONS - FILE OPTIONAL")
    print("=" * 60)

    try:
        # Kết nối database
        print("\n📡 Đang kết nối đến Supabase database...")
        conn = psycopg2.connect(connection_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        print("✅ Kết nối thành công!")

        # Chia SQL thành các câu lệnh riêng biệt
        # Loại bỏ comments và chia theo dấu chấm phẩy
        sql_statements = []
        current_statement = []

        for line in sql_content.split('\n'):
            # Bỏ qua comment lines
            stripped = line.strip()
            if stripped.startswith('--') or not stripped:
                continue

            current_statement.append(line)

            # Nếu dòng kết thúc bằng ;, đó là kết thúc của một statement
            if stripped.endswith(';'):
                statement = '\n'.join(current_statement)
                if statement.strip():
                    sql_statements.append(statement)
                current_statement = []

        # Thêm statement cuối cùng nếu có
        if current_statement:
            statement = '\n'.join(current_statement)
            if statement.strip():
                sql_statements.append(statement)

        print(f"\n📝 Tìm thấy {len(sql_statements)} câu lệnh SQL")
        print("\n🔄 Đang thực thi...\n")

        # Thực thi từng statement
        success_count = 0
        error_count = 0

        for i, statement in enumerate(sql_statements, 1):
            try:
                # In statement ngắn gọn (chỉ dòng đầu)
                first_line = statement.split('\n')[0].strip()[:60]
                print(f"  [{i}/{len(sql_statements)}] {first_line}...")

                cursor.execute(statement)
                success_count += 1
                print(f"      ✅ Thành công")
            except Exception as e:
                error_count += 1
                error_msg = str(e).split('\n')[0]  # Chỉ lấy dòng đầu của error
                print(f"      ❌ Lỗi: {error_msg}")
                # Không dừng lại, tiếp tục với các statement khác

        # Đóng connection
        cursor.close()
        conn.close()

        # Tóm tắt kết quả
        print("\n" + "=" * 60)
        print("📊 KẾT QUẢ")
        print("=" * 60)
        print(f"✅ Thành công: {success_count}/{len(sql_statements)}")
        if error_count > 0:
            print(f"❌ Lỗi: {error_count}/{len(sql_statements)}")
        print("=" * 60)

        if error_count == 0:
            print("\n🎉 Hoàn thành! File fields giờ đã optional trong bảng lessons!")
        else:
            print(f"\n⚠️  Có {error_count} lỗi xảy ra. Vui lòng kiểm tra lại.")

    except psycopg2.Error as e:
        print(f"\n❌ Lỗi database: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        sys.exit(1)

def main():
    """Main function"""
    try:
        # Đọc SQL file
        sql_file = "make_files_optional.sql"
        print(f"📖 Đang đọc file: {sql_file}")
        sql_content = read_sql_file(sql_file)
        print(f"✅ Đã đọc {len(sql_content)} ký tự")

        # Lấy connection string
        connection_string = get_database_connection()
        print(f"🔗 Connection string: {connection_string.split('@')[1] if '@' in connection_string else '***'}")

        # Thực thi SQL
        execute_sql(connection_string, sql_content)

    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"❌ {e}")
        print("\n💡 Hướng dẫn:")
        print("   1. Đảm bảo file backend/.env tồn tại")
        print("   2. Cấu hình DATABASE_URL hoặc DB_HOST, DB_USER, DB_PASSWORD")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Lỗi không mong đợi: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
