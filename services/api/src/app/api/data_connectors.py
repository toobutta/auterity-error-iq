"""API endpoints for data source connections and queries."""

from typing import List, Optional, Dict, Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks

from app.auth import get_current_active_user
from app.models.user import User
from app.services.data_connectors import (
    DataConnectorManager,
    DataSourceConnection,
    DataSourceType,
    ConnectionStatus,
    get_data_connector_manager
)
from app.middleware.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/data-connectors", tags=["data-connectors"])


@router.post("/connections", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_connection(
    connection_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Create a new data source connection."""

    # Validate required fields
    required_fields = ['name', 'type', 'config']
    for field in required_fields:
        if field not in connection_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required field: {field}"
            )

    # Validate data source type
    try:
        data_source_type = DataSourceType(connection_data['type'])
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid data source type: {connection_data['type']}"
        )

    # Create connection object
    connection = DataSourceConnection(
        id=str(uuid4()),
        name=connection_data['name'],
        type=data_source_type,
        config=connection_data['config']
    )

    # Add connection
    success = await manager.add_connection(connection)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create connection"
        )

    return {
        "id": connection.id,
        "name": connection.name,
        "type": connection.type.value,
        "status": connection.status.value,
        "message": "Connection created successfully"
    }


@router.get("/connections", response_model=List[Dict[str, Any]])
async def list_connections(
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """List all data source connections."""

    connections = manager.get_connections()
    return [
        {
            "id": conn.id,
            "name": conn.name,
            "type": conn.type.value,
            "status": conn.status.value,
            "last_connected": conn.last_connected,
            "error_message": conn.error_message
        }
        for conn in connections
    ]


@router.get("/connections/{connection_id}", response_model=Dict[str, Any])
async def get_connection(
    connection_id: str,
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Get a specific data source connection."""

    connection = manager.get_connection(connection_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    return {
        "id": connection.id,
        "name": connection.name,
        "type": connection.type.value,
        "config": connection.config,
        "status": connection.status.value,
        "last_connected": connection.last_connected,
        "error_message": connection.error_message
    }


@router.put("/connections/{connection_id}", response_model=Dict[str, Any])
async def update_connection(
    connection_id: str,
    update_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Update a data source connection."""

    connection = manager.get_connection(connection_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Update allowed fields
    allowed_fields = ['name', 'config']
    for field in allowed_fields:
        if field in update_data:
            setattr(connection, field, update_data[field])

    # Validate data source type if updating config
    if 'config' in update_data and 'type' in update_data:
        try:
            connection.type = DataSourceType(update_data['type'])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid data source type: {update_data['type']}"
            )

    return {
        "id": connection.id,
        "name": connection.name,
        "type": connection.type.value,
        "config": connection.config,
        "status": connection.status.value,
        "message": "Connection updated successfully"
    }


@router.delete("/connections/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: str,
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Delete a data source connection."""

    success = await manager.remove_connection(connection_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete connection"
        )


@router.post("/connections/{connection_id}/test", response_model=Dict[str, Any])
async def test_connection(
    connection_id: str,
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Test a data source connection."""

    success = await manager.test_connection(connection_id)
    connection = manager.get_connection(connection_id)

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    return {
        "id": connection.id,
        "name": connection.name,
        "success": success,
        "status": connection.status.value,
        "error_message": connection.error_message,
        "last_tested": connection.last_connected
    }


@router.post("/connections/{connection_id}/query", response_model=Dict[str, Any])
async def execute_query(
    connection_id: str,
    query_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Execute a query against a data source."""

    connection = manager.get_connection(connection_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Validate query data
    if 'query' not in query_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing query field"
        )

    query = query_data['query']
    params = query_data.get('params')

    # Execute query
    result = await manager.execute_query(connection_id, query, params)

    # Log query execution for analytics
    background_tasks.add_task(
        log_query_execution,
        current_user.id,
        connection_id,
        query,
        result.execution_time,
        result.success
    )

    return {
        "data": result.data,
        "metadata": result.metadata,
        "execution_time": result.execution_time,
        "success": result.success,
        "error_message": result.error_message
    }


@router.get("/connections/{connection_id}/schema", response_model=Dict[str, Any])
async def get_connection_schema(
    connection_id: str,
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Get schema information for a data source connection."""

    schema_info = await manager.get_schema(connection_id)

    return schema_info


@router.get("/types", response_model=List[Dict[str, str]])
async def get_supported_types(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of supported data source types."""

    return [
        {"value": ds_type.value, "label": ds_type.value.replace('_', ' ').title()}
        for ds_type in DataSourceType
    ]


@router.get("/connections/{connection_id}/health", response_model=Dict[str, Any])
async def get_connection_health(
    connection_id: str,
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Get health status of a data source connection."""

    connection = manager.get_connection(connection_id)
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )

    # Perform health check
    is_healthy = await manager.test_connection(connection_id)

    return {
        "id": connection.id,
        "name": connection.name,
        "healthy": is_healthy,
        "status": connection.status.value,
        "last_connected": connection.last_connected,
        "error_message": connection.error_message,
        "response_time": None  # Could be measured during test
    }


@router.post("/bulk-test", response_model=List[Dict[str, Any]])
async def bulk_test_connections(
    connection_ids: List[str],
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Test multiple data source connections."""

    results = []
    for connection_id in connection_ids:
        try:
            success = await manager.test_connection(connection_id)
            connection = manager.get_connection(connection_id)

            if connection:
                results.append({
                    "id": connection.id,
                    "name": connection.name,
                    "success": success,
                    "status": connection.status.value,
                    "error_message": connection.error_message
                })
        except Exception as e:
            results.append({
                "id": connection_id,
                "success": False,
                "error_message": str(e)
            })

    return results


@router.get("/analytics", response_model=Dict[str, Any])
async def get_connector_analytics(
    current_user: User = Depends(get_current_active_user),
    manager: DataConnectorManager = Depends(get_data_connector_manager)
):
    """Get analytics about data connector usage."""

    connections = manager.get_connections()

    # Count by type and status
    type_counts = {}
    status_counts = {}

    for conn in connections:
        # Count by type
        conn_type = conn.type.value
        if conn_type not in type_counts:
            type_counts[conn_type] = 0
        type_counts[conn_type] += 1

        # Count by status
        conn_status = conn.status.value
        if conn_status not in status_counts:
            status_counts[conn_status] = 0
        status_counts[conn_status] += 1

    return {
        "total_connections": len(connections),
        "connections_by_type": type_counts,
        "connections_by_status": status_counts,
        "healthy_connections": len([c for c in connections if c.status == ConnectionStatus.CONNECTED]),
        "unhealthy_connections": len([c for c in connections if c.status == ConnectionStatus.ERROR])
    }


async def log_query_execution(
    user_id: str,
    connection_id: str,
    query: str,
    execution_time: float,
    success: bool
):
    """Log query execution for analytics."""
    try:
        # This would typically be stored in a database or analytics system
        logger.info(
            f"Query executed - User: {user_id}, Connection: {connection_id}, "
            f"Success: {success}, Time: {execution_time:.3f}s"
        )
    except Exception as e:
        logger.error(f"Failed to log query execution: {str(e)}")


# Example query templates for different data source types
@router.get("/query-templates/{data_source_type}", response_model=List[Dict[str, Any]])
async def get_query_templates(
    data_source_type: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get query templates for a specific data source type."""

    templates = {
        "rest_api": [
            {
                "name": "GET Request",
                "description": "Make a GET request to an API endpoint",
                "template": '{"url": "/api/data", "method": "GET"}'
            },
            {
                "name": "POST Request",
                "description": "Make a POST request with JSON body",
                "template": '{"url": "/api/data", "method": "POST", "body": {"key": "value"}}'
            }
        ],
        "postgresql": [
            {
                "name": "Select All",
                "description": "Select all records from a table",
                "template": "SELECT * FROM table_name LIMIT 1000"
            },
            {
                "name": "Count Records",
                "description": "Count total records in a table",
                "template": "SELECT COUNT(*) FROM table_name"
            }
        ],
        "mongodb": [
            {
                "name": "Find Documents",
                "description": "Find documents in a collection",
                "template": '{"collection": "collection_name", "operation": "find", "filter": {}}'
            },
            {
                "name": "Count Documents",
                "description": "Count documents in a collection",
                "template": '{"collection": "collection_name", "operation": "count", "filter": {}}'
            }
        ]
    }

    return templates.get(data_source_type, [])
