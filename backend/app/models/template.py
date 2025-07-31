"""Template models for workflow templates and parameters."""

import uuid

from sqlalchemy import JSON, UUID, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Template(Base):
    """Model for storing workflow templates."""

    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)
    definition = Column(JSON, nullable=False)  # JSON workflow definition template
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    parameters = relationship(
        "TemplateParameter", back_populates="template", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return (
            f"<Template(id={self.id}, name='{self.name}', category='{self.category}')>"
        )


class TemplateParameter(Base):
    """Model for storing template configuration parameters."""

    __tablename__ = "template_parameters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    parameter_type = Column(String(50), nullable=False)  # string, number, boolean, etc.
    is_required = Column(Boolean, default=False, nullable=False)
    default_value = Column(JSON)
    validation_rules = Column(JSON)  # JSON schema for validation

    # Relationships
    template = relationship("Template", back_populates="parameters")

    def __repr__(self):
        return f"<TemplateParameter(id={self.id}, template_id={self.template_id}, name='{self.name}')>"
