# GitHub Copilot Task: Multi-Model Support Implementation
## Phase 2.1 - Core Infrastructure Expansion

**Date**: January 31, 2025  
**Task Type**: [COPILOT-TASK]  
**Priority**: HIGH  
**Timeline**: Week 5-6 of expansion plan  
**Estimated Effort**: 8-12 hours  

---

## 🎯 Task Overview

Transform the current OpenAI-only AI service into a multi-model routing system using LiteLLM, enabling support for OpenAI, Ollama, HuggingFace, and other model providers with dynamic switching, cost tracking, and fallback mechanisms.

---

## 📋 Current State Analysis

### Existing Implementation
- **File**: `backend/app/services/ai_service.py`
- **Current Model Support**: OpenAI only (GPT-3.5-turbo, GPT-4, GPT-4-turbo)
- **Architecture**: Direct OpenAI AsyncClient integration
- **Features**: Template system, retry logic, response validation
- **Integration**: Workflow engine via `AIStepExecutor`

### Key Patterns to Preserve
- `AIResponse` dataclass structure
- `PromptTemplate` system with variable substitution
- Async/await patterns throughout
- Retry logic with exponential backoff
- Global service instance pattern (`get_ai_service()`)
- Template-based processing (`process_with_template()`)

---

## 🚀 Implementation Requirements

### 1. LiteLLM Integration Layer

**Create**: `backend/app/services/litellm_service.py`

```python
"""LiteLLM integration service for multi-model support."""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

import litellm
from litellm import acompletion

from app.exceptions import AIServiceError
from app.services.ai_service import AIResponse


class ModelProvider(Enum):
    """Supported model providers."""
    OPENAI = "openai"
    OLLAMA = "ollama"
    HUGGINGFACE = "huggingface"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"


@dataclass
class ModelConfig:
    """Configuration for a specific model."""
    name: str
    provider: ModelProvider
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
    max_tokens: Optional[int] = None
    cost_per_token: Optional[float] = None
    capabilities: List[str] = None
    is_available: bool = True


class LiteLLMService:
    """Multi-model service using LiteLLM for routing."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize LiteLLM service with model configurations."""
        # Implementation details for Copilot to generate
        pass
    
    async def make_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        **kwargs
    ) -> AIResponse:
        """Make completion call through LiteLLM with fallback logic."""
        # Implementation details for Copilot to generate
        pass
    
    def get_available_models(self) -> List[ModelConfig]:
        """Get list of available models with their configurations."""
        # Implementation details for Copilot to generate
        pass
    
    async def health_check(self, model: str) -> bool:
        """Check if a specific model is available and responding."""
        # Implementation details for Copilot to generate
        pass
```

### 2. Enhanced AI Service with Multi-Model Support

**Modify**: `backend/app/services/ai_service.py`

**Key Changes Required**:
- Replace direct OpenAI client with LiteLLM service
- Add model selection and fallback logic
- Implement cost tracking per model
- Add model availability checking
- Preserve all existing method signatures for backward compatibility

**New Methods to Add**:
```python
async def get_available_models(self) -> List[Dict[str, Any]]:
    """Get list of available models with capabilities and costs."""
    pass

async def select_optimal_model(
    self, 
    task_type: str, 
    context_length: int = 0,
    cost_preference: str = "balanced"
) -> str:
    """Select optimal model based on task requirements and preferences."""
    pass

async def get_model_costs(self, model: str, tokens_used: int) -> Dict[str, float]:
    """Calculate costs for model usage."""
    pass
```

### 3. Model Configuration System

**Create**: `backend/config/model_policies.yml`

```yaml
# Model routing policies and configurations
models:
  openai:
    gpt-3.5-turbo:
      provider: openai
      cost_per_1k_tokens: 0.002
      max_tokens: 4096
      capabilities: ["text", "chat", "reasoning"]
      use_cases: ["general", "customer_service", "quick_responses"]
    
    gpt-4:
      provider: openai
      cost_per_1k_tokens: 0.03
      max_tokens: 8192
      capabilities: ["text", "chat", "complex_reasoning", "analysis"]
      use_cases: ["complex_analysis", "detailed_responses", "critical_tasks"]
  
  ollama:
    llama2:
      provider: ollama
      endpoint: "http://localhost:11434"
      cost_per_1k_tokens: 0.0
      max_tokens: 4096
      capabilities: ["text", "chat"]
      use_cases: ["development", "testing", "cost_sensitive"]

routing_rules:
  default_model: "gpt-3.5-turbo"
  fallback_chain: ["gpt-3.5-turbo", "gpt-4", "llama2"]
  
  task_preferences:
    customer_inquiry: ["gpt-3.5-turbo", "gpt-4"]
    lead_qualification: ["gpt-4", "gpt-3.5-turbo"]
    service_recommendation: ["gpt-4"]
    generic_processing: ["gpt-3.5-turbo", "llama2"]

cost_controls:
  daily_budget: 100.0
  per_request_limit: 1.0
  alert_threshold: 80.0
```

