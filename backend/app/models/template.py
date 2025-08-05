"""Template models for workflow templates and parameters."""

import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import CHAR, TypeDecorator

from .base import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(32), storing as stringified hex values.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return str(value)
        else:
            try:
                if not isinstance(value, uuid.UUID):
                    uuid_obj = uuid.UUID(value)
                    return str(uuid_obj).replace("-", "")
                else:
                    return str(value).replace("-", "")
            except (ValueError, TypeError) as e:
                raise ValueError(f"Invalid UUID string: {value}") from e

    def process_result_value(self, value, dialect):
        if value is None:
            return value

        if isinstance(value, uuid.UUID):
            return value

        value_str = str(value)
        if len(value_str) == 32:
            # Convert from hex string back to UUID
            uuid_str = f"{value_str[:8]}-{value_str[8:12]}-{value_str[12:16]}-{value_str[16:20]}-{value_str[20:]}"
            return uuid.UUID(uuid_str)
        else:
            return uuid.UUID(value_str)


class Template(Base):
    """Model for storing workflow templates."""

    __tablename__ = "templates"

    # Primary key and identifiers
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)

    # Template content
    definition = Column(JSON, nullable=False)  # JSON workflow definition template
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
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

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    template_id = Column(GUID(), ForeignKey("templates.id"), nullable=False)
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
