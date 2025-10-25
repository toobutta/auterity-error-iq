"""Custom exception classes for structured error handling."""


from enum import Enum
from typing import Any, Dict, Optional


class ErrorCategory(str, Enum):
    """Error categories for classification."""

    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    WORKFLOW = "workflow"
    AI_SERVICE = "ai_service"
    DATABASE = "database"
    EXTERNAL_API = "external_api"
    SYSTEM = "system"
    BUSINESS_LOGIC = "business_logic"


class ErrorSeverity(str, Enum):
    """Error severity levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BaseAppException(Exception):
    """Base exception class for all application errors."""

    def __init__(
        self,
        message: str,
        code: str,
        category: ErrorCategory = ErrorCategory.SYSTEM,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        details: Optional[Dict[str, Any]] = None,
        retryable: bool = False,
        user_message: Optional[str] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.category = category
        self.severity = severity
        self.details = details or {}
        self.retryable = retryable
        self.user_message = user_message or self._generate_user_message()

    def _generate_user_message(self) -> str:
        """Generate user-friendly error message based on category."""
        user_messages = {
            ErrorCategory.AUTHENTICATION: (
                "Authentication failed. Please log in again."
            ),
            ErrorCategory.AUTHORIZATION: (
                "You don't have permission to perform this action."
            ),
            ErrorCategory.VALIDATION: "Please check your input and try again.",
            ErrorCategory.WORKFLOW: (
                "There was a problem with the workflow execution."
            ),
            ErrorCategory.AI_SERVICE: (
                "AI service is temporarily unavailable. Please try again."
            ),
            ErrorCategory.DATABASE: (
                "Database error occurred. Please try again later."
            ),
            ErrorCategory.EXTERNAL_API: (
                "External service is temporarily unavailable."
            ),
            ErrorCategory.SYSTEM: (
                "System error occurred. Our team has been notified."
            ),
            ErrorCategory.BUSINESS_LOGIC: "Business rule validation failed.",
        }
        return user_messages.get(
            self.category, "An unexpected error occurred."
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses."""
        return {
            "code": self.code,
            "message": self.message,
            "user_message": self.user_message,
            "category": self.category.value,
            "severity": self.severity.value,
            "details": self.details,
            "retryable": self.retryable,
        }


class AuthenticationError(BaseAppException):
    """Authentication-related errors."""

    def __init__(self, message: str = "Authentication failed", **kwargs):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            category=ErrorCategory.AUTHENTICATION,
            severity=ErrorSeverity.HIGH,
            **kwargs,
        )


class AuthorizationError(BaseAppException):
    """Authorization-related errors."""

    def __init__(self, message: str = "Access denied", **kwargs):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            category=ErrorCategory.AUTHORIZATION,
            severity=ErrorSeverity.HIGH,
            **kwargs,
        )


class ValidationError(BaseAppException):
    """Input validation errors."""

    def __init__(
        self,
        message: str = "Validation failed",
        field: Optional[str] = None,
        **kwargs,
    ):
        details = kwargs.get("details", {})
        if field:
            details["field"] = field

        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            category=ErrorCategory.VALIDATION,
            severity=ErrorSeverity.MEDIUM,
            details=details,
            **kwargs,
        )


class WorkflowError(BaseAppException):
    """Workflow execution errors."""

    def __init__(
        self,
        message: str = "Workflow execution failed",
        workflow_id: Optional[str] = None,
        execution_id: Optional[str] = None,
        step_name: Optional[str] = None,
        **kwargs,
    ):
        details = kwargs.get("details", {})
        if workflow_id:
            details["workflow_id"] = workflow_id
        if execution_id:
            details["execution_id"] = execution_id
        if step_name:
            details["step_name"] = step_name

        super().__init__(
            message=message,
            code="WORKFLOW_ERROR",
            category=ErrorCategory.WORKFLOW,
            severity=ErrorSeverity.HIGH,
            details=details,
            retryable=True,
            **kwargs,
        )


class AIServiceError(BaseAppException):
    """AI service integration errors."""

    def __init__(self, message: str = "AI service error", **kwargs):
        super().__init__(
            message=message,
            code="AI_SERVICE_ERROR",
            category=ErrorCategory.AI_SERVICE,
            severity=ErrorSeverity.MEDIUM,
            retryable=True,
            **kwargs,
        )


class DatabaseError(BaseAppException):
    """Database operation errors."""

    def __init__(self, message: str = "Database operation failed", **kwargs):
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            category=ErrorCategory.DATABASE,
            severity=ErrorSeverity.HIGH,
            retryable=True,
            **kwargs,
        )


class ExternalAPIError(BaseAppException):
    """External API integration errors."""

    def __init__(
        self,
        message: str = "External API error",
        api_name: Optional[str] = None,
        **kwargs,
    ):
        details = kwargs.get("details", {})
        if api_name:
            details["api_name"] = api_name

        super().__init__(
            message=message,
            code="EXTERNAL_API_ERROR",
            category=ErrorCategory.EXTERNAL_API,
            severity=ErrorSeverity.MEDIUM,
            details=details,
            retryable=True,
            **kwargs,
        )


class BusinessLogicError(BaseAppException):
    """Business logic validation errors."""

    def __init__(
        self,
        message: str = "Business rule validation failed",
        rule: Optional[str] = None,
        **kwargs,
    ):
        details = kwargs.get("details", {})
        if rule:
            details["rule"] = rule

        super().__init__(
            message=message,
            code="BUSINESS_LOGIC_ERROR",
            category=ErrorCategory.BUSINESS_LOGIC,
            severity=ErrorSeverity.MEDIUM,
            **kwargs,
        )


class SystemError(BaseAppException):
    """System-level errors."""

    def __init__(self, message: str = "System error occurred", **kwargs):
        super().__init__(
            message=message,
            code="SYSTEM_ERROR",
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.CRITICAL,
            **kwargs,
        )


# Specific workflow execution errors
class WorkflowNotFoundError(WorkflowError):
    """Workflow not found error."""

    def __init__(self, workflow_id: str, **kwargs):
        super().__init__(
            message=f"Workflow {workflow_id} not found",
            code="WORKFLOW_NOT_FOUND",
            workflow_id=workflow_id,
            severity=ErrorSeverity.HIGH,
            retryable=False,
            **kwargs,
        )


class WorkflowExecutionError(WorkflowError):
    """Workflow execution failure."""

    def __init__(
        self, execution_id: str, step_name: Optional[str] = None, **kwargs
    ):
        message = f"Workflow execution {execution_id} failed"
        if step_name:
            message += f" at step '{step_name}'"

        super().__init__(
            message=message,
            code="WORKFLOW_EXECUTION_FAILED",
            execution_id=execution_id,
            step_name=step_name,
            **kwargs,
        )


class WorkflowValidationError(WorkflowError):
    """Workflow definition validation error."""

    def __init__(self, message: str = "Workflow validation failed", **kwargs):
        super().__init__(
            message=message,
            code="WORKFLOW_VALIDATION_ERROR",
            severity=ErrorSeverity.MEDIUM,
            retryable=False,
            **kwargs,
        )
