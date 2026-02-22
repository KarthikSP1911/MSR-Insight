import os
import time
from groq import Groq


class GroqLLMProvider:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in environment")

        self.client = Groq(api_key=api_key)
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    def generate(self, prompt: str) -> dict:
        try:
            start_time = time.time()

            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You generate professional academic remarks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=200
            )

            generation_time = int((time.time() - start_time) * 1000)

            text = completion.choices[0].message.content.strip()

            return {
                "text": text,
                "tokens_used": completion.usage.total_tokens,
                "model": self.model,
                "generation_time_ms": generation_time
            }

        except Exception as e:
            raise RuntimeError(f"LLM generation failed: {str(e)}")