**Create**: `backend/app/models/model_config.py`

```python
"""Database models for model configuration and usage tracking."""

import uuid
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, UUID
from sqlalchemy.sql import func
from .base import Base


class ModelUsage(Base):
    """Track model usage and costs."""
    __tablename__ = "model_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)
    tokens_used = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    execution_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelConfiguration(Base):
    """Store dynamic model configurations."""
    __tablename__ = "model_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    provider = Column(String(50), nullable=False)
    config = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### 4. Frontend Model Selection Interface

**Create**: `frontend/src/components/ModelSelector.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, CpuChipIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface ModelInfo {
  name: string;
  provider: string;
  costPerToken: number;
  maxTokens: number;
  capabilities: string[];
  isAvailable: boolean;
  responseTime?: number;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  taskType?: string;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  taskType = 'general',
  className = ''
}) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Implementation details for Copilot to generate:
  // - Fetch available models from API
  // - Display model capabilities and costs
  // - Show real-time availability status
  // - Implement dropdown selection UI
  // - Add cost estimation display
  // - Handle model switching

  return (
    <div className={`relative ${className}`}>
      {/* Copilot: Generate complete component implementation */}
    </div>
  );
};
```

**Create**: `frontend/src/components/ModelStatusIndicator.tsx`

```typescript
import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ModelStatusIndicatorProps {
  model: string;
  status: 'available' | 'unavailable' | 'slow' | 'unknown';
  responseTime?: number;
  className?: string;
}

