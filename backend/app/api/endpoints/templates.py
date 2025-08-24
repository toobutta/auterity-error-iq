from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TemplateResponse
from ..services import template_service

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/profile/{profile_id}", response_model=List[TemplateResponse])
def get_templates_by_profile(profile_id: str, db: Session = Depends(get_db)):
    """Get templates filtered by industry profile"""
    templates = template_service.get_templates_by_profile(profile_id)
    if not templates:
        raise HTTPException(
            status_code=404, detail="No templates found for this profile"
        )
    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template_by_id(template_id: str, db: Session = Depends(get_db)):
    """Get a specific template by ID"""
    template = template_service.get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/", response_model=TemplateResponse)
def create_template(template_data: Dict, db: Session = Depends(get_db)):
    """Create a new template with profile categorization"""
    if not template_data.get("category"):
        raise HTTPException(status_code=400, detail="Template must have a category")
    return template_service.create_template(template_data)


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(template_id: str, updates: Dict, db: Session = Depends(get_db)):
    """Update an existing template"""
    updated = template_service.update_template(template_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated


@router.delete("/{template_id}", response_model=bool)
def delete_template(template_id: str, db: Session = Depends(get_db)):
    """Delete a template"""
    success = template_service.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete template")
    return success
