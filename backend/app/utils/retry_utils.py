"""Retry and error recovery utilities for backend services."""

import asyncio
import logging
import random
import time
from datetime import datetime
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Type

from app.exceptions import (
    AIServiceError,
    BaseAppException,
    DatabaseError,
    ErrorCategory,
    ExternalAPIError,
)

logger = logging.getLogger(__name__)


class CircuitBreakerState(str, Enum):
    """Circuit breaker states."""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class RetryConfig:
    """Configuration for retry mechanisms."""

    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_backoff: bool = True,
        jitter: bool = True,
        retry_exceptions: Optional[List[Type[Exception]]] = None,
        stop_exceptions: Optional[List[Type[Exception]]] = None,
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_backoff = exponential_backoff
        self.jitter = jitter
        self.retry_exceptions = retry_exceptions or []
        self.stop_exceptions = stop_exceptions or []


def get_default_retry_config(category: ErrorCategory) -> RetryConfig:
    """Get default retry configuration for different error categories."""

    if category == ErrorCategory.AI_SERVICE:
        return RetryConfig(
            max_attempts=3,
            base_delay=2.0,
            max_delay=30.0,
            retry_exceptions=[AIServiceError, ConnectionError, TimeoutError],
            stop_exceptions=[ValueError, TypeError],
        )

    elif category == ErrorCategory.DATABASE:
        return RetryConfig(
            max_attempts=2,
            base_delay=1.0,
            max_delay=10.0,
            retry_exceptions=[DatabaseError, ConnectionError],
            stop_exceptions=[ValueError],
        )

    elif category == ErrorCategory.EXTERNAL_API:
        return RetryConfig(
            max_attempts=5,
            base_delay=0.5,
            max_delay=15.0,
            retry_exceptions=[ExternalAPIError, ConnectionError, TimeoutError],
        )

    else:
        return RetryConfig(
            max_attempts=3,
            base_delay=1.0,
            max_delay=10.0,
        )


def calculate_delay(
    attempt: int,
    base_delay: float,
    max_delay: float,
    exponential_backoff: bool = True,
    jitter: bool = True,
) -> float:
    """Calculate delay with exponential backoff and jitter."""

    if exponential_backoff:
        delay = base_delay * (2 ** (attempt - 1))
    else:
        delay = base_delay

    # Apply maximum delay limit
    delay = min(delay, max_delay)

    # Add jitter to prevent thundering herd
    if jitter:
        delay = delay * (0.5 + random.random() * 0.5)

    return delay


def should_retry_exception(
    exception: Exception,
    retry_exceptions: List[Type[Exception]],
    stop_exceptions: List[Type[Exception]],
) -> bool:
    """Determine if an exception should trigger a retry."""

    # Never retry stop exceptions
    for stop_exc in stop_exceptions:
        if isinstance(exception, stop_exc):
            return False

    # If retry exceptions are specified, only retry those
    if retry_exceptions:
        for retry_exc in retry_exceptions:
            if isinstance(exception, retry_exc):
                return True
        return False

    # Default: retry BaseAppException with retryable=True
    if isinstance(exception, BaseAppException):
        return exception.retryable

    return False


async def retry_async(
    func: Callable,
    config: Optional[RetryConfig] = None,
    context: Optional[Dict[str, Any]] = None,
    *args,
    **kwargs,
) -> Any:
    """Retry an async function with configurable backoff."""

    if config is None:
        config = RetryConfig()

    context = context or {}
    last_exception = None

    for attempt in range(1, config.max_attempts + 1):
        try:
            result = await func(*args, **kwargs)

            if attempt > 1:
                logger.info(
                    f"Function {func.__name__} succeeded after {attempt} attempts",
                    extra={
                        "function": func.__name__,
                        "attempt": attempt,
                        "max_attempts": config.max_attempts,
                        **context,
                    },
                )

            return result

        except Exception as e:
            last_exception = e

            # Check if we should retry this exception
            if not should_retry_exception(
                e, config.retry_exceptions, config.stop_exceptions
            ):
                logger.warning(
                    f"Exception {type(e).__name__} is not retryable, failing immediately",
                    extra={
                        "function": func.__name__,
                        "exception": str(e),
                        "attempt": attempt,
                        **context,
                    },
                )
                raise

            # If this was the last attempt, don't retry
            if attempt == config.max_attempts:
                logger.error(
                    f"Function {func.__name__} failed after {config.max_attempts} attempts",
                    extra={
                        "function": func.__name__,
                        "exception": str(e),
                        "attempt": attempt,
                        "max_attempts": config.max_attempts,
                        **context,
                    },
                )
                raise

            # Calculate delay and wait
            delay = calculate_delay(
                attempt,
                config.base_delay,
                config.max_delay,
                config.exponential_backoff,
                config.jitter,
            )

            logger.warning(
                f"Function {func.__name__} failed on attempt {attempt}, retrying in {delay:.2f}s",
                extra={
                    "function": func.__name__,
                    "exception": str(e),
                    "attempt": attempt,
                    "max_attempts": config.max_attempts,
                    "delay": delay,
                    **context,
                },
            )

            await asyncio.sleep(delay)

    # This should never be reached, but just in case
    raise last_exception


