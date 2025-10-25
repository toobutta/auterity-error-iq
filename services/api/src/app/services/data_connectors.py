"""Data source connectors for various data providers."""

import asyncio
import json
import time
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import aiohttp
import redis
import psycopg2
import mysql.connector
import pymongo
from elasticsearch import Elasticsearch
import boto3
from google.cloud import bigquery
from snowflake.connector import connect as snowflake_connect

from app.middleware.logging import get_logger

logger = get_logger(__name__)


class DataSourceType(Enum):
    REST_API = "rest_api"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    REDIS = "redis"
    ELASTICSEARCH = "elasticsearch"
    S3 = "s3"
    BIGQUERY = "bigquery"
    SNOWFLAKE = "snowflake"
    KAFKA = "kafka"
    WEBSOCKET = "websocket"
    FILE_UPLOAD = "file_upload"


class ConnectionStatus(Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    ERROR = "error"


@dataclass
class DataSourceConnection:
    """Represents a data source connection."""
    id: str
    name: str
    type: DataSourceType
    config: Dict[str, Any]
    status: ConnectionStatus = ConnectionStatus.DISCONNECTED
    last_connected: Optional[float] = None
    error_message: Optional[str] = None
    connection_pool: Optional[Any] = None


@dataclass
class QueryResult:
    """Represents the result of a data query."""
    data: Union[List[Dict], Dict, str, bytes]
    metadata: Dict[str, Any]
    execution_time: float
    success: bool
    error_message: Optional[str] = None


class BaseDataConnector:
    """Base class for all data connectors."""

    def __init__(self, connection: DataSourceConnection):
        self.connection = connection
        self.logger = logger

    async def connect(self) -> bool:
        """Establish connection to the data source."""
        raise NotImplementedError

    async def disconnect(self) -> bool:
        """Close connection to the data source."""
        raise NotImplementedError

    async def test_connection(self) -> bool:
        """Test the connection to the data source."""
        raise NotImplementedError

    async def execute_query(self, query: str, params: Optional[Dict] = None) -> QueryResult:
        """Execute a query against the data source."""
        raise NotImplementedError

    async def get_schema(self) -> Dict[str, Any]:
        """Get schema information from the data source."""
        raise NotImplementedError


class RESTAPIConnector(BaseDataConnector):
    """Connector for REST API data sources."""

    def __init__(self, connection: DataSourceConnection):
        super().__init__(connection)
        self.session: Optional[aiohttp.ClientSession] = None
        self.base_url = connection.config.get('base_url', '')
        self.auth_type = connection.config.get('auth_type', 'none')
        self.auth_config = connection.config.get('auth_config', {})
        self.timeout = connection.config.get('timeout', 30)
        self.rate_limit = connection.config.get('rate_limit', 100)
        self.request_count = 0
        self.last_request_time = 0

    async def connect(self) -> bool:
        """Establish HTTP connection."""
        try:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)

            # Test connection
            test_url = self.base_url.rstrip('/') + self.connection.config.get('health_endpoint', '/')
            headers = self._get_auth_headers()

            async with self.session.get(test_url, headers=headers) as response:
                if response.status < 400:
                    self.connection.status = ConnectionStatus.CONNECTED
                    self.connection.last_connected = time.time()
                    return True
                else:
                    self.connection.status = ConnectionStatus.ERROR
                    self.connection.error_message = f"HTTP {response.status}: {response.reason}"
                    return False

        except Exception as e:
            self.connection.status = ConnectionStatus.ERROR
            self.connection.error_message = str(e)
            return False

    async def disconnect(self) -> bool:
        """Close HTTP connection."""
        if self.session:
            await self.session.close()
            self.session = None
        self.connection.status = ConnectionStatus.DISCONNECTED
        return True

    async def test_connection(self) -> bool:
        """Test the REST API connection."""
        return await self.connect()

    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers."""
        headers = {}

        if self.auth_type == 'bearer':
            token = self.auth_config.get('token', '')
            headers['Authorization'] = f'Bearer {token}'
        elif self.auth_type == 'basic':
            import base64
            username = self.auth_config.get('username', '')
            password = self.auth_config.get('password', '')
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            headers['Authorization'] = f'Basic {credentials}'
        elif self.auth_type == 'api_key':
            key_name = self.auth_config.get('key_name', 'X-API-Key')
            key_value = self.auth_config.get('key_value', '')
            headers[key_name] = key_value

        return headers

    async def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits."""
        current_time = time.time()

        # Reset counter every minute
        if current_time - self.last_request_time > 60:
            self.request_count = 0
            self.last_request_time = current_time

        if self.request_count >= self.rate_limit:
            return False

        self.request_count += 1
        return True

    async def execute_query(self, query: str, params: Optional[Dict] = None) -> QueryResult:
        """Execute HTTP request."""
        start_time = time.time()

        try:
            if not await self._check_rate_limit():
                return QueryResult(
                    data=[],
                    metadata={},
                    execution_time=time.time() - start_time,
                    success=False,
                    error_message="Rate limit exceeded"
                )

            if not self.session:
                await self.connect()
                if not self.session:
                    return QueryResult(
                        data=[],
                        metadata={},
                        execution_time=time.time() - start_time,
                        success=False,
                        error_message="Failed to establish connection"
                    )

            # Parse query as JSON request config
            request_config = json.loads(query) if query.startswith('{') else {'url': query}
            url = request_config.get('url', '')
            method = request_config.get('method', 'GET').upper()
            headers = {**self._get_auth_headers(), **request_config.get('headers', {})}
            body = request_config.get('body')

            # Make full URL
            if not url.startswith('http'):
                url = self.base_url.rstrip('/') + '/' + url.lstrip('/')

            # Execute request
            async with self.session.request(method, url, headers=headers, json=body) as response:
                response_data = await response.text()
                content_type = response.headers.get('content-type', '')

                try:
                    if 'json' in content_type:
                        data = json.loads(response_data)
                    else:
                        data = response_data
                except json.JSONDecodeError:
                    data = response_data

                return QueryResult(
                    data=data,
                    metadata={
                        'status_code': response.status,
                        'headers': dict(response.headers),
                        'url': str(response.url)
                    },
                    execution_time=time.time() - start_time,
                    success=response.status < 400
                )

        except Exception as e:
            return QueryResult(
                data=[],
                metadata={},
                execution_time=time.time() - start_time,
                success=False,
                error_message=str(e)
            )

    async def get_schema(self) -> Dict[str, Any]:
        """Get API schema information."""
        try:
            # Try to get OpenAPI/Swagger spec
            swagger_urls = ['/swagger.json', '/openapi.json', '/api-docs', '/docs']
            schema_data = None

            if self.session:
                for swagger_url in swagger_urls:
                    try:
                        url = self.base_url.rstrip('/') + swagger_url
                        headers = self._get_auth_headers()

                        async with self.session.get(url, headers=headers) as response:
                            if response.status == 200:
                                schema_data = await response.json()
                                break
                    except Exception:
                        continue

            return {
                'type': 'rest_api',
                'base_url': self.base_url,
                'auth_type': self.auth_type,
                'schema': schema_data,
                'endpoints': schema_data.get('paths', {}) if schema_data else {}
            }

        except Exception as e:
            return {
                'type': 'rest_api',
                'base_url': self.base_url,
                'error': str(e)
            }


