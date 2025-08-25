"""Tenant related schemas."""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class TenantCreate(BaseModel):
    name: str
    description: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TenantStatsResponse(BaseModel):
    total_users: int = 0
    total_workflows: int = 0
    total_executions: int = 0

class SSOConfigurationCreate(BaseModel):
    provider: str
    settings: Dict[str, Any]
