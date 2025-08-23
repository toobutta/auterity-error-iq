"""
NeuroWeaver Model Registry Service
Handles model registration, metadata management, and versioning
"""

import logging
import re
import semver
from datetime import datetime
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
from sqlalchemy import select, update, and_, or_, func

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

    async def create_model_version(
        self,
        base_model_id: str,
        new_version: str,
        changes: Dict[str, Any],
        created_by: str
    ) -> ModelInfo:
        """Create a new version of an existing model"""
        async with self.session_factory() as session:
            try:
                # Get base model
                base_model = await self.get_model(base_model_id)
                if not base_model:
                    raise ValueError(f"Base model {base_model_id} not found")

                # Validate semantic versioning
                if not self._is_valid_semver(new_version):
                    raise ValueError(f"Invalid semantic version: {new_version}")

                # Check if version already exists
                existing_versions = await self.get_model_versions(base_model.name)
                if any(v.version == new_version for v in existing_versions):
                    raise ValueError(f"Version {new_version} already exists for model {base_model.name}")

                # Generate new model ID
                import uuid
                new_model_id = str(uuid.uuid4())

                # Create new model info
                new_model_info = ModelInfo(
                    id=new_model_id,
                    name=base_model.name,
                    description=changes.get("description", base_model.description),
                    specialization=base_model.specialization,
                    base_model=base_model.base_model,
                    status="registered",
                    version=new_version,
                    created_by=created_by,
                    training_config=changes.get("training_config", base_model.training_config),
                    performance_metrics=base_model.performance_metrics,
                    deployment_info=None,  # New versions start undeployed
                    is_active=True,
                    auto_deploy=base_model.auto_deploy
                )

                # Register new version
                return await self.register_model(new_model_info)

            except Exception as e:
                logger.error(f"Failed to create model version: {e}")
                raise

    async def bump_model_version(
        self,
        model_id: str,
        bump_type: str,
        created_by: str
    ) -> ModelInfo:
        """Automatically bump model version (major, minor, patch)"""
        try:
            model = await self.get_model(model_id)
            if not model:
                raise ValueError(f"Model {model_id} not found")

            # Calculate new version
            current_version = model.version
            if not self._is_valid_semver(current_version):
                raise ValueError(f"Current version {current_version} is not valid semver")

            if bump_type == "major":
                new_version = semver.bump_major(current_version)
            elif bump_type == "minor":
                new_version = semver.bump_minor(current_version)
            elif bump_type == "patch":
                new_version = semver.bump_patch(current_version)
            else:
                raise ValueError(f"Invalid bump type: {bump_type}")

            # Create new version
            return await self.create_model_version(
                model_id,
                new_version,
                {"description": f"Auto-bumped {bump_type} version"},
                created_by
            )

        except Exception as e:
            logger.error(f"Failed to bump model version: {e}")
            raise

    async def compare_models(
        self,
        model_id_1: str,
        model_id_2: str
    ) -> Dict[str, Any]:
        """Compare two model versions"""
        try:
            model1 = await self.get_model(model_id_1)
            model2 = await self.get_model(model_id_2)

            if not model1 or not model2:
                raise ValueError("One or both models not found")

            comparison = {
                "model_1": {
                    "id": model1.id,
                    "name": model1.name,
                    "version": model1.version,
                    "status": model1.status,
                    "created_at": model1.created_at.isoformat() if model1.created_at else None
                },
                "model_2": {
                    "id": model2.id,
                    "name": model2.name,
                    "version": model2.version,
                    "status": model2.status,
                    "created_at": model2.created_at.isoformat() if model2.created_at else None
                },
                "version_comparison": self._compare_versions(model1.version, model2.version),
                "performance_comparison": self._compare_performance(
                    model1.performance_metrics or {},
                    model2.performance_metrics or {}
                ),
                "recommendation": self._get_comparison_recommendation(model1, model2)
            }

            return comparison

        except Exception as e:
            logger.error(f"Failed to compare models: {e}")
            raise

    async def rollback_to_version(
        self,
        model_name: str,
        target_version: str,
        created_by: str
    ) -> ModelInfo:
        """Rollback to a specific version"""
        try:
            # Get target version
            target_model = await self._get_model_by_name_and_version(model_name, target_version)
            if not target_model:
                raise ValueError(f"Model {model_name} version {target_version} not found")

            # Create new version based on target
            new_version = await self._get_next_rollback_version(model_name)

            return await self.create_model_version(
                target_model.id,
                new_version,
                {
                    "description": f"Rollback to version {target_version}",
                    "training_config": target_model.training_config
                },
                created_by
            )

        except Exception as e:
            logger.error(f"Failed to rollback model: {e}")
            raise

    async def get_version_history(
        self,
        model_name: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get version history for a model"""
        try:
            versions = await self.get_model_versions(model_name)
            versions = versions[:limit]  # Limit results

            history = []
            for version in versions:
                history.append({
                    "version": version.version,
                    "id": version.id,
                    "status": version.status,
                    "created_at": version.created_at.isoformat() if version.created_at else None,
                    "created_by": version.created_by,
                    "performance_metrics": version.performance_metrics,
                    "deployment_info": version.deployment_info,
                    "description": version.description
                })

            return history

        except Exception as e:
            logger.error(f"Failed to get version history: {e}")
            raise

    async def get_latest_version(self, model_name: str) -> Optional[ModelInfo]:
        """Get the latest version of a model"""
        try:
            versions = await self.get_model_versions(model_name)
            if not versions:
                return None

            # Sort by semantic version
            versions.sort(key=lambda x: semver.parse(x.version), reverse=True)
            return versions[0]

        except Exception as e:
            logger.error(f"Failed to get latest version: {e}")
            raise

    def _is_valid_semver(self, version: str) -> bool:
        """Check if version string is valid semver"""
        try:
            semver.parse(version)
            return True
        except ValueError:
            return False

    def _compare_versions(self, version1: str, version2: str) -> Dict[str, Any]:
        """Compare two semantic versions"""
        try:
            v1 = semver.parse(version1)
            v2 = semver.parse(version2)

            comparison = semver.compare(version1, version2)

            return {
                "version_1": version1,
                "version_2": version2,
                "relationship": "newer" if comparison > 0 else "older" if comparison < 0 else "equal",
                "difference": abs(comparison),
                "is_compatible": semver.satisfies(version2, f"^{version1}") if comparison >= 0 else False
            }

        except Exception as e:
            logger.error(f"Error comparing versions: {e}")
            return {
                "version_1": version1,
                "version_2": version2,
                "relationship": "unknown",
                "error": str(e)
            }

    def _compare_performance(
        self,
        metrics1: Dict[str, Any],
        metrics2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare performance metrics between two models"""
        comparison = {}

        # Compare accuracy
        if "accuracy" in metrics1 and "accuracy" in metrics2:
            acc1 = metrics1["accuracy"]
            acc2 = metrics2["accuracy"]
            comparison["accuracy"] = {
                "model_1": acc1,
                "model_2": acc2,
                "improvement": acc2 - acc1,
                "percent_change": ((acc2 - acc1) / acc1 * 100) if acc1 > 0 else 0
            }

        # Compare latency
        if "latency_ms" in metrics1 and "latency_ms" in metrics2:
            lat1 = metrics1["latency_ms"]
            lat2 = metrics2["latency_ms"]
            comparison["latency"] = {
                "model_1": lat1,
                "model_2": lat2,
                "improvement": lat1 - lat2,  # Lower is better
                "percent_change": ((lat2 - lat1) / lat1 * 100) if lat1 > 0 else 0
            }

        # Compare training time
        if "training_time" in metrics1 and "training_time" in metrics2:
            time1 = metrics1["training_time"]
            time2 = metrics2["training_time"]
            comparison["training_time"] = {
                "model_1": time1,
                "model_2": time2,
                "improvement": time1 - time2,
                "percent_change": ((time2 - time1) / time1 * 100) if time1 > 0 else 0
            }

        return comparison

    def _get_comparison_recommendation(
        self,
        model1: ModelInfo,
        model2: ModelInfo
    ) -> str:
        """Generate recommendation based on model comparison"""
        try:
            metrics1 = model1.performance_metrics or {}
            metrics2 = model2.performance_metrics or {}

            # Simple recommendation logic
            acc1 = metrics1.get("accuracy", 0)
            acc2 = metrics2.get("accuracy", 0)
            lat1 = metrics1.get("latency_ms", float('inf'))
            lat2 = metrics2.get("latency_ms", float('inf'))

            if acc2 > acc1 and lat2 <= lat1 * 1.1:  # Accuracy improved, latency similar
                return f"Recommend {model2.name} v{model2.version} - better accuracy with similar performance"
            elif lat2 < lat1 and acc2 >= acc1 * 0.95:  # Latency improved, accuracy maintained
                return f"Recommend {model2.name} v{model2.version} - better performance with maintained accuracy"
            elif acc2 > acc1:  # Accuracy significantly better
                return f"Recommend {model2.name} v{model2.version} - significantly better accuracy"
            else:
                return f"Keep {model1.name} v{model1.version} - current version performs better overall"

        except Exception as e:
            logger.error(f"Error generating recommendation: {e}")
            return "Unable to generate recommendation due to insufficient data"

    async def _get_model_by_name_and_version(
        self,
        model_name: str,
        version: str
    ) -> Optional[ModelInfo]:
        """Get specific model by name and version"""
        async with self.session_factory() as session:
            try:
                stmt = select(ModelRecord).where(
                    and_(
                        ModelRecord.name == model_name,
                        ModelRecord.version == version,
                        ModelRecord.is_active.is_(True)
                    )
                )
                result = await session.execute(stmt)
                model_record = result.scalar_one_or_none()

                if model_record:
                    return self._record_to_model_info(model_record)
                return None

            except Exception as e:
                logger.error(f"Failed to get model {model_name} v{version}: {e}")
                raise

    async def _get_next_rollback_version(self, model_name: str) -> str:
        """Generate next rollback version number"""
        try:
            # Get latest version
            latest = await self.get_latest_version(model_name)
            if not latest:
                return "1.0.0"

            # Generate rollback version (increment patch)
            current = semver.parse(latest.version)
            rollback_version = f"{current['major']}.{current['minor']}.{current['patch'] + 1}-rollback"

            return rollback_version

        except Exception as e:
            logger.error(f"Error generating rollback version: {e}")
            return "1.0.0-rollback"

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
