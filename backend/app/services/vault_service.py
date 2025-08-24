import os
from typing import Dict, Optional

import hvac

from app.exceptions import ServiceError


class VaultService:
    def __init__(self):
        self.vault_url = os.getenv("VAULT_URL", "http://vault:8200")
        self.vault_token = os.getenv("VAULT_TOKEN", "dev-token")
        self.client = hvac.Client(url=self.vault_url, token=self.vault_token)

    async def get_secret(self, path: str) -> Optional[Dict]:
        try:
            response = self.client.secrets.kv.v2.read_secret_version(path=path)
            return response["data"]["data"]
        except Exception as e:
            raise ServiceError(f"Failed to retrieve secret from {path}: {str(e)}")

    async def store_secret(self, path: str, secret: Dict) -> bool:
        try:
            self.client.secrets.kv.v2.create_or_update_secret(path=path, secret=secret)
            return True
        except Exception as e:
            raise ServiceError(f"Failed to store secret at {path}: {str(e)}")


vault_service = VaultService()
