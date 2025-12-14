"""
HTTP Cache Headers Middleware
Adds cache headers to responses for better performance
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time

class CacheHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Cache static assets for 1 year
        if request.url.path.startswith("/static/") or request.url.path.startswith("/_next/static/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            response.headers["ETag"] = f'"{int(time.time())}"'
        
        # Cache API GET responses for 60 seconds
        elif request.method == "GET" and request.url.path.startswith("/api/"):
            # Don't cache auth endpoints
            if "/api/auth/" not in request.url.path:
                response.headers["Cache-Control"] = "public, max-age=60"
                response.headers["Vary"] = "Accept, Authorization"
        
        # No cache for POST, PUT, DELETE
        elif request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        return response

