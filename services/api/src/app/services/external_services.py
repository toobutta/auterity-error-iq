"""External Services Integration"""

import os
from typing import Any, Dict

import openai
import pinecone
import weaviate
import yaml
from anthropic import Anthropic


class ExternalServicesManager:
    def __init__(self, config_path: str = "config/external-services.yml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
        self._initialize_services()

    def _initialize_services(self):
        """Initialize all external services"""
        self._init_vector_databases()
        self._init_llm_providers()
        self._init_auth_providers()

    def _init_vector_databases(self):
        """Initialize vector databases"""
        # Pinecone
        if self.config["vector_databases"]["pinecone"]["enabled"]:
            pinecone.init(
                api_key=os.getenv("PINECONE_API_KEY"),
                environment=os.getenv("PINECONE_ENVIRONMENT", "us-west1-gcp"),
            )
            self.pinecone_index = pinecone.Index(
                os.getenv("PINECONE_INDEX", "auterity-vectors")
            )

        # Weaviate
        if self.config["vector_databases"]["weaviate"]["enabled"]:
            self.weaviate_client = weaviate.Client(
                url=os.getenv("WEAVIATE_URL", "http://localhost:8080"),
                auth_client_secret=weaviate.AuthApiKey(
                    api_key=os.getenv("WEAVIATE_API_KEY")
                ),
            )

    def _init_llm_providers(self):
        """Initialize LLM providers"""
        # OpenAI
        if self.config["llm_providers"]["openai"]["enabled"]:
            openai.api_key = os.getenv("OPENAI_API_KEY")
            openai.organization = os.getenv("OPENAI_ORG_ID")

        # Anthropic
        if self.config["llm_providers"]["anthropic"]["enabled"]:
            self.anthropic_client = Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )

    def _init_auth_providers(self):
        """Initialize authentication providers"""
        self.auth_config = self.config["authentication"]["providers"]

    async def store_vector(
        self, text: str, metadata: Dict[str, Any], provider: str = "pinecone"
    ):
        """Store vector in specified database"""
        if provider == "pinecone" and hasattr(self, "pinecone_index"):
            # Generate embedding
            response = openai.Embedding.create(
                input=text, model="text-embedding-ada-002"
            )
            vector = response["data"][0]["embedding"]

            # Store in Pinecone
            self.pinecone_index.upsert(
                [(metadata.get("id", ""), vector, metadata)]
            )

        elif provider == "weaviate" and hasattr(self, "weaviate_client"):
            # Store in Weaviate
            self.weaviate_client.data_object.create(
                data_object={"text": text, **metadata},
                class_name="AuterityDocument",
            )

    async def query_vector(
        self, query: str, top_k: int = 5, provider: str = "pinecone"
    ):
        """Query vector database"""
        if provider == "pinecone" and hasattr(self, "pinecone_index"):
            # Generate query embedding
            response = openai.Embedding.create(
                input=query, model="text-embedding-ada-002"
            )
            query_vector = response["data"][0]["embedding"]

            # Query Pinecone
            results = self.pinecone_index.query(
                vector=query_vector, top_k=top_k, include_metadata=True
            )
            return results.matches

        elif provider == "weaviate" and hasattr(self, "weaviate_client"):
            # Query Weaviate
            result = (
                self.weaviate_client.query.get("AuterityDocument", ["text"])
                .with_near_text({"concepts": [query]})
                .with_limit(top_k)
                .do()
            )
            return result["data"]["Get"]["AuterityDocument"]

    async def generate_completion(
        self,
        prompt: str,
        model: str = "gpt-3.5-turbo",
        provider: str = "openai",
    ):
        """Generate completion using specified provider"""
        if provider == "openai":
            response = openai.ChatCompletion.create(
                model=model, messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content

        elif provider == "anthropic":
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
