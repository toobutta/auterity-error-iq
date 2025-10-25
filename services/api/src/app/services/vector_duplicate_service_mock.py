"""Mock Vector Duplicate Service for testing without heavy ML dependencies."""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

import numpy as np

logger = logging.getLogger(__name__)


class MockVectorDuplicateService:
    """Mock implementation of Vector Duplicate Service for testing."""

    def __init__(self):
        self.logger = logger
        self.logger.info("MockVectorDuplicateService initialized")

    async def generate_embedding(self, text: str) -> List[float]:
        """Mock generate embedding vector."""
        self.logger.info("Mock generating embedding")

        # Generate a mock 384-dimensional vector based on text content
        # This is deterministic for the same input
        np.random.seed(hash(text) % 2**32)
        embedding = np.random.normal(0, 1, 384).tolist()

        # Normalize the vector
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = [x / norm for x in embedding]

        return embedding

    async def calculate_similarity(
        self, embedding1: List[float], embedding2: List[float]
    ) -> float:
        """Mock calculate cosine similarity between two embeddings."""
        self.logger.info("Mock calculating similarity")

        # Convert to numpy arrays for calculation
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        # Calculate cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = dot_product / (norm1 * norm2)
        return float(similarity)

    async def find_similar_items(
        self,
        query_embedding: List[float],
        embeddings: List[Dict[str, Any]],
        threshold: float = 0.8,
    ) -> List[Dict[str, Any]]:
        """Mock find similar items based on embedding similarity."""
        self.logger.info("Mock finding similar items")

        similar_items = []

        for item in embeddings:
            similarity = await self.calculate_similarity(
                query_embedding, item["embedding"]
            )
            if similarity >= threshold:
                similar_items.append({**item, "similarity_score": similarity})

        # Sort by similarity score
        similar_items.sort(key=lambda x: x["similarity_score"], reverse=True)
        return similar_items

    async def detect_duplicates(
        self, tenant_id: UUID, content: str, item_type: str
    ) -> Dict[str, Any]:
        """Mock detect duplicates for given content."""
        self.logger.info(f"Mock detecting duplicates for tenant {tenant_id}")

        # Generate mock embedding
        embedding = await self.generate_embedding(content)

        # Mock duplicate detection results
        duplicates = []
        if "urgent" in content.lower():
            # Mock finding similar urgent items
            duplicates = [
                {
                    "id": str(uuid.uuid4()),
                    "similarity_score": 0.92,
                    "content_preview": "Urgent issue with system...",
                    "created_at": datetime.utcnow().isoformat(),
                }
            ]

        return {
            "tenant_id": str(tenant_id),
            "content_hash": str(hash(content)),
            "embedding": embedding,
            "duplicates_found": len(duplicates),
            "duplicates": duplicates,
            "processing_time_ms": 120,
        }

    async def create_similarity_cluster(
        self,
        tenant_id: UUID,
        items: List[Dict[str, Any]],
        threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """Mock create similarity clusters."""
        self.logger.info(
            f"Mock creating similarity clusters for tenant {tenant_id}"
        )

        # Simple mock clustering
        clusters = []
        if items:
            # Create a mock cluster
            cluster_id = str(uuid.uuid4())
            clusters.append(
                {
                    "cluster_id": cluster_id,
                    "tenant_id": str(tenant_id),
                    "items_count": len(items),
                    "centroid_embedding": items[0]["embedding"]
                    if items
                    else [],
                    "similarity_threshold": threshold,
                    "created_at": datetime.utcnow().isoformat(),
                }
            )

        return clusters