class PostgreSQLConnector(BaseDataConnector):
    """Connector for PostgreSQL databases."""

    def __init__(self, connection: DataSourceConnection):
        super().__init__(connection)
        self.host = connection.config.get('host', 'localhost')
        self.port = connection.config.get('port', 5432)
        self.database = connection.config.get('database', '')
        self.username = connection.config.get('username', '')
        self.password = connection.config.get('password', '')
        self.ssl_mode = connection.config.get('ssl_mode', 'require')

    async def connect(self) -> bool:
        """Establish PostgreSQL connection."""
        try:
            # Use connection pool for better performance
            import asyncpg

            self.connection.connection_pool = await asyncpg.create_pool(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password,
                ssl=self.ssl_mode if self.ssl_mode != 'disable' else None,
                min_size=1,
                max_size=10
            )

            # Test connection
            async with self.connection.connection_pool.acquire() as conn:
                await conn.fetchval("SELECT 1")

            self.connection.status = ConnectionStatus.CONNECTED
            self.connection.last_connected = time.time()
            return True

        except Exception as e:
            self.connection.status = ConnectionStatus.ERROR
            self.connection.error_message = str(e)
            return False

    async def disconnect(self) -> bool:
        """Close PostgreSQL connection."""
        if self.connection.connection_pool:
            await self.connection.connection_pool.close()
            self.connection.connection_pool = None
        self.connection.status = ConnectionStatus.DISCONNECTED
        return True

    async def test_connection(self) -> bool:
        """Test PostgreSQL connection."""
        return await self.connect()

    async def execute_query(self, query: str, params: Optional[Dict] = None) -> QueryResult:
        """Execute PostgreSQL query."""
        start_time = time.time()

        try:
            if not self.connection.connection_pool:
                await self.connect()
                if not self.connection.connection_pool:
                    return QueryResult(
                        data=[],
                        metadata={},
                        execution_time=time.time() - start_time,
                        success=False,
                        error_message="Failed to establish connection"
                    )

            async with self.connection.connection_pool.acquire() as conn:
                # Execute query
                if params:
                    result = await conn.fetch(query, *params.values())
                else:
                    result = await conn.fetch(query)

                # Convert to list of dicts
                data = [dict(row) for row in result]

                return QueryResult(
                    data=data,
                    metadata={
                        'row_count': len(data),
                        'columns': list(data[0].keys()) if data else []
                    },
                    execution_time=time.time() - start_time,
                    success=True
                )

        except Exception as e:
            return QueryResult(
                data=[],
                metadata={},
                execution_time=time.time() - start_time,
                success=False,
                error_message=str(e)
            )

    async def get_schema(self) -> Dict[str, Any]:
        """Get PostgreSQL schema information."""
        try:
            schema_query = """
                SELECT
                    schemaname,
                    tablename,
                    tableowner,
                    tablespace,
                    hasindexes,
                    hasrules,
                    hastriggers,
                    rowsecurity
                FROM pg_tables
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY schemaname, tablename
            """

            result = await self.execute_query(schema_query)
            if result.success:
                return {
                    'type': 'postgresql',
                    'database': self.database,
                    'tables': result.data,
                    'table_count': len(result.data)
                }
            else:
                return {
                    'type': 'postgresql',
                    'database': self.database,
                    'error': result.error_message
                }

        except Exception as e:
            return {
                'type': 'postgresql',
                'database': self.database,
                'error': str(e)
            }


