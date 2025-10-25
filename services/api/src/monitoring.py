"""
Performance and Health Monitoring Scaffold
"""

import logging


class Monitor:
    def __init__(self):
        self.logger = logging.getLogger("backend.monitor")

    def log_performance(self, endpoint: str, elapsed: float):
        self.logger.info(f"Endpoint {endpoint} took {elapsed:.3f}s")

    def log_health(self, status: str):
        self.logger.info(f"Health status: {status}")


monitor = Monitor()