export const ModelStatusIndicator: React.FC<ModelStatusIndicatorProps> = ({
  model,
  status,
  responseTime,
  className = ''
}) => {
  // Implementation details for Copilot to generate:
  // - Status indicator with appropriate colors
  // - Response time display
  // - Tooltip with detailed information
  // - Real-time status updates

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Copilot: Generate status indicator implementation */}
    </div>
  );
};
```

### 5. Model Management API Endpoints

**Create**: `backend/app/api/models.py`

```python
"""API endpoints for model management and monitoring."""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import get_ai_service
from app.models.model_config import ModelUsage, ModelConfiguration
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/available")
async def get_available_models(
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get list of available models with capabilities and costs."""
    # Implementation details for Copilot to generate
    pass


@router.get("/usage")
async def get_model_usage(
    days: int = Query(7, ge=1, le=90),
    model: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get model usage statistics and costs."""
    # Implementation details for Copilot to generate
    pass


@router.post("/health-check")
async def check_model_health(
    model: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Check health status of a specific model."""
    # Implementation details for Copilot to generate
    pass


@router.get("/recommendations")
async def get_model_recommendations(
    task_type: str,
    context_length: int = 0,
    cost_preference: str = "balanced",
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get model recommendations for specific task requirements."""
    # Implementation details for Copilot to generate
    pass
```

### 6. Database Migration

**Create**: `backend/alembic/versions/add_model_tracking_tables.py`

```python
"""Add model tracking tables

Revision ID: add_model_tracking
Revises: [previous_revision]
Create Date: 2025-01-31
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Implementation details for Copilot to generate:
# - Create model_usage table
# - Create model_configurations table
# - Add indexes for performance
# - Handle UUID type compatibility
```

---

## 🔧 Integration Points

### Workflow Engine Integration
- **File**: `backend/app/executors/step_executors.py`
- **Modification**: Update `AIStepExecutor` to support model selection
- **New Parameters**: Add `model`, `fallback_models`, `cost_limit` to step configuration

### Frontend Workflow Builder
- **File**: `frontend/src/components/workflow-builder/`
- **Addition**: Model selection in AI step configuration
- **Features**: Cost estimation, model comparison, availability status

### Monitoring Dashboard
- **Integration**: Add model usage metrics to existing dashboard
- **Charts**: Cost breakdown by model, usage patterns, performance metrics

---

## 📊 Success Criteria

### Functional Requirements
- ✅ Support for OpenAI, Ollama, and HuggingFace models
- ✅ Dynamic model switching without service restart
- ✅ Automatic fallback to alternative models on failure
- ✅ Cost tracking and usage analytics per model
- ✅ Real-time model availability monitoring
- ✅ UI for model selection and configuration

### Performance Requirements
- ✅ Model switching latency < 100ms
- ✅ Fallback activation time < 2 seconds
- ✅ Cost calculation accuracy within 1%
- ✅ Health check response time < 5 seconds

### Quality Requirements
- ✅ Backward compatibility with existing AI service interface
- ✅ Zero downtime during model configuration changes
- ✅ Comprehensive error handling and logging
- ✅ Unit test coverage > 90%

---

## 🧪 Testing Strategy

### Unit Tests
```python
# backend/tests/test_litellm_service.py
# backend/tests/test_multi_model_ai_service.py
# backend/tests/test_model_management_api.py
```

### Integration Tests
```python
# backend/tests/test_workflow_multi_model_integration.py
# backend/tests/test_model_fallback_scenarios.py
```

### Frontend Tests
```typescript
// frontend/src/components/__tests__/ModelSelector.test.tsx
// frontend/src/components/__tests__/ModelStatusIndicator.test.tsx
```

---

## 📦 Dependencies

### Backend Dependencies
```txt
# Add to requirements.txt
litellm>=1.0.0
pyyaml>=6.0
```

### Frontend Dependencies
```json
// Add to package.json
{
  "@heroicons/react": "^2.0.0",
  "recharts": "^2.8.0"
}
```

---

## 🚨 Risk Mitigation

### High-Risk Areas
1. **Model Availability**: Implement robust health checking and fallback logic
2. **Cost Control**: Add budget limits and usage monitoring
3. **Performance Impact**: Optimize model selection and caching
4. **Configuration Complexity**: Provide sensible defaults and validation

### Fallback Strategies
1. **Primary Model Failure**: Automatic fallback to secondary models
2. **All Models Unavailable**: Graceful degradation with error messages
3. **Cost Limit Exceeded**: Switch to lower-cost models or pause execution
4. **Configuration Errors**: Revert to last known good configuration

---

## 📝 Documentation Requirements

### API Documentation
- Model management endpoints with examples
- Configuration schema documentation
- Cost calculation methodology

### User Guides
- Model selection best practices
- Cost optimization strategies
- Troubleshooting common issues

### Developer Documentation
- LiteLLM integration patterns
- Custom model provider setup
- Monitoring and alerting setup

---

## 🎯 Copilot Execution Instructions

### Phase 1: Backend Implementation (4-6 hours)
1. **Install Dependencies**: Add LiteLLM and YAML parsing
2. **Create LiteLLM Service**: Implement multi-model routing layer
3. **Enhance AI Service**: Add model selection and cost tracking
4. **Database Models**: Create model usage and configuration tables
5. **API Endpoints**: Implement model management endpoints
6. **Database Migration**: Create migration for new tables

### Phase 2: Frontend Implementation (3-4 hours)
1. **Model Selector Component**: Create dropdown with model information
2. **Status Indicator**: Real-time model availability display
3. **Integration**: Add to workflow builder and execution interface
4. **Styling**: Consistent design with existing components

### Phase 3: Testing & Documentation (2-3 hours)
1. **Unit Tests**: Comprehensive test coverage for new functionality
2. **Integration Tests**: End-to-end workflow testing with multiple models
3. **API Documentation**: Update OpenAPI specs
4. **User Documentation**: Model selection and cost optimization guides

---

## 🔄 Handoff Protocol

### Completion Criteria
- All files created and integrated successfully
- Tests passing with >90% coverage
- Documentation updated and complete
- Cost tracking functional and accurate
- Model fallback logic tested and working

### Deliverables
- Complete multi-model support implementation
- Updated API documentation
- User guide for model selection
- Performance benchmarks and cost analysis
- Migration scripts and deployment instructions

---

**Task Priority**: HIGH - Core infrastructure for Phase 2 expansion  
**Blocking Dependencies**: None (foundation work complete)  
**Next Phase Enabler**: Advanced monitoring, prompt engineering, agent orchestration

This task transforms Auterity from a single-model system into a flexible, cost-effective multi-model platform ready for enterprise deployment and advanced AI workflows.