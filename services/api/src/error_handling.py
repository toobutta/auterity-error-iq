"""
Centralized Error Handling for Backend
"""

import logging


class ErrorHandler:
    def __init__(self):
        self.logger = logging.getLogger("backend.error")

    def log_error(self, error: Exception, context: dict = None):
        self.logger.error(f"Error: {error}", extra={"context": context})

    def handle(self, error: Exception, context: dict = None):
        self.log_error(error, context)
        # Add recovery/fallback logic here
        return {"error": str(error), "recovered": False}


error_handler = ErrorHandler()
