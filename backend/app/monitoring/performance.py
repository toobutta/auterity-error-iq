"""Performance monitoring for workflow execution."""

import asyncio
import logging
from contextlib import asynccontextmanager


class PerformanceMonitor:
    """Monitors performance of workflow step execution."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    @asynccontextmanager
    async def measure_step_execution(self, step_type: str, step_name: str):
        """Context manager to measure step execution time."""
        start_time = asyncio.get_event_loop().time()
        try:
            yield
            duration = asyncio.get_event_loop().time() - start_time
            self.logger.info(
                f"Step '{step_name}' ({step_type}) completed in {duration:.3f}s"
            )
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            self.logger.error(
                f"Step '{step_name}' ({step_type}) failed after {duration:.3f}s: {e}"
            )
            raise
