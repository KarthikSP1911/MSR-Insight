import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client

@pytest.fixture(autouse=True)
def mock_google_genai():
    with patch('services.rag_service.ChatGoogleGenerativeAI') as MockLLM:
        mock_instance = MockLLM.return_value
        mock_instance.invoke.return_value = MagicMock(content="Mocked LLM Response")
        yield mock_instance

@pytest.fixture(autouse=True)
def mock_embeddings():
    with patch('services.rag_service.GoogleGenerativeAIEmbeddings') as MockEmbeddings:
        mock_instance = MockEmbeddings.return_value
        mock_instance.embed_query.return_value = [0.1, 0.2, 0.3]
        yield mock_instance

@pytest.fixture(autouse=True)
def mock_vectorstore():
    with patch('services.rag_service.PGVector') as MockVectorStore:
        mock_instance = MockVectorStore.return_value
        mock_instance.as_retriever.return_value = MagicMock(
            invoke=MagicMock(return_value=[MagicMock(page_content="Mock Document")])
        )
        yield mock_instance
