"""MinIO-based object storage service."""

import io
from datetime import timedelta
from typing import BinaryIO, Optional

from app.config.settings import get_settings
from minio import Minio
from minio.error import S3Error


class StorageService:
    """MinIO object storage service."""

    def __init__(self, endpoint: Optional[str] = None):
        """Initialize storage service."""
        settings = get_settings()
        self.endpoint = endpoint or getattr(
            settings, "MINIO_ENDPOINT", "localhost:9000"
        )
        self.access_key = getattr(settings, "MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = getattr(settings, "MINIO_SECRET_KEY", "minioadmin123")

        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=False,  # Use True for HTTPS
        )

        # Default bucket for workflow artifacts
        self.default_bucket = "workflow-artifacts"
        self._ensure_bucket(self.default_bucket)

    def _ensure_bucket(self, bucket_name: str):
        """Ensure bucket exists."""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
        except S3Error:
            pass  # Bucket might already exist

    def upload_file(
        self,
        bucket_name: str,
        object_name: str,
        file_data: BinaryIO,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload file to storage."""
        self._ensure_bucket(bucket_name)

        self.client.put_object(
            bucket_name,
            object_name,
            file_data,
            length=-1,
            part_size=10 * 1024 * 1024,  # 10MB parts
            content_type=content_type,
        )

        return f"{bucket_name}/{object_name}"

    def upload_text(self, bucket_name: str, object_name: str, text: str) -> str:
        """Upload text content."""
        data = io.BytesIO(text.encode("utf-8"))
        return self.upload_file(bucket_name, object_name, data, "text/plain")

    def download_file(self, bucket_name: str, object_name: str) -> bytes:
        """Download file from storage."""
        response = self.client.get_object(bucket_name, object_name)
        return response.read()

    def get_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expires: timedelta = timedelta(hours=1),
    ) -> str:
        """Get presigned URL for file access."""
        return self.client.presigned_get_object(bucket_name, object_name, expires)

    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """Delete file from storage."""
        try:
            self.client.remove_object(bucket_name, object_name)
            return True
        except S3Error:
            return False

    def list_files(self, bucket_name: str, prefix: str = "") -> list:
        """List files in bucket."""
        try:
            objects = self.client.list_objects(bucket_name, prefix=prefix)
            return [obj.object_name for obj in objects]
        except S3Error:
            return []


# Global storage service instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get global storage service instance."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
