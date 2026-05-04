import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from services.rag_service import RAGService
import traceback

def test_sync():
    try:
        service = RAGService()
        print("Initializing service...")
        result = service.sync_data()
        print("Result:", result)
    except Exception as e:
        print("Caught Exception:")
        traceback.print_exc()

if __name__ == "__main__":
    test_sync()
