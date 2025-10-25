from typing import Dict, List, Optional

from fastapi import Depends
from sqlalchemy.orm import Session

from app.models.workflow import WorkflowExecution

from ..database import get_db
from ..models import IndustryProfile, Template


class TemplateService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def get_templates_by_profile(self, profile_id: str) -> List[Template]:
        """Retrieve all templates associated with a specific industry profile"""
        profile = self.db.query(IndustryProfile).get(profile_id)
        if not profile:
            return []

        # Extract template categories from profile
        categories = profile.template_categories or []

        # Query templates with any of the profile's categories
        return (
            self.db.query(Template)
            .filter(Template.category.in_(categories))
            .all()
        )

    def get_template_by_id(self, template_id: str) -> Optional[Template]:
        """Retrieve a specific template by ID"""
        return self.db.query(Template).get(template_id)

    def create_template(self, template_data: Dict) -> Template:
        """Create a new template with profile categorization"""
        if not template_data.get("category"):
            raise ValueError("Template must have a category")

        template = Template(**template_data)
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update_template(
        self, template_id: str, updates: Dict
    ) -> Optional[Template]:
        """Update an existing template with new data"""
        template = self.get_template_by_id(template_id)
        if not template:
            return None

        for key, value in updates.items():
            if hasattr(template, key):
                setattr(template, key, value)
            else:
                raise ValueError(f"Invalid template field: {key}")

        self.db.commit()
        self.db.refresh(template)
        return template

    def delete_template(self, template_id: str) -> bool:
        """Delete a template and clean up dependencies"""
        template = self.get_template_by_id(template_id)
        if not template:
            return False

        # Check for dependent workflow executions
        dependent_executions = (
            self.db.query(WorkflowExecution)
            .filter(WorkflowExecution.template_id == template_id)
            .count()
        )

        if dependent_executions > 0:
            raise ValueError("Template has active dependencies")

        self.db.delete(template)
        self.db.commit()
        return True

    def get_template_categories(self) -> List[str]:
        """Get all available template categories"""
        return self.db.query(Template.category).distinct().all()

    def filter_templates(
        self, category: str, is_active: bool = True
    ) -> List[Template]:
        """Filter templates by category and active status"""
        return (
            self.db.query(Template)
            .filter(
                Template.category == category, Template.is_active == is_active
            )
            .all()
        )
