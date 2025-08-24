"""Vector Duplicate Service - Real-time similarity detection using vector embeddings."""

import hashlib
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

import numpy as np
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.auterity_expansion import VectorEmbedding
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class SimilarityResult:
    """Container for similarity search results."""

    def __init__(
        self,
        item_id: UUID,
        item_type: str,
        similarity_score: float,
        content_preview: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.item_id = item_id
        self.item_type = item_type
        self.similarity_score = similarity_score
        self.content_preview = content_preview
        self.metadata = metadata or {}


class VectorDuplicateService:
    """Service for vector-based similarity detection and duplicate prevention."""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService()
        self._embedding_cache: Dict[str, List[float]] = {}

    async def find_similar_items(
        self,
        content: str,
        item_type: str,
        tenant_id: UUID,
        threshold: float = 0.8,
        limit: int = 10,
    ) -> List[SimilarityResult]:
        """Find similar items using vector similarity search."""
        try:
            # Generate embedding for input content
            input_embedding = await self._generate_embedding(content)
            if not input_embedding:
                return []

            # Get existing embeddings for the tenant and item type
            existing_embeddings = (
                self.db.query(VectorEmbedding)
                .filter(
                    and_(
                        VectorEmbedding.tenant_id == tenant_id,
                        VectorEmbedding.item_type == item_type,
                    )
                )
                .all()
            )

            if not existing_embeddings:
                return []

            # Calculate similarities
            similarities = []
            for embedding in existing_embeddings:
                similarity = self._calculate_cosine_similarity(
                    input_embedding, embedding.embedding_vector
                )

                if similarity >= threshold:
                    similarities.append(
                        {"embedding": embedding, "similarity_score": similarity}
                    )

            # Sort by similarity and limit results
            similarities.sort(key=lambda x: x["similarity_score"], reverse=True)
            similarities = similarities[:limit]

            # Convert to SimilarityResult objects
            results = []
            for item in similarities:
                embedding = item["embedding"]
                similarity_score = item["similarity_score"]

                # Get content preview from metadata or generate one
                content_preview = self._get_content_preview(embedding, content)

                result = SimilarityResult(
                    item_id=embedding.item_id,
                    item_type=embedding.item_type,
                    similarity_score=similarity_score,
                    content_preview=content_preview,
                    metadata=embedding.metadata,
                )
                results.append(result)

            return results

        except Exception as e:
            logger.error(f"Similarity search failed: {str(e)}")
            return []

    async def create_embedding(
        self,
        tenant_id: UUID,
        item_type: str,
        item_id: UUID,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[VectorEmbedding]:
        """Create a new vector embedding."""
        try:
            # Generate embedding for content
            embedding_vector = await self._generate_embedding(content)
            if not embedding_vector:
                return None

            # Create content hash
            content_hash = hashlib.sha256(content.encode()).hexdigest()

            # Check if embedding already exists
            existing = (
                self.db.query(VectorEmbedding)
                .filter(
                    and_(
                        VectorEmbedding.tenant_id == tenant_id,
                        VectorEmbedding.item_type == item_type,
                        VectorEmbedding.item_id == item_id,
                        VectorEmbedding.content_hash == content_hash,
                    )
                )
                .first()
            )

            if existing:
                # Update existing embedding
                existing.embedding_vector = embedding_vector
                existing.metadata = metadata or existing.metadata
                self.db.commit()
                return existing

            # Create new embedding
            embedding = VectorEmbedding(
                tenant_id=tenant_id,
                item_type=item_type,
                item_id=item_id,
                content_hash=content_hash,
                embedding_vector=embedding_vector,
                metadata=metadata or {},
            )

            self.db.add(embedding)
            self.db.commit()
            self.db.refresh(embedding)

            return embedding

        except Exception as e:
            logger.error(f"Failed to create embedding: {str(e)}")
            self.db.rollback()
            return None

    async def update_embedding(
        self,
        embedding_id: UUID,
        tenant_id: UUID,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[VectorEmbedding]:
        """Update an existing vector embedding."""
        try:
            embedding = (
                self.db.query(VectorEmbedding)
                .filter(
                    and_(
                        VectorEmbedding.id == embedding_id,
                        VectorEmbedding.tenant_id == tenant_id,
                    )
                )
                .first()
            )

            if not embedding:
                return None

            # Generate new embedding
            new_embedding_vector = await self._generate_embedding(content)
            if not new_embedding_vector:
                return None

            # Update embedding
            embedding.embedding_vector = new_embedding_vector
            embedding.content_hash = hashlib.sha256(content.encode()).hexdigest()
            if metadata:
                embedding.metadata = metadata

            self.db.commit()
            self.db.refresh(embedding)

            return embedding

        except Exception as e:
            logger.error(f"Failed to update embedding: {str(e)}")
            self.db.rollback()
            return None

    async def delete_embedding(self, embedding_id: UUID, tenant_id: UUID) -> bool:
        """Delete a vector embedding."""
        try:
            embedding = (
                self.db.query(VectorEmbedding)
                .filter(
                    and_(
                        VectorEmbedding.id == embedding_id,
                        VectorEmbedding.tenant_id == tenant_id,
                    )
                )
                .first()
            )

            if not embedding:
                return False

            self.db.delete(embedding)
            self.db.commit()

            return True

        except Exception as e:
            logger.error(f"Failed to delete embedding: {str(e)}")
            self.db.rollback()
            return False

    async def batch_create_embeddings(
        self, tenant_id: UUID, items: List[Dict[str, Any]]
    ) -> List[VectorEmbedding]:
        """Create multiple embeddings in batch."""
        try:
            created_embeddings = []

            for item in items:
                embedding = await self.create_embedding(
                    tenant_id=tenant_id,
                    item_type=item["item_type"],
                    item_id=item["item_id"],
                    content=item["content"],
                    metadata=item.get("metadata"),
                )

                if embedding:
                    created_embeddings.append(embedding)

            return created_embeddings

        except Exception as e:
            logger.error(f"Batch embedding creation failed: {str(e)}")
            return []

    async def get_similarity_clusters(
        self,
        tenant_id: UUID,
        item_type: str,
        min_similarity: float = 0.7,
        min_cluster_size: int = 2,
    ) -> List[Dict[str, Any]]:
        """Get clusters of similar items."""
        try:
            embeddings = (
                self.db.query(VectorEmbedding)
                .filter(
                    and_(
                        VectorEmbedding.tenant_id == tenant_id,
                        VectorEmbedding.item_type == item_type,
                    )
                )
                .all()
            )

            if len(embeddings) < min_cluster_size:
                return []

            # Simple clustering using similarity threshold
            clusters = []
            processed = set()

            for i, embedding in enumerate(embeddings):
                if embedding.id in processed:
                    continue

                cluster = [embedding]
                processed.add(embedding.id)

                # Find similar embeddings
                for j, other_embedding in enumerate(embeddings):
                    if i == j or other_embedding.id in processed:
                        continue

                    similarity = self._calculate_cosine_similarity(
                        embedding.embedding_vector, other_embedding.embedding_vector
                    )

                    if similarity >= min_similarity:
                        cluster.append(other_embedding)
                        processed.add(other_embedding.id)

                # Only include clusters that meet minimum size
                if len(cluster) >= min_cluster_size:
                    clusters.append(
                        {
                            "cluster_id": len(clusters),
                            "size": len(cluster),
                            "items": [
                                {
                                    "id": item.item_id,
                                    "content_hash": item.content_hash,
                                    "metadata": item.metadata,
                                }
                                for item in cluster
                            ],
                            "representative_content": self._get_cluster_representative(
                                cluster
                            ),
                        }
                    )

            return clusters

        except Exception as e:
            logger.error(f"Failed to get similarity clusters: {str(e)}")
            return []

    async def get_duplicate_analysis(
        self, tenant_id: UUID, item_type: str, days: int = 30
    ) -> Dict[str, Any]:
        """Get duplicate analysis metrics."""
        try:
            from datetime import datetime, timedelta

            cutoff_date = datetime.utcnow() - timedelta(days=days)

            # Get embeddings created in the time period
            recent_embeddings = (
                self.db.query(VectorEmbedding)
                .filter(
                    and_(
                        VectorEmbedding.tenant_id == tenant_id,
                        VectorEmbedding.item_type == item_type,
                        VectorEmbedding.created_at >= cutoff_date,
                    )
                )
                .all()
            )

            if not recent_embeddings:
                return {
                    "total_items": 0,
                    "potential_duplicates": 0,
                    "duplicate_percentage": 0.0,
                    "avg_similarity": 0.0,
                }

            # Analyze for potential duplicates
            potential_duplicates = 0
            total_similarities = 0.0
            similarity_count = 0

            for i, embedding in enumerate(recent_embeddings):
                for j, other_embedding in enumerate(recent_embeddings):
                    if i >= j:
                        continue

                    similarity = self._calculate_cosine_similarity(
                        embedding.embedding_vector, other_embedding.embedding_vector
                    )

                    if similarity >= 0.8:  # High similarity threshold
                        potential_duplicates += 1

                    total_similarities += similarity
                    similarity_count += 1

            avg_similarity = (
                total_similarities / similarity_count if similarity_count > 0 else 0.0
            )
            duplicate_percentage = (
                (potential_duplicates / len(recent_embeddings)) * 100
                if recent_embeddings
                else 0.0
            )

            return {
                "total_items": len(recent_embeddings),
                "potential_duplicates": potential_duplicates,
                "duplicate_percentage": round(duplicate_percentage, 2),
                "avg_similarity": round(avg_similarity, 3),
            }

        except Exception as e:
            logger.error(f"Failed to get duplicate analysis: {str(e)}")
            return {
                "total_items": 0,
                "potential_duplicates": 0,
                "duplicate_percentage": 0.0,
                "avg_similarity": 0.0,
            }

    async def _generate_embedding(self, content: str) -> Optional[List[float]]:
        """Generate vector embedding for content using AI service."""
        try:
            # Use AI service to generate embeddings
            embedding = await self.ai_service.generate_embedding(
                text=content, model="text-embedding-ada-002"
            )

            if embedding and isinstance(embedding, list):
                return embedding

            # Fallback: generate simple hash-based embedding
            return self._generate_hash_embedding(content)

        except Exception as e:
            logger.error(f"Failed to generate AI embedding: {str(e)}")
            # Fallback to hash-based embedding
            return self._generate_hash_embedding(content)

    def _generate_hash_embedding(self, content: str) -> List[float]:
        """Generate a simple hash-based embedding as fallback."""
        # This is a simplified fallback implementation
        # In production, this should use a proper embedding model

        # Create a hash of the content
        content_hash = hashlib.md5(content.encode()).hexdigest()

        # Convert hash to a list of floats (simplified embedding)
        embedding = []
        for i in range(0, len(content_hash), 2):
            hex_pair = content_hash[i : i + 2]
            float_val = int(hex_pair, 16) / 255.0  # Normalize to 0-1
            embedding.append(float_val)

        # Pad or truncate to standard embedding size (1536 for OpenAI)
        target_size = 1536
        if len(embedding) < target_size:
            # Pad with zeros
            embedding.extend([0.0] * (target_size - len(embedding)))
        else:
            # Truncate
            embedding = embedding[:target_size]

        return embedding

    def _calculate_cosine_similarity(
        self, vec1: List[float], vec2: List[float]
    ) -> float:
        """Calculate cosine similarity between two vectors."""
        try:
            if len(vec1) != len(vec2):
                return 0.0

            # Convert to numpy arrays for efficient computation
            v1 = np.array(vec1)
            v2 = np.array(vec2)

            # Calculate cosine similarity
            dot_product = np.dot(v1, v2)
            norm_v1 = np.linalg.norm(v1)
            norm_v2 = np.linalg.norm(v2)

            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0

            similarity = dot_product / (norm_v1 * norm_v2)
            return float(similarity)

        except Exception as e:
            logger.error(f"Cosine similarity calculation failed: {str(e)}")
            return 0.0

    def _get_content_preview(
        self, embedding: VectorEmbedding, original_content: str
    ) -> str:
        """Get content preview for similarity result."""
        try:
            # Try to get preview from metadata
            if embedding.metadata and "content_preview" in embedding.metadata:
                return embedding.metadata["content_preview"]

            # Generate preview from original content
            if len(original_content) <= 100:
                return original_content

            return original_content[:100] + "..."

        except Exception as e:
            logger.error(f"Failed to get content preview: {str(e)}")
            return "Content preview unavailable"

    def _get_cluster_representative(self, cluster: List[VectorEmbedding]) -> str:
        """Get representative content for a cluster."""
        try:
            if not cluster:
                return "No content available"

            # Use the first item's metadata or generate a summary
            first_item = cluster[0]
            if first_item.metadata and "title" in first_item.metadata:
                return first_item.metadata["title"]

            return f"Cluster of {len(cluster)} similar items"

        except Exception as e:
            logger.error(f"Failed to get cluster representative: {str(e)}")
            return f"Cluster of {len(cluster)} items"
