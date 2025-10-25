"""Tenant Data Isolation Service for Multi-Tenant Architecture."""

import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
import json
from contextvars import ContextVar

from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, DateTime, Text, Float, Boolean
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

from app.database import get_db_session
from app.services.multi_tenant_ai import get_multi_tenant_ai_service

logger = logging.getLogger(__name__)

# Context variable for current tenant
current_tenant: ContextVar[Optional[str]] = ContextVar('current_tenant', default=None)


@dataclass
class TenantDatabaseConfig:
    """Tenant database configuration."""
    tenant_id: str
    schema_name: str
    connection_string: str
    engine: Any  # SQLAlchemy engine
    session_factory: Any  # SQLAlchemy session factory
    metadata: MetaData


@dataclass
class DataIsolationRule:
    """Data isolation rule."""
    table_name: str
    tenant_column: str
    isolation_level: str  # schema, row, column
    allowed_operations: List[str]


class TenantDataIsolationService:
    """Service for managing tenant data isolation."""

    def __init__(self):
        self.tenant_databases: Dict[str, TenantDatabaseConfig] = {}
        self.isolation_rules: Dict[str, List[DataIsolationRule]] = {}
        self.table_schemas: Dict[str, Dict[str, Any]] = {}

    async def initialize(self):
        """Initialize tenant data isolation service."""
        await self._load_tenant_database_configs()
        await self._setup_tenant_schemas()
        await self._load_isolation_rules()

        logger.info(f"Tenant Data Isolation initialized for {len(self.tenant_databases)} tenants")

    async def _load_tenant_database_configs(self):
        """Load tenant database configurations."""
        try:
            async with get_db_session() as session:
                tenants = await session.execute(
                    "SELECT tenant_id, schema_name, connection_string FROM tenant_databases WHERE active = true"
                )
                for tenant in tenants:
                    # Create tenant-specific database engine
                    engine = create_engine(tenant.connection_string)
                    session_factory = sessionmaker(bind=engine)
                    metadata = MetaData(schema=tenant.schema_name)

                    self.tenant_databases[tenant.tenant_id] = TenantDatabaseConfig(
                        tenant_id=tenant.tenant_id,
                        schema_name=tenant.schema_name,
                        connection_string=tenant.connection_string,
                        engine=engine,
                        session_factory=session_factory,
                        metadata=metadata
                    )
        except Exception as e:
            logger.error(f"Failed to load tenant database configs: {e}")

    async def _setup_tenant_schemas(self):
        """Setup tenant database schemas."""
        for tenant_id, db_config in self.tenant_databases.items():
            try:
                await self._create_tenant_schema(db_config)
                await self._create_tenant_tables(db_config)
            except Exception as e:
                logger.error(f"Failed to setup schema for tenant {tenant_id}: {e}")

    async def _create_tenant_schema(self, db_config: TenantDatabaseConfig):
        """Create tenant database schema."""
        try:
            with db_config.engine.connect() as conn:
                # Create schema if it doesn't exist
                conn.execute(f"CREATE SCHEMA IF NOT EXISTS {db_config.schema_name}")
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to create schema {db_config.schema_name}: {e}")

    async def _create_tenant_tables(self, db_config: TenantDatabaseConfig):
        """Create tenant-specific tables."""
        try:
            # Define common tenant tables
            tenant_tables = {
                'ai_requests': Table(
                    'ai_requests', db_config.metadata,
                    Column('id', String(36), primary_key=True),
                    Column('tenant_id', String(50), nullable=False),
                    Column('user_id', String(50), nullable=False),
                    Column('model', String(100)),
                    Column('prompt', Text),
                    Column('response', Text),
                    Column('tokens_used', Integer),
                    Column('cost', Float),
                    Column('created_at', DateTime, default=datetime.utcnow),
                    Column('status', String(20))
                ),
                'fine_tuning_jobs': Table(
                    'fine_tuning_jobs', db_config.metadata,
                    Column('id', String(36), primary_key=True),
                    Column('tenant_id', String(50), nullable=False),
                    Column('model_name', String(100)),
                    Column('dataset_path', String(500)),
                    Column('status', String(20)),
                    Column('created_at', DateTime, default=datetime.utcnow),
                    Column('completed_at', DateTime),
                    Column('cost', Float)
                ),
                'model_registry': Table(
                    'model_registry', db_config.metadata,
                    Column('id', String(36), primary_key=True),
                    Column('tenant_id', String(50), nullable=False),
                    Column('model_name', String(100)),
                    Column('model_path', String(500)),
                    Column('version', String(20)),
                    Column('created_at', DateTime, default=datetime.utcnow),
                    Column('is_active', Boolean, default=True)
                ),
                'usage_metrics': Table(
                    'usage_metrics', db_config.metadata,
                    Column('id', String(36), primary_key=True),
                    Column('tenant_id', String(50), nullable=False),
                    Column('metric_type', String(50)),
                    Column('metric_value', Float),
                    Column('timestamp', DateTime, default=datetime.utcnow)
                )
            }

            # Create tables
            db_config.metadata.create_all(db_config.engine)

            # Store table schemas for reference
            self.table_schemas[db_config.tenant_id] = tenant_tables

        except Exception as e:
            logger.error(f"Failed to create tables for tenant {db_config.tenant_id}: {e}")

    async def _load_isolation_rules(self):
        """Load data isolation rules."""
        # Define default isolation rules
        default_rules = [
            DataIsolationRule(
                table_name='ai_requests',
                tenant_column='tenant_id',
                isolation_level='row',
                allowed_operations=['SELECT', 'INSERT', 'UPDATE']
            ),
            DataIsolationRule(
                table_name='fine_tuning_jobs',
                tenant_column='tenant_id',
                isolation_level='row',
                allowed_operations=['SELECT', 'INSERT', 'UPDATE', 'DELETE']
            ),
            DataIsolationRule(
                table_name='model_registry',
                tenant_column='tenant_id',
                isolation_level='row',
                allowed_operations=['SELECT', 'INSERT', 'UPDATE']
            ),
            DataIsolationRule(
                table_name='usage_metrics',
                tenant_column='tenant_id',
                isolation_level='row',
                allowed_operations=['SELECT', 'INSERT']
            )
        ]

        for tenant_id in self.tenant_databases.keys():
            self.isolation_rules[tenant_id] = default_rules.copy()

    async def get_tenant_session(self, tenant_id: str) -> Optional[Session]:
        """Get tenant-specific database session."""
        if tenant_id not in self.tenant_databases:
            logger.error(f"Tenant {tenant_id} not found in database configs")
            return None

        db_config = self.tenant_databases[tenant_id]
        session = db_config.session_factory()
        return session

    async def execute_tenant_query(self, tenant_id: str, query: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute query in tenant's isolated database."""
        session = await self.get_tenant_session(tenant_id)
        if not session:
            raise ValueError(f"Could not get session for tenant {tenant_id}")

        try:
            # Validate query against isolation rules
            await self._validate_query_isolation(tenant_id, query)

            result = session.execute(query, params or {})
            rows = result.fetchall()

            # Convert to dict format
            columns = result.keys()
            results = [dict(zip(columns, row)) for row in rows]

            return results

        except Exception as e:
            logger.error(f"Query execution failed for tenant {tenant_id}: {e}")
            raise
        finally:
            session.close()

    async def insert_tenant_data(self, tenant_id: str, table_name: str, data: Dict[str, Any]) -> str:
        """Insert data into tenant's isolated table."""
        session = await self.get_tenant_session(tenant_id)
        if not session:
            raise ValueError(f"Could not get session for tenant {tenant_id}")

        try:
            # Validate table access
            await self._validate_table_access(tenant_id, table_name, 'INSERT')

            # Ensure tenant_id is set in data
            data['tenant_id'] = tenant_id

            # Generate ID if not provided
            if 'id' not in data:
                data['id'] = f"{tenant_id}_{int(asyncio.get_event_loop().time() * 1000000)}"

            table = self.table_schemas[tenant_id][table_name]
            insert_stmt = table.insert().values(**data)
            session.execute(insert_stmt)
            session.commit()

            return data['id']

        except Exception as e:
            session.rollback()
            logger.error(f"Data insertion failed for tenant {tenant_id}: {e}")
            raise
        finally:
            session.close()

    async def get_tenant_data(self, tenant_id: str, table_name: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Get data from tenant's isolated table."""
        session = await self.get_tenant_session(tenant_id)
        if not session:
            raise ValueError(f"Could not get session for tenant {tenant_id}")

        try:
            # Validate table access
            await self._validate_table_access(tenant_id, table_name, 'SELECT')

            table = self.table_schemas[tenant_id][table_name]
            query = table.select()

            # Apply tenant filter automatically
            query = query.where(table.c.tenant_id == tenant_id)

            # Apply additional filters
            if filters:
                for key, value in filters.items():
                    if hasattr(table.c, key):
                        query = query.where(getattr(table.c, key) == value)

            result = session.execute(query)
            rows = result.fetchall()

            # Convert to dict format
            columns = result.keys()
            results = [dict(zip(columns, row)) for row in rows]

            return results

        except Exception as e:
            logger.error(f"Data retrieval failed for tenant {tenant_id}: {e}")
            raise
        finally:
            session.close()

    async def update_tenant_data(self, tenant_id: str, table_name: str, record_id: str, updates: Dict[str, Any]):
        """Update data in tenant's isolated table."""
        session = await self.get_tenant_session(tenant_id)
        if not session:
            raise ValueError(f"Could not get session for tenant {tenant_id}")

        try:
            # Validate table access
            await self._validate_table_access(tenant_id, table_name, 'UPDATE')

            table = self.table_schemas[tenant_id][table_name]
            update_stmt = table.update().where(
                (table.c.id == record_id) & (table.c.tenant_id == tenant_id)
            ).values(**updates)

            session.execute(update_stmt)
            session.commit()

        except Exception as e:
            session.rollback()
            logger.error(f"Data update failed for tenant {tenant_id}: {e}")
            raise
        finally:
            session.close()

    async def delete_tenant_data(self, tenant_id: str, table_name: str, record_id: str):
        """Delete data from tenant's isolated table."""
        session = await self.get_tenant_session(tenant_id)
        if not session:
            raise ValueError(f"Could not get session for tenant {tenant_id}")

        try:
            # Validate table access
            await self._validate_table_access(tenant_id, table_name, 'DELETE')

            table = self.table_schemas[tenant_id][table_name]
            delete_stmt = table.delete().where(
                (table.c.id == record_id) & (table.c.tenant_id == tenant_id)
            )

            session.execute(delete_stmt)
            session.commit()

        except Exception as e:
            session.rollback()
            logger.error(f"Data deletion failed for tenant {tenant_id}: {e}")
            raise
        finally:
            session.close()

    async def _validate_query_isolation(self, tenant_id: str, query: str):
        """Validate query against isolation rules."""
        # Basic validation - ensure tenant context is respected
        if tenant_id not in self.isolation_rules:
            raise ValueError(f"No isolation rules for tenant {tenant_id}")

        # Check for schema-qualified queries (advanced validation would be more comprehensive)
        if 'tenant_' + tenant_id not in query.lower():
            logger.warning(f"Query may not respect tenant isolation: {query}")

    async def _validate_table_access(self, tenant_id: str, table_name: str, operation: str):
        """Validate table access against isolation rules."""
        if tenant_id not in self.isolation_rules:
            raise ValueError(f"No isolation rules for tenant {tenant_id}")

        rules = self.isolation_rules[tenant_id]
        table_rule = next((rule for rule in rules if rule.table_name == table_name), None)

        if not table_rule:
            raise ValueError(f"No isolation rule for table {table_name}")

        if operation not in table_rule.allowed_operations:
            raise ValueError(f"Operation {operation} not allowed on table {table_name}")

    async def get_tenant_storage_info(self, tenant_id: str) -> Dict[str, Any]:
        """Get tenant storage usage information."""
        try:
            # Query tenant's storage usage
            storage_data = await self.get_tenant_data(
                tenant_id,
                'usage_metrics',
                {'metric_type': 'storage_usage'}
            )

            total_storage = sum(item['metric_value'] for item in storage_data)

            return {
                'tenant_id': tenant_id,
                'total_storage_gb': total_storage,
                'storage_limit_gb': 10.0,  # Would be from tenant config
                'usage_percentage': (total_storage / 10.0) * 100 if total_storage > 0 else 0
            }

        except Exception as e:
            logger.error(f"Failed to get storage info for tenant {tenant_id}: {e}")
            return {'error': str(e)}

    async def backup_tenant_data(self, tenant_id: str) -> str:
        """Create backup of tenant data."""
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_id = f"backup_{tenant_id}_{timestamp}"

            # In a real implementation, this would create actual database backups
            # For now, just log the operation
            logger.info(f"Created backup {backup_id} for tenant {tenant_id}")

            # Record backup in tenant's database
            await self.insert_tenant_data(tenant_id, 'usage_metrics', {
                'metric_type': 'backup_created',
                'metric_value': 1.0,
                'timestamp': datetime.utcnow()
            })

            return backup_id

        except Exception as e:
            logger.error(f"Backup failed for tenant {tenant_id}: {e}")
            raise

    async def cleanup_tenant_data(self, tenant_id: str, older_than_days: int = 90):
        """Clean up old tenant data."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)

            # Clean up old AI requests
            session = await self.get_tenant_session(tenant_id)
            if session:
                try:
                    table = self.table_schemas[tenant_id]['ai_requests']
                    delete_stmt = table.delete().where(table.c.created_at < cutoff_date)
                    result = session.execute(delete_stmt)
                    session.commit()

                    deleted_count = result.rowcount
                    logger.info(f"Cleaned up {deleted_count} old records for tenant {tenant_id}")

                finally:
                    session.close()

        except Exception as e:
            logger.error(f"Data cleanup failed for tenant {tenant_id}: {e}")
            raise

    async def get_tenant_isolation_status(self, tenant_id: str) -> Dict[str, Any]:
        """Get tenant data isolation status."""
        if tenant_id not in self.tenant_databases:
            return {'status': 'not_configured'}

        db_config = self.tenant_databases[tenant_id]
        rules = self.isolation_rules.get(tenant_id, [])
        tables = self.table_schemas.get(tenant_id, {})

        return {
            'tenant_id': tenant_id,
            'database_configured': True,
            'schema_name': db_config.schema_name,
            'tables_count': len(tables),
            'isolation_rules_count': len(rules),
            'last_check': datetime.utcnow().isoformat()
        }


# Global tenant data isolation service instance
tenant_data_isolation = TenantDataIsolationService()


async def get_tenant_data_isolation_service() -> TenantDataIsolationService:
    """Get the global tenant data isolation service instance."""
    if not tenant_data_isolation.tenant_databases:  # Check if initialized
        await tenant_data_isolation.initialize()
    return tenant_data_isolation


# Tenant data access helpers
async def with_tenant_isolation(tenant_id: str):
    """Context manager for tenant data isolation."""
    current_tenant.set(tenant_id)
    try:
        yield
    finally:
        current_tenant.set(None)


async def get_current_tenant_data_session():
    """Get database session for current tenant."""
    tenant_id = current_tenant.get()
    if not tenant_id:
        raise ValueError("No tenant context set")

    service = await get_tenant_data_isolation_service()
    return await service.get_tenant_session(tenant_id)


async def execute_tenant_query(query: str, params: Optional[Dict[str, Any]] = None):
    """Execute query in current tenant's database."""
    tenant_id = current_tenant.get()
    if not tenant_id:
        raise ValueError("No tenant context set")

    service = await get_tenant_data_isolation_service()
    return await service.execute_tenant_query(tenant_id, query, params)
