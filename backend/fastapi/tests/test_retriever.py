from unittest.mock import patch, MagicMock
from services.retriever import get_ensemble_retriever

@patch("services.retriever.EnsembleRetriever")
@patch("services.retriever.BM25Retriever")
@patch("services.retriever.psycopg2")
def test_get_ensemble_retriever(mock_psycopg2, mock_bm25_class, mock_ensemble):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_psycopg2.connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    # Return one dummy row from DB for BM25
    mock_cursor.fetchall.return_value = [
        ("1MS21CS001", "John Doe", 3, '{"cgpa": "9.0"}', "P123", "2027")
    ]

    mock_bm25_instance = MagicMock()
    mock_bm25_class.from_documents.return_value = mock_bm25_instance

    mock_vector_store = MagicMock()
    mock_semantic_retriever = MagicMock()
    mock_vector_store.as_retriever.return_value = mock_semantic_retriever

    ensemble = get_ensemble_retriever("what is his marks", "P123", mock_vector_store)

    assert ensemble is not None
    mock_ensemble.assert_called_once()
    assert len(mock_ensemble.call_args[1]["retrievers"]) == 2
    
    # Check that as_retriever was called with the correct filter for academics
    mock_vector_store.as_retriever.assert_called_with(
        search_type="similarity",
        search_kwargs={
            "k": 5,
            "filter": {"$and": [
                {"proctor_id": {"$eq": "P123"}},
                {"chunk_type": {"$eq": "academics"}},
            ]},
        }
    )

@patch("services.retriever.psycopg2")
def test_get_ensemble_retriever_no_intent(mock_psycopg2):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_psycopg2.connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchall.return_value = [] # Empty BM25

    mock_vector_store = MagicMock()
    
    ensemble = get_ensemble_retriever("who are you", "P123", mock_vector_store)
    
    # Should only return the semantic retriever (since BM25 failed / was empty)
    # Wait, the code adds BM25 ONLY IF `all_proctor_docs` is not empty.
    # So if fetchall is empty, retriever_list has length 1 (only semantic).
    # And if len == 1, it returns retriever_list[0], not an EnsembleRetriever.
    assert ensemble == mock_vector_store.as_retriever.return_value

    mock_vector_store.as_retriever.assert_called_with(
        search_type="similarity",
        search_kwargs={
            "k": 5,
            "filter": {"proctor_id": {"$eq": "P123"}},
        }
    )