class MongoDBConnector(BaseDataConnector):
    """Connector for MongoDB databases."""

    def __init__(self, connection: DataSourceConnection):
        super().__init__(connection)
        self.host = connection.config.get('host', 'localhost')
        self.port = connection.config.get('port', 27017)
        self.database = connection.config.get('database', '')
        self.username = connection.config.get('username', '')
        self.password = connection.config.get('password', '')
        self.auth_source = connection.config.get('auth_source', 'admin')

    async def connect(self) -> bool:
        """Establish MongoDB connection."""
        try:
            import motor.motor_asyncio

            # Build connection string
            connection_string = f"mongodb://{self.username}:{self.password}@{self.host}:{self.port}/{self.auth_source}"

            self.connection.connection_pool = motor.motor_asyncio.AsyncIOMotorClient(connection_string)
            self.db = self.connection.connection_pool[self.database]

            # Test connection
            await self.db.command('ping')

            self.connection.status = ConnectionStatus.CONNECTED
            self.connection.last_connected = time.time()
            return True

        except Exception as e:
            self.connection.status = ConnectionStatus.ERROR
            self.connection.error_message = str(e)
            return False

    async def disconnect(self) -> bool:
        """Close MongoDB connection."""
        if self.connection.connection_pool:
            self.connection.connection_pool.close()
            self.connection.connection_pool = None
        self.connection.status = ConnectionStatus.DISCONNECTED
        return True

    async def test_connection(self) -> bool:
        """Test MongoDB connection."""
        return await self.connect()

    async def execute_query(self, query: str, params: Optional[Dict] = None) -> QueryResult:
        """Execute MongoDB query."""
        start_time = time.time()

        try:
            if not self.connection.connection_pool:
                await self.connect()
                if not self.connection.connection_pool:
                    return QueryResult(
                        data=[],
                        metadata={},
                        execution_time=time.time() - start_time,
                        success=False,
                        error_message="Failed to establish connection"
                    )

            # Parse query
            query_config = json.loads(query) if query.startswith('{') else {'collection': 'default'}
            collection_name = query_config.get('collection', 'default')
            operation = query_config.get('operation', 'find')
            filter_doc = query_config.get('filter', {})
            projection = query_config.get('projection')
            limit = query_config.get('limit', 1000)

            collection = self.db[collection_name]

            if operation == 'find':
                cursor = collection.find(filter_doc, projection).limit(limit)
                documents = await cursor.to_list(length=limit)
                data = documents

            elif operation == 'find_one':
                document = await collection.find_one(filter_doc, projection)
                data = document or {}

            elif operation == 'count':
                count = await collection.count_documents(filter_doc)
                data = {'count': count}

            elif operation == 'aggregate':
                pipeline = query_config.get('pipeline', [])
                cursor = collection.aggregate(pipeline)
                documents = await cursor.to_list(length=limit)
                data = documents

            else:
                return QueryResult(
                    data=[],
                    metadata={},
                    execution_time=time.time() - start_time,
                    success=False,
                    error_message=f"Unsupported operation: {operation}"
                )

            return QueryResult(
                data=data,
                metadata={
                    'collection': collection_name,
                    'operation': operation,
                    'count': len(data) if isinstance(data, list) else 1
                },
                execution_time=time.time() - start_time,
                success=True
            )

        except Exception as e:
            return QueryResult(
                data=[],
                metadata={},
                execution_time=time.time() - start_time,
                success=False,
                error_message=str(e)
            )

    async def get_schema(self) -> Dict[str, Any]:
        """Get MongoDB schema information."""
        try:
            collections = await self.db.list_collection_names()

            schema_info = []
            for collection_name in collections:
                collection = self.db[collection_name]
                sample_doc = await collection.find_one()
                schema_info.append({
                    'name': collection_name,
                    'sample_document': sample_doc,
                    'document_count': await collection.count_documents({})
                })

            return {
                'type': 'mongodb',
                'database': self.database,
                'collections': schema_info,
                'collection_count': len(collections)
            }

        except Exception as e:
            return {
                'type': 'mongodb',
                'database': self.database,
                'error': str(e)
            }


