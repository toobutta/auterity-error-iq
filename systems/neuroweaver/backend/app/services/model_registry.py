"""
NeuroWeaver Model Registry Service
Handles model registration, metadata management, and versioning
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict
from dataclasses import dataclass
from sqlalchemy import select, update

from app.core.database import AsyncSessionLocal, ModelRecord

logger = logging.getLogger(__name__)


@dataclass
class ModelInfo:
    """Model information data class"""
    id: str
    name: str
    description: str
    specialization: str
    base_model: str
    status: str
    version: str
    created_by: str
    created_at: datetime = None
    updated_at: datetime = None
    training_config: Optional[Dict] = None
    performance_metrics: Optional[Dict] = None
    deployment_info: Optional[Dict] = None
    is_active: bool = True
    auto_deploy: bool = False

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()


class ModelRegistry:
    """Service for managing model registration and metadata"""

    def __init__(self):
        self.session_factory = AsyncSessionLocal

    async def register_model(self, model_info: ModelInfo) -> ModelInfo:
        """Register a new model in the registry"""
        async with self.session_factory() as session:
            try:
                model_record = ModelRecord(
                    id=model_info.id,
                    name=model_info.name,
                    description=model_info.description,
                    specialization=model_info.specialization,
                    base_model=model_info.base_model,
                    status=model_info.status,
                    version=model_info.version,
                    created_by=model_info.created_by,
                    training_config=model_info.training_config,
                    performance_metrics=model_info.performance_metrics,
                    deployment_info=model_info.deployment_info,
                    is_active=model_info.is_active,
                    auto_deploy=model_info.auto_deploy
                )

                session.add(model_record)
                await session.commit()
                await session.refresh(model_record)

                logger.info(f"Model {model_info.id} registered successfully")
                return self._record_to_model_info(model_record)

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to register model {model_info.id}: {e}")
                raise

    async def get_model(self, model_id: str) -> Optional[ModelInfo]:
        """Get model by ID"""
        async with self.session_factory() as session:
            try:
                stmt = select(ModelRecord).where(
                    ModelRecord.id == model_id,
                    ModelRecord.is_active.is_(True)
                )
                result = await session.execute(stmt)
                model_record = result.scalar_one_or_none()

                if model_record:
                    return self._record_to_model_info(model_record)
                return None

            except Exception as e:
                logger.error(f"Failed to get model {model_id}: {e}")
                raise

    async def list_models(
        self,
        specialization: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[ModelInfo]:
        """List models with optional filtering"""
        async with self.session_factory() as session:
            try:
                stmt = select(ModelRecord).where(
                    ModelRecord.is_active.is_(True)
                )

                if specialization:
                    stmt = stmt.where(
                        ModelRecord.specialization == specialization
                    )
                if status:
                    stmt = stmt.where(ModelRecord.status == status)

                stmt = stmt.limit(limit).order_by(
                    ModelRecord.created_at.desc()
                )

                result = await session.execute(stmt)
                model_records = result.scalars().all()

                return [
                    self._record_to_model_info(record)
                    for record in model_records
                ]

            except Exception as e:
                logger.error(f"Failed to list models: {e}")
                raise

    async def update_model(self, model_info: ModelInfo) -> ModelInfo:
        """Update model information"""
        async with self.session_factory() as session:
            try:
                model_info.updated_at = datetime.utcnow()

                stmt = update(ModelRecord).where(
                    ModelRecord.id == model_info.id
                ).values(
                    name=model_info.name,
                    description=model_info.description,
                    status=model_info.status,
                    version=model_info.version,
                    updated_at=model_info.updated_at,
                    training_config=model_info.training_config,
                    performance_metrics=model_info.performance_metrics,
                    deployment_info=model_info.deployment_info,
                    is_active=model_info.is_active,
                    auto_deploy=model_info.auto_deploy
                )

                await session.execute(stmt)
                await session.commit()

                logger.info(f"Model {model_info.id} updated successfully")
                return model_info

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to update model {model_info.id}: {e}")
                raise

    async def delete_model(self, model_id: str) -> bool:
        """Soft delete a model (mark as inactive)"""
        async with self.session_factory() as session:
            try:
                stmt = update(ModelRecord).where(
                    ModelRecord.id == model_id
                ).values(
                    is_active=False,
                    updated_at=datetime.utcnow()
                )

                result = await session.execute(stmt)
                await session.commit()

                if result.rowcount > 0:
                    logger.info(f"Model {model_id} deleted successfully")
                    return True
                else:
                    logger.warning(f"Model {model_id} not found for deletion")
                    return False

            except Exception as e:
                await session.rollback()
                logger.error(f"Failed to delete model {model_id}: {e}")
                raise

    async def get_models_by_specialization(
        self, specialization: str
    ) -> List[ModelInfo]:
        """Get all active models for a specific specialization"""
        return await self.list_models(
            specialization=specialization, status="deployed"
        )

    async def get_model_versions(self, model_name: str) -> List[ModelInfo]:
        """Get all versions of a model"""
        async with self.session_factory() as session:
            try:
                stmt = select(ModelRecord).where(
                    ModelRecord.name == model_name,
                    ModelRecord.is_active.is_(True)
                ).order_by(ModelRecord.version.desc())

                result = await session.execute(stmt)
                model_records = result.scalars().all()

                return [
                    self._record_to_model_info(record)
                    for record in model_records
                ]

            except Exception as e:
                logger.error(
                    f"Failed to get versions for model {model_name}: {e}"
                )
                raise

    async def update_performance_metrics(
        self, model_id: str, metrics: Dict
    ) -> bool:
        """Update performance metrics for a model"""
        async with self.session_factory() as session:
            try:
                stmt = update(ModelRecord).where(
                    ModelRecord.id == model_id
                ).values(
                    performance_metrics=metrics,
                    updated_at=datetime.utcnow()
                )

                result = await session.execute(stmt)
                await session.commit()

                if result.rowcount > 0:
                    logger.info(
                        f"Performance metrics updated for model {model_id}"
                    )
                    return True
                return False

            except Exception as e:
                await session.rollback()
                logger.error(
                    f"Failed to update performance metrics for model "
                    f"{model_id}: {e}"
                )
                raise

    def _record_to_model_info(self, record: ModelRecord) -> ModelInfo:
        """Convert database record to ModelInfo"""
        return ModelInfo(
            id=record.id,
            name=record.name,
            description=record.description,
            specialization=record.specialization,
            base_model=record.base_model,
            status=record.status,
            version=record.version,
            created_by=record.created_by,
            created_at=record.created_at,
            updated_at=record.updated_at,
            training_config=record.training_config,
            performance_metrics=record.performance_metrics,
            deployment_info=record.deployment_info,
            is_active=record.is_active,
            auto_deploy=record.auto_deploy
        )