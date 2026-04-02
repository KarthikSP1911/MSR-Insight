import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "Smart Report Generator"
    
    # Port configuration
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Redis configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    
    # LLM configuration
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    
    # URLs
    EXPRESS_API_URL: str = os.getenv("EXPRESS_API_URL", "http://localhost:5001/api/students/sync")
    
    # Data paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    SCRAPED_DATA_PATH: str = os.path.join(DATA_DIR, "all_students_report.json")
    NORMALIZED_DATA_PATH: str = os.path.join(DATA_DIR, "normalized_data.json")

settings = Settings()
