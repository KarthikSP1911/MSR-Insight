from app.core.config import settings


def main() -> None:
    """Entry point for `uv run dev` — mirrors `python -m app.main`."""
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=settings.PORT,
        reload=True,
        log_config=None,
    )


if __name__ == "__main__":
    main()
