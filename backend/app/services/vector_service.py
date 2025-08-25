"""Qdrant vector database service."""

import uuid
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

from ..config.settings import get_settings


class VectorService:
    """Qdrant vector database service."""

    def __init__(self, host: Optional[str] = None, port: Optional[int] = None):
        """Initialize vector service."""
        settings = get_settings()
        self.host = host or getattr(settings, "QDRANT_HOST", "localhost")
        self.port = port or getattr(settings, "QDRANT_PORT", 6333)

        self.client = QdrantClient(host=self.host, port=self.port)
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")  # Lightweight model

        # Default collection for workflow contexts
        self.default_collection = "workflow_contexts"
        self._ensure_collection(self.default_collection)

    def _ensure_collection(self, collection_name: str):
        """Ensure collection exists."""
        try:
            collections = self.client.get_collections().collections
            if not any(c.name == collection_name for c in collections):
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
        except Exception:
            pass  # Collection might already exist

    def embed_text(self, text: str) -> List[float]:
        """Generate embeddings for text."""
        return self.encoder.encode(text).tolist()

    def store_vector(
        self,
        collection_name: str,
        text: str,
        metadata: Dict[str, Any],
        point_id: Optional[str] = None,
    ) -> str:
        """Store text with vector embedding."""
        self._ensure_collection(collection_name)

        vector = self.embed_text(text)
        point_id = point_id or str(uuid.uuid4())

        point = PointStruct(
            id=point_id, vector=vector, payload={**metadata, "text": text}
        )

        self.client.upsert(collection_name=collection_name, points=[point])
        return point_id

    def search_similar(
        self,
        collection_name: str,
        query_text: str,
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors."""
        query_vector = self.embed_text(query_text)

        results = self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit,
            score_threshold=score_threshold,
        )

        return [
            {
                "id": result.id,
                "score": result.score,
                "text": result.payload.get("text"),
                "metadata": {k: v for k, v in result.payload.items() if k != "text"},
            }
            for result in results
        ]

    def delete_vector(self, collection_name: str, point_id: str) -> bool:
        """Delete vector by ID."""
        try:
            self.client.delete(
                collection_name=collection_name, points_selector=[point_id]
            )
            return True
        except Exception:
            return False

    def get_collection_info(self, collection_name: str) -> Dict[str, Any]:
        """Get collection information."""
        try:
            info = self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "vectors_count": info.vectors_count,
                "status": info.status,
            }
        except Exception:
            return {"name": collection_name, "status": "not_found"}


# Global vector service instance
_vector_service: Optional[VectorService] = None


def get_vector_service() -> VectorService:
    """Get global vector service instance."""
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
