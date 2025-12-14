"""
Audit Middleware
Middleware để tự động log các hành động vào audit_logs
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
from typing import Callable
import json
import time
from datetime import datetime
from supabase import Client
from database import get_db

class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware để log các request vào audit_logs"""
    
    def __init__(self, app, supabase: Client):
        super().__init__(app)
        self.supabase = supabase
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Bỏ qua một số endpoints không cần log
        skip_paths = ['/health', '/api/health', '/docs', '/openapi.json', '/redoc']
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Chỉ log các method quan trọng
        if request.method not in ['POST', 'PUT', 'DELETE', 'PATCH']:
            return await call_next(request)
        
        start_time = time.time()
        
        # Lấy thông tin user từ request (nếu có)
        user_id = None
        try:
            # Lấy token từ header
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.replace('Bearer ', '')
                # Decode token để lấy user_id (simplified - trong thực tế cần verify token)
                # Tạm thời để None, sẽ được set trong router nếu cần
                pass
        except:
            pass
        
        # Lấy request body (nếu có)
        request_body = None
        try:
            if request.method in ['POST', 'PUT', 'PATCH']:
                body = await request.body()
                if body:
                    request_body = json.loads(body.decode())
        except:
            pass
        
        # Gọi next middleware/handler
        response = await call_next(request)
        
        # Tính thời gian xử lý
        process_time = int((time.time() - start_time) * 1000)
        
        # Xác định action và resource_type từ path
        path = request.url.path
        method = request.method
        
        action = None
        resource_type = None
        
        # Parse path để xác định resource_type
        if '/api/teachers' in path:
            resource_type = 'teachers'
        elif '/api/students' in path:
            resource_type = 'students'
        elif '/api/subjects' in path:
            resource_type = 'subjects'
        elif '/api/classrooms' in path:
            resource_type = 'classrooms'
        elif '/api/finances' in path:
            resource_type = 'finances'
        elif '/api/assignments' in path:
            resource_type = 'assignments'
        elif '/api/attendances' in path:
            resource_type = 'attendances'
        elif '/api/auth' in path:
            resource_type = 'auth'
            if 'login' in path:
                action = 'login'
            elif 'logout' in path:
                action = 'logout'
        else:
            resource_type = 'other'
        
        # Xác định action từ method
        if not action:
            if method == 'POST':
                action = 'create'
            elif method == 'PUT' or method == 'PATCH':
                action = 'update'
            elif method == 'DELETE':
                action = 'delete'
        
        # Lấy resource_id từ path (nếu có)
        resource_id = None
        path_parts = path.strip('/').split('/')
        for i, part in enumerate(path_parts):
            if part in ['teachers', 'students', 'subjects', 'classrooms', 'finances', 'assignments', 'attendances']:
                if i + 1 < len(path_parts):
                    potential_id = path_parts[i + 1]
                    # Kiểm tra xem có phải UUID không (simplified check)
                    if len(potential_id) > 20:
                        resource_id = potential_id
                        break
        
        # Lấy response body (nếu có)
        response_body = None
        try:
            if hasattr(response, 'body'):
                body_bytes = b''
                async for chunk in response.body_iterator:
                    body_bytes += chunk
                if body_bytes:
                    response_body = json.loads(body_bytes.decode())
                # Tạo lại response với body
                response = Response(
                    content=body_bytes,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )
        except:
            pass
        
        # Log vào audit_logs (async, không block response)
        try:
            log_data = {
                'user_id': user_id,
                'action': action,
                'resource_type': resource_type,
                'resource_id': resource_id,
                'old_values': None,  # Có thể lấy từ database nếu là update/delete
                'new_values': request_body if request_body else None,
                'ip_address': request.client.host if request.client else None,
                'user_agent': request.headers.get('user-agent'),
                'request_method': method,
                'request_path': path,
                'status_code': response.status_code,
                'error_message': None,
                'created_at': datetime.now().isoformat()
            }
            
            # Insert vào database (async, không await để không block)
            # Trong production nên dùng background task
            try:
                self.supabase.table('audit_logs').insert(log_data).execute()
            except Exception as e:
                # Log error nhưng không fail request
                print(f"Error logging audit: {str(e)}")
        except Exception as e:
            # Không fail request nếu audit log fail
            print(f"Error in audit middleware: {str(e)}")
        
        return response