def retry_sync(
    func: Callable,
    config: Optional[RetryConfig] = None,
    context: Optional[Dict[str, Any]] = None,
    *args,
    **kwargs,
) -> Any:
    """Retry a sync function with configurable backoff."""

    if config is None:
        config = RetryConfig()

    context = context or {}
    last_exception = None

    for attempt in range(1, config.max_attempts + 1):
        try:
            result = func(*args, **kwargs)

            if attempt > 1:
                logger.info(
                    f"Function {func.__name__} succeeded after {attempt} attempts",
                    extra={
                        "function": func.__name__,
                        "attempt": attempt,
                        "max_attempts": config.max_attempts,
                        **context,
                    },
                )

            return result

        except Exception as e:
            last_exception = e

            # Check if we should retry this exception
            if not should_retry_exception(
                e, config.retry_exceptions, config.stop_exceptions
            ):
                logger.warning(
                    f"Exception {type(e).__name__} is not retryable, failing immediately",
                    extra={
                        "function": func.__name__,
                        "exception": str(e),
                        "attempt": attempt,
                        **context,
                    },
                )
                raise

            # If this was the last attempt, don't retry
            if attempt == config.max_attempts:
                logger.error(
                    f"Function {func.__name__} failed after {config.max_attempts} attempts",
                    extra={
                        "function": func.__name__,
                        "exception": str(e),
                        "attempt": attempt,
                        "max_attempts": config.max_attempts,
                        **context,
                    },
                )
                raise

            # Calculate delay and wait
            delay = calculate_delay(
                attempt,
                config.base_delay,
                config.max_delay,
                config.exponential_backoff,
                config.jitter,
            )

            logger.warning(
                f"Function {func.__name__} failed on attempt {attempt}, retrying in {delay:.2f}s",
                extra={
                    "function": func.__name__,
                    "exception": str(e),
                    "attempt": attempt,
                    "max_attempts": config.max_attempts,
                    "delay": delay,
                    **context,
                },
            )

            time.sleep(delay)

    # This should never be reached, but just in case
    raise last_exception


def with_retry(
    config: Optional[RetryConfig] = None, context: Optional[Dict[str, Any]] = None
):
    """Decorator for adding retry logic to functions."""

    def decorator(func: Callable) -> Callable:
        if asyncio.iscoroutinefunction(func):

            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                return await retry_async(func, config, context, *args, **kwargs)

            return async_wrapper
        else:

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                return retry_sync(func, config, context, *args, **kwargs)

            return sync_wrapper

    return decorator


class CircuitBreaker:
    """Circuit breaker implementation for preventing cascading failures."""

    def __init__(
        self,
        failure_threshold: int = 5,
        reset_timeout: float = 60.0,
        expected_exception: Type[Exception] = Exception,
        name: str = "CircuitBreaker",
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.expected_exception = expected_exception
        self.name = name

        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitBreakerState.CLOSED
        self.success_count = 0

    def _should_attempt_reset(self) -> bool:
        """Check if circuit breaker should attempt to reset."""
        if self.last_failure_time is None:
            return False

        time_since_failure = datetime.utcnow() - self.last_failure_time
        return time_since_failure.total_seconds() >= self.reset_timeout

    def _on_success(self) -> None:
        """Handle successful operation."""
        self.failure_count = 0

        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= 3:  # Require 3 successes to fully close
                self.state = CircuitBreakerState.CLOSED
                self.success_count = 0
                logger.info(f"Circuit breaker {self.name} transitioned to CLOSED")

    def _on_failure(self, exception: Exception) -> None:
        """Handle failed operation."""
        if not isinstance(exception, self.expected_exception):
            return

        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.OPEN
            self.success_count = 0
            logger.warning(
                f"Circuit breaker {self.name} transitioned to OPEN from HALF_OPEN"
            )
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            logger.warning(
                f"Circuit breaker {self.name} transitioned to OPEN - failure threshold reached"
            )

    async def call_async(self, func: Callable, *args, **kwargs) -> Any:
        """Execute async function with circuit breaker protection."""

        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info(f"Circuit breaker {self.name} transitioned to HALF_OPEN")
            else:
                raise Exception(f"Circuit breaker {self.name} is OPEN")

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure(e)
            raise

    def call_sync(self, func: Callable, *args, **kwargs) -> Any:
        """Execute sync function with circuit breaker protection."""

        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info(f"Circuit breaker {self.name} transitioned to HALF_OPEN")
            else:
                raise Exception(f"Circuit breaker {self.name} is OPEN")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure(e)
            raise

    def get_state(self) -> CircuitBreakerState:
        """Get current circuit breaker state."""
        return self.state

    def get_metrics(self) -> Dict[str, Any]:
        """Get circuit breaker metrics."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": (
                self.last_failure_time.isoformat() if self.last_failure_time else None
            ),
            "failure_threshold": self.failure_threshold,
            "reset_timeout": self.reset_timeout,
        }

    def reset(self) -> None:
        """Manually reset circuit breaker."""
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        logger.info(f"Circuit breaker {self.name} manually reset")


def with_circuit_breaker(
    circuit_breaker: CircuitBreaker,
    context: Optional[Dict[str, Any]] = None,
):
    """Decorator for adding circuit breaker protection to functions."""

    def decorator(func: Callable) -> Callable:
        if asyncio.iscoroutinefunction(func):

            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                return await circuit_breaker.call_async(func, *args, **kwargs)

            return async_wrapper
        else:

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                return circuit_breaker.call_sync(func, *args, **kwargs)

            return sync_wrapper

    return decorator


# Global circuit breakers for common services
ai_service_circuit_breaker = CircuitBreaker(
    failure_threshold=3,
    reset_timeout=120.0,
    expected_exception=AIServiceError,
    name="AIService",
)

database_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    reset_timeout=60.0,
    expected_exception=DatabaseError,
    name="Database",
)

external_api_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    reset_timeout=30.0,
    expected_exception=ExternalAPIError,
    name="ExternalAPI",
)
