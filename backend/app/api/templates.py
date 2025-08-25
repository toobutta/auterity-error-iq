"""Template management API endpoints."""

import uuid
from typing import Optional

from app.auth import get_current_user
from app.database import get_db
from app.models import Template, TemplateParameter, User
from app.schemas import (
    TemplateCreate,
    TemplateInstantiateRequest,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
    WorkflowResponse,
)
from app.services.template_engine import TemplateEngine
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=TemplateListResponse)
async def list_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all available templates with optional filtering."""
    query = db.query(Template).filter(Template.is_active is True)

    if category:
        query = query.filter(Template.category == category.lower())

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    templates = query.offset(offset).limit(page_size).all()

    return TemplateListResponse(
        templates=templates, total=total, page=page, page_size=page_size
    )


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific template by ID."""
    template = (
        db.query(Template)
        .filter(Template.id == template_id, Template.is_active is True)
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return template


@router.post("/", response_model=TemplateResponse)
async def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new template."""
    # Create the template
    template = Template(
        name=template_data.name,
        description=template_data.description,
        category=template_data.category,
        definition=template_data.definition,
        is_active=True,
    )

    db.add(template)
    db.flush()  # Get the template ID

    # Create template parameters
    for param_data in template_data.parameters:
        parameter = TemplateParameter(
            template_id=template.id,
            name=param_data.name,
            description=param_data.description,
            parameter_type=param_data.parameter_type,
            is_required=param_data.is_required,
            default_value=param_data.default_value,
            validation_rules=param_data.validation_rules,
        )
        db.add(parameter)

    db.commit()
    db.refresh(template)

    return template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing template."""
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update template fields
    update_data = template_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)

    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a template by setting is_active to False."""
    template = db.query(Template).filter(Template.id == template_id).first()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.is_active = False
    db.commit()

    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/instantiate", response_model=WorkflowResponse)
async def instantiate_template(
    template_id: uuid.UUID,
    instantiate_data: TemplateInstantiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new workflow from a template."""
    template = (
        db.query(Template)
        .filter(Template.id == template_id, Template.is_active is True)
        .first()
    )

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Use template engine to instantiate the template
    template_engine = TemplateEngine(db)

    try:
        workflow = await template_engine.instantiate_template(
            template_id=template_id,
            name=instantiate_data.name,
            description=instantiate_data.description,
            parameter_values=instantiate_data.parameter_values,
            user_id=current_user.id,
        )
        return workflow
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/categories/list")
async def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of available template categories."""
    categories = (
        db.query(Template.category).filter(Template.is_active is True).distinct().all()
    )

    return {"categories": [cat[0] for cat in categories]}
