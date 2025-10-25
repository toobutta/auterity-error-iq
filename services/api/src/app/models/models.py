from sqlalchemy import JSON, TIMESTAMP, UUID, Boolean, Column, DateTime, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Template(Base):
    __tablename__ = "templates"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text())
    category = Column(String(100), nullable=False)
    definition = Column(JSON(), nullable=False)
    is_active: Column[bool] = Column(Boolean(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    profiles = relationship(
        "IndustryProfile",
        secondary="template_profile_associations",
        back_populates="templates",
    )


class IndustryProfile(Base):
    __tablename__ = "industry_profiles"
    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text())
    template_categories = Column(JSON())
    ai_model_preferences = Column(JSON())
    workflow_patterns = Column(JSON())
    compliance_requirements = Column(JSON())
    created_at = Column(TIMESTAMP(), server_default=func.now())

    templates = relationship(
        "Template",
        secondary="template_profile_associations",
        back_populates="profiles",
    )
