"""
Rate limiting for API endpoints
"""

import time
from collections import defaultdict, deque
from typing import Dict

from fastapi import HTTPException, Request


class RateLimiter:
    """Simple in-memory rate limiter"""

    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)

    def is_allowed(self, key: str, limit: int = 100, window: int = 3600) -> bool:
        """Check if request is allowed within rate limit"""
        now = time.time()

        # Clean old requests
        while self.requests[key] and self.requests[key][0] < now - window:
            self.requests[key].popleft()

        # Check limit
        if len(self.requests[key]) >= limit:
            return False

        # Add current request
        self.requests[key].append(now)
        return True

    def check_rate_limit(
        self, request: Request, limit: int = 100, window: int = 3600
    ) -> None:
        """FastAPI dependency for rate limiting"""
        client_ip = request.client.host if request.client else "unknown"

        if not self.is_allowed(client_ip, limit, window):
            oldest = self.requests[client_ip][0] if self.requests[client_ip] else time.time()
            retry_after = int(window - (time.time() - oldest))
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": limit,
                    "window": window,
                },
                headers={"Retry-After": str(max(retry_after, 0))},
            )


# Global instance
rate_limiter = RateLimiter()
