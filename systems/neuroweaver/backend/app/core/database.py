"""
NeuroWeaver Database Configuration
SQLAlchemy async database setup and models
"""

from sqlalchemy import Column, String, DateTime, Boolean, JSON, Float, Integer, Text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from datetime import datetime

from app.core.config import settings

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    future=True
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Create declarative base
Base = declarative_base()


class ModelRecord(Base):
    """Model registry database table"""
    __tablename__ = "models"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    specialization = Column(String, nullable=False, index=True)
    base_model = Column(String, nullable=False)
    status = Column(String, nullable=False, default="registered", index=True)
    version = Column(String, default="1.0.0")
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # JSON fields for flexible data storage
    training_config = Column(JSON)
    performance_metrics = Column(JSON)
    deployment_info = Column(JSON)
    
    # Flags
    is_active = Column(Boolean, default=True, index=True)
    auto_deploy = Column(Boolean, default=False)


class TrainingJobRecord(Base):
    """Training job tracking table"""
    __tablename__ = "training_jobs"
    
    id = Column(String, primary_key=True, index=True)  # job_id
    model_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="queued", index=True)
    progress_percent = Column(Float, default=0.0)
    current_epoch = Column(Integer)
    total_epochs = Column(Integer)
    current_loss = Column(Float)
    best_eval_loss = Column(Float)
    
    # Timestamps
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Configuration and results
    training_config = Column(JSON)
    training_results = Column(JSON)
    error_message = Column(Text)
    
    # Resource usage
    estimated_time_remaining = Column(Integer)  # seconds
    gpu_memory_used = Column(Float)
    cpu_usage_percent = Column(Float)


class DatasetRecord(Base):
    """Dataset metadata table"""
    __tablename__ = "datasets"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    category = Column(String, nullable=False, index=True)
    format = Column(String, nullable=False)  # jsonl, csv, yaml
    file_path = Column(String, nullable=False)
    size_mb = Column(Float)
    sample_count = Column(Integer)
    
    # Metadata
    specializations = Column(JSON)  # List of applicable specializations
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version = Column(String, default="1.0.0")
    is_active = Column(Boolean, default=True, index=True)
    
    # Statistics
    preprocessing_stats = Column(JSON)
    quality_metrics = Column(JSON)


class TemplateRecord(Base):
    """Template metadata table"""
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    category = Column(String, nullable=False, index=True)
    specialization = Column(String, nullable=False, index=True)
    
    # Template content
    prompt_template = Column(Text, nullable=False)
    example_inputs = Column(JSON)
    expected_outputs = Column(JSON)
    parameters = Column(JSON)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version = Column(String, default="1.0.0")
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String, nullable=False)
    
    # Usage statistics
    usage_count = Column(Integer, default=0)
    success_rate = Column(Float)
    average_response_time = Column(Float)


class DeploymentRecord(Base):
    """Model deployment tracking table"""
    __tablename__ = "deployments"
    
    id = Column(String, primary_key=True, index=True)
    model_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="deploying", index=True)
    endpoint_url = Column(String)
    
    # Deployment configuration
    deployment_config = Column(JSON)
    instance_type = Column(String)
    instance_count = Column(Integer, default=1)
    
    # Performance metrics
    requests_per_minute = Column(Float)
    average_latency_ms = Column(Float)
    error_rate = Column(Float)
    
    # Timestamps
    deployed_at = Column(DateTime)
    last_health_check = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # RelayCore integration
    relaycore_registered = Column(Boolean, default=False)
    relaycore_model_id = Column(String)


# Dependency to get database session
async def get_db_session() -> AsyncSession:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Database initialization
async def init_database():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Database cleanup
async def close_database():
    """Close database connections"""
    await engine.dispose()