"""Elasticsearch-based search service."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.config.settings import get_settings
from elasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError


class SearchService:
    """Elasticsearch search service."""

    def __init__(self, host: Optional[str] = None):
        """Initialize search service."""
        settings = get_settings()
        self.host = host or getattr(settings, "ELASTICSEARCH_HOST", "localhost:9200")

        self.client = Elasticsearch([f"http://{self.host}"])

        # Default indices
        self.workflow_index = "workflows"
        self.execution_index = "executions"
        self.logs_index = "logs"

        self._ensure_indices()

    def _ensure_indices(self):
        """Ensure required indices exist."""
        indices = [
            (
                self.workflow_index,
                {
                    "mappings": {
                        "properties": {
                            "name": {"type": "text", "analyzer": "standard"},
                            "description": {"type": "text", "analyzer": "standard"},
                            "tags": {"type": "keyword"},
                            "created_at": {"type": "date"},
                            "definition": {"type": "object", "enabled": False},
                        }
                    }
                },
            ),
            (
                self.execution_index,
                {
                    "mappings": {
                        "properties": {
                            "workflow_id": {"type": "keyword"},
                            "status": {"type": "keyword"},
                            "started_at": {"type": "date"},
                            "completed_at": {"type": "date"},
                            "error_message": {"type": "text"},
                        }
                    }
                },
            ),
            (
                self.logs_index,
                {
                    "mappings": {
                        "properties": {
                            "timestamp": {"type": "date"},
                            "level": {"type": "keyword"},
                            "message": {"type": "text"},
                            "service": {"type": "keyword"},
                            "execution_id": {"type": "keyword"},
                        }
                    }
                },
            ),
        ]

        for index_name, mapping in indices:
            try:
                if not self.client.indices.exists(index=index_name):
                    self.client.indices.create(index=index_name, body=mapping)
            except RequestError:
                pass  # Index might already exist

    def index_workflow(self, workflow_id: str, workflow_data: Dict[str, Any]) -> bool:
        """Index workflow for search."""
        try:
            doc = {
                "workflow_id": workflow_id,
                "name": workflow_data.get("name", ""),
                "description": workflow_data.get("description", ""),
                "tags": workflow_data.get("tags", []),
                "created_at": workflow_data.get("created_at", datetime.utcnow()),
                "definition": workflow_data.get("definition", {}),
            }

            self.client.index(index=self.workflow_index, id=workflow_id, body=doc)
            return True
        except Exception:
            return False

    def search_workflows(
        self, query: str, tags: Optional[List[str]] = None, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search workflows by text and tags."""
        must_clauses = []

        if query:
            must_clauses.append(
                {
                    "multi_match": {
                        "query": query,
                        "fields": ["name^2", "description"],
                        "type": "best_fields",
                    }
                }
            )

        if tags:
            must_clauses.append({"terms": {"tags": tags}})

        search_body = {
            "query": {
                "bool": {"must": must_clauses} if must_clauses else {"match_all": {}}
            },
            "size": limit,
            "sort": [{"_score": {"order": "desc"}}],
        }

        try:
            response = self.client.search(index=self.workflow_index, body=search_body)
            return [
                {"workflow_id": hit["_id"], "score": hit["_score"], **hit["_source"]}
                for hit in response["hits"]["hits"]
            ]
        except Exception:
            return []

    def index_execution(
        self, execution_id: str, execution_data: Dict[str, Any]
    ) -> bool:
        """Index workflow execution."""
        try:
            doc = {
                "execution_id": execution_id,
                "workflow_id": execution_data.get("workflow_id"),
                "status": execution_data.get("status"),
                "started_at": execution_data.get("started_at"),
                "completed_at": execution_data.get("completed_at"),
                "error_message": execution_data.get("error_message"),
                "input_data": execution_data.get("input_data", {}),
                "output_data": execution_data.get("output_data", {}),
            }

            self.client.index(index=self.execution_index, id=execution_id, body=doc)
            return True
        except Exception:
            return False

    def search_executions(
        self,
        workflow_id: Optional[str] = None,
        status: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Search workflow executions."""
        filters = []

        if workflow_id:
            filters.append({"term": {"workflow_id": workflow_id}})

        if status:
            filters.append({"term": {"status": status}})

        if date_range:
            filters.append(
                {
                    "range": {
                        "started_at": {
                            "gte": date_range.get("from"),
                            "lte": date_range.get("to"),
                        }
                    }
                }
            )

        search_body = {
            "query": {"bool": {"filter": filters} if filters else {"match_all": {}}},
            "size": limit,
            "sort": [{"started_at": {"order": "desc"}}],
        }

        try:
            response = self.client.search(index=self.execution_index, body=search_body)
            return [hit["_source"] for hit in response["hits"]["hits"]]
        except Exception:
            return []

    def index_log(self, log_data: Dict[str, Any]) -> bool:
        """Index log entry."""
        try:
            self.client.index(index=self.logs_index, body=log_data)
            return True
        except Exception:
            return False

    def search_logs(
        self,
        query: Optional[str] = None,
        level: Optional[str] = None,
        service: Optional[str] = None,
        execution_id: Optional[str] = None,
        time_range: Optional[Dict[str, str]] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Search logs."""
        must_clauses = []
        filters = []

        if query:
            must_clauses.append({"match": {"message": query}})

        if level:
            filters.append({"term": {"level": level}})

        if service:
            filters.append({"term": {"service": service}})

        if execution_id:
            filters.append({"term": {"execution_id": execution_id}})

        if time_range:
            filters.append(
                {
                    "range": {
                        "timestamp": {
                            "gte": time_range.get("from"),
                            "lte": time_range.get("to"),
                        }
                    }
                }
            )

        search_body = {
            "query": {"bool": {"must": must_clauses, "filter": filters}},
            "size": limit,
            "sort": [{"timestamp": {"order": "desc"}}],
        }

        try:
            response = self.client.search(index=self.logs_index, body=search_body)
            return [hit["_source"] for hit in response["hits"]["hits"]]
        except Exception:
            return []

    def get_analytics(self, index: str, field: str) -> Dict[str, Any]:
        """Get analytics aggregations."""
        try:
            search_body = {
                "size": 0,
                "aggs": {"field_stats": {"terms": {"field": field, "size": 10}}},
            }

            response = self.client.search(index=index, body=search_body)
            return response.get("aggregations", {})
        except Exception:
            return {}

    def health_check(self) -> Dict[str, Any]:
        """Check Elasticsearch health."""
        try:
            health = self.client.cluster.health()
            return {
                "status": "healthy",
                "cluster_status": health["status"],
                "number_of_nodes": health["number_of_nodes"],
                "active_shards": health["active_shards"],
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}


# Global search service instance
_search_service: Optional[SearchService] = None


def get_search_service() -> SearchService:
    """Get global search service instance."""
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service
