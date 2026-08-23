import time
from groq import Groq
from app.core.config import settings

class GroqLLMProvider:
    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set in environment")

        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL

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
                max_tokens=1500,
                # This is a reasoning model (unlike the previously configured
                # llama-3.1-8b-instant) -- it spends completion tokens on hidden
                # chain-of-thought before writing the answer. "low" keeps that
                # budget small so a student with many subjects doesn't exhaust
                # max_tokens on reasoning alone and return empty text.
                reasoning_effort="low",
            )

            generation_time = int((time.time() - start_time) * 1000)
            text = (completion.choices[0].message.content or "").strip()
            if not text:
                raise RuntimeError(
                    f"Model returned no text (finish_reason={completion.choices[0].finish_reason})"
                )

            return {
                "text": text,
                "tokens_used": completion.usage.total_tokens,
                "model": self.model,
                "generation_time_ms": generation_time
            }
        except Exception as e:
            raise RuntimeError(f"LLM generation failed: {str(e)}")