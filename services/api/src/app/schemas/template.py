"""Template schemas."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class TemplateCreate(BaseModel):
    """Template creation request."""

    name: str
    description: Optional[str] = None
    category: str
    content: Dict[str, Any]
    variables: Optional[List[str]] = None
    is_public: bool = True


class TemplateUpdate(BaseModel):
    """Template update request."""

    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    variables: Optional[List[str]] = None
    is_public: Optional[bool] = None


class TemplateResponse(BaseModel):
    """Template response model."""

    id: str
    name: str
    description: Optional[str] = None
    category: str
    content: Dict[str, Any]
    variables: List[str] = []
    is_public: bool
    created_at: str
    updated_at: str


class TemplateListResponse(BaseModel):
    """Template list response."""

    templates: List[TemplateResponse]
    total: int
    page: int
    per_page: int


class TemplateInstantiateRequest(BaseModel):
    """Template instantiation request."""

    template_id: str
    variables: Dict[str, Any] = {}
