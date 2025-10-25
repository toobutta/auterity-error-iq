"""Template models for workflow templates and parameters."""

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import CHAR, TypeDecorator

from .base import Base


class UUIDType(TypeDecorator):
    """Custom UUID type for SQLAlchemy.

    Uses PostgreSQL's UUID type, otherwise uses CHAR(32),
    storing as stringified hex values.
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
            uuid_str = (
                f"{value_str[:8]}-{value_str[8:12]}-{value_str[12:16]}"
                f"-{value_str[16:20]}-{value_str[20:]}"
            )
            return uuid.UUID(uuid_str)
        else:
            return uuid.UUID(value_str)


class Template(Base):
    """Template for creating new workflows."""

    __tablename__ = "templates"

    # Primary key and identifiers
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)

    # Template content
    definition = Column(JSON, nullable=False)  # JSON-based workflow definition
    version = Column(String(20), nullable=False, default="1.0.0")
    is_public = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(String(255))

    parameters = relationship(
        "TemplateParameter",
        back_populates="template",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return (
            f"<Template(id={self.id}, name='{self.name}', "
            f"category='{self.category}')>"
        )


class TemplateParameter(Base):
    """Model for storing template configuration parameters."""

    __tablename__ = "template_parameters"
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    template_id = Column(UUIDType, ForeignKey("templates.id"), nullable=False)
    name = Column(String(100), nullable=False)
    # string, number, boolean, etc.
    parameter_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    default_value = Column(JSON, nullable=True)
    is_required = Column(Boolean, default=True)

    template = relationship("Template", back_populates="parameters")

    def __repr__(self):
        return (
            f"<TemplateParameter(id={self.id}, "
            f"template_id={self.template_id}, name='{self.name}')>"
        )
