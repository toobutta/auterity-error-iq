"""Error handling and retry logic for workflow execution."""

import asyncio
import logging

from app.types.workflow import RetryConfig, WorkflowNode


class ErrorHandler:
    """Handles errors and retry logic for workflow steps."""

    def __init__(self, retry_config: RetryConfig):
        self.retry_config = retry_config
        self.logger = logging.getLogger(__name__)

    async def handle_step_error(
        self, error: Exception, node: WorkflowNode, attempt: int
    ) -> bool:
        """Return True if step should be retried."""
        if attempt >= self.retry_config.max_attempts:
            return False

        if self.retry_config.retryable_errors:
            error_type = type(error).__name__
            if error_type not in self.retry_config.retryable_errors:
                return False

        # Calculate delay with exponential backoff
        delay = self.retry_config.delay_seconds * (
            self.retry_config.backoff_multiplier ** (attempt - 1)
        )
        await asyncio.sleep(delay)

        return True
