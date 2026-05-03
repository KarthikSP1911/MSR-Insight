import time
import requests
from config.settings import settings

class OllamaLLMProvider:
    def __init__(self):
        self.model = settings.OLLAMA_MODEL
        self.api_url = settings.OLLAMA_API_URL

    def generate(self, prompt: str) -> dict:
        try:
            start_time = time.time()
            full_prompt = f"System: You generate professional academic remarks.\n\nUser: {prompt}"

            response = requests.post(self.api_url, json={
                "model": self.model,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.6,
                    "num_predict": 200
                }
            })
            response.raise_for_status()
            result = response.json()

            generation_time = int((time.time() - start_time) * 1000)
            text = result.get("response", "").strip()

            return {
                "text": text,
                "tokens_used": result.get("eval_count", 0),
                "model": self.model,
                "generation_time_ms": generation_time
            }
        except Exception as e:
            raise RuntimeError(f"LLM generation failed: {str(e)}")