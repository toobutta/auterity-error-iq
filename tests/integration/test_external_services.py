"""Integration tests for external services"""
import pytest
import asyncio
from unittest.mock import Mock, patch
from backend.app.services.external_services import ExternalServicesManager

@pytest.fixture
def external_services():
    with patch('yaml.safe_load') as mock_yaml:
        mock_yaml.return_value = {
            'vector_databases': {
                'pinecone': {'enabled': True},
                'weaviate': {'enabled': True}
            },
            'llm_providers': {
                'openai': {'enabled': True},
                'anthropic': {'enabled': True}
            },
            'authentication': {
                'providers': {
                    'auth0': {'enabled': True}
                }
            }
        }
        return ExternalServicesManager()

@pytest.mark.asyncio
async def test_vector_storage_pinecone(external_services):
    """Test vector storage in Pinecone"""
    with patch.object(external_services, 'pinecone_index') as mock_index:
        with patch('openai.Embedding.create') as mock_embedding:
            mock_embedding.return_value = {
                'data': [{'embedding': [0.1, 0.2, 0.3]}]
            }
            
            await external_services.store_vector(
                text="Test document",
                metadata={"id": "test-1", "type": "document"},
                provider="pinecone"
            )
            
            mock_index.upsert.assert_called_once()

@pytest.mark.asyncio
async def test_llm_completion_openai(external_services):
    """Test OpenAI completion"""
    with patch('openai.ChatCompletion.create') as mock_completion:
        mock_completion.return_value = Mock(
            choices=[Mock(message=Mock(content="Test response"))]
        )
        
        response = await external_services.generate_completion(
            prompt="Test prompt",
            provider="openai"
        )
        
        assert response == "Test response"