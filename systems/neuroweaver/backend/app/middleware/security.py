"""
Security middleware for request validation
"""

import json
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import SecurityValidator

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security validation middleware"""
    
    async def dispatch(self, request: Request, call_next):
        # Validate request size
        if request.headers.get("content-length"):
            if int(request.headers["content-length"]) > 10_000_000:  # 10MB
                raise HTTPException(status_code=413, detail="Request too large")
        
        # Validate content type for POST requests
        if request.method == "POST":
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("application/json"):
                raise HTTPException(status_code=400, detail="Invalid content type")
        
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        return response