class DataConnectorFactory:
    """Factory for creating data connectors."""

    @staticmethod
    def create_connector(connection: DataSourceConnection) -> BaseDataConnector:
        """Create appropriate connector based on data source type."""
        if connection.type == DataSourceType.REST_API:
            return RESTAPIConnector(connection)
        elif connection.type == DataSourceType.POSTGRESQL:
            return PostgreSQLConnector(connection)
        elif connection.type == DataSourceType.MONGODB:
            return MongoDBConnector(connection)
        else:
            raise ValueError(f"Unsupported data source type: {connection.type}")


class DataConnectorManager:
    """Manager for data source connections and operations."""

    def __init__(self, redis_url: str = "redis://localhost:6379/4"):
        self.redis = redis.Redis.from_url(redis_url, decode_responses=True)
        self.connectors: Dict[str, BaseDataConnector] = {}
        self.connections: Dict[str, DataSourceConnection] = {}

    async def add_connection(self, connection: DataSourceConnection) -> bool:
        """Add a new data source connection."""
        try:
            connector = DataConnectorFactory.create_connector(connection)
            self.connectors[connection.id] = connector
            self.connections[connection.id] = connection

            # Persist connection
            self._save_connection(connection)

            return True
        except Exception as e:
            logger.error(f"Failed to add connection {connection.id}: {str(e)}")
            return False

    async def remove_connection(self, connection_id: str) -> bool:
        """Remove a data source connection."""
        try:
            if connection_id in self.connectors:
                await self.connectors[connection_id].disconnect()
                del self.connectors[connection_id]
                del self.connections[connection_id]

                # Remove from Redis
                self.redis.delete(f"data_connection:{connection_id}")

            return True
        except Exception as e:
            logger.error(f"Failed to remove connection {connection_id}: {str(e)}")
            return False

    async def test_connection(self, connection_id: str) -> bool:
        """Test a data source connection."""
        if connection_id not in self.connectors:
            return False

        return await self.connectors[connection_id].test_connection()

    async def execute_query(
        self,
        connection_id: str,
        query: str,
        params: Optional[Dict] = None
    ) -> QueryResult:
        """Execute a query against a data source."""
        if connection_id not in self.connectors:
            return QueryResult(
                data=[],
                metadata={},
                execution_time=0,
                success=False,
                error_message="Connection not found"
            )

        connector = self.connectors[connection_id]

        # Ensure connection is established
        if self.connections[connection_id].status != ConnectionStatus.CONNECTED:
            await connector.connect()

        return await connector.execute_query(query, params)

    async def get_schema(self, connection_id: str) -> Dict[str, Any]:
        """Get schema information for a data source."""
        if connection_id not in self.connectors:
            return {"error": "Connection not found"}

        connector = self.connectors[connection_id]
        return await connector.get_schema()

    def get_connections(self) -> List[DataSourceConnection]:
        """Get all connections."""
        return list(self.connections.values())

    def get_connection(self, connection_id: str) -> Optional[DataSourceConnection]:
        """Get a specific connection."""
        return self.connections.get(connection_id)

    def _save_connection(self, connection: DataSourceConnection):
        """Save connection to Redis."""
        key = f"data_connection:{connection.id}"
        data = {
            'id': connection.id,
            'name': connection.name,
            'type': connection.type.value,
            'config': connection.config,
            'status': connection.status.value,
            'last_connected': connection.last_connected,
            'error_message': connection.error_message
        }
        self.redis.setex(key, 86400, json.dumps(data))  # 24 hours TTL

    def _load_connection(self, connection_id: str) -> Optional[DataSourceConnection]:
        """Load connection from Redis."""
        key = f"data_connection:{connection_id}"
        data = self.redis.get(key)

        if data:
            parsed_data = json.loads(data)
            return DataSourceConnection(
                id=parsed_data['id'],
                name=parsed_data['name'],
                type=DataSourceType(parsed_data['type']),
                config=parsed_data['config'],
                status=ConnectionStatus(parsed_data['status']),
                last_connected=parsed_data.get('last_connected'),
                error_message=parsed_data.get('error_message')
            )

        return None


# Global data connector manager instance
data_connector_manager = DataConnectorManager()


async def get_data_connector_manager() -> DataConnectorManager:
    """Dependency injection for data connector manager."""
    return data_connector_manager
