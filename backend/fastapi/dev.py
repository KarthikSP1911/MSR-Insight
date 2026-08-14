from config.settings import settings


def main() -> None:
    """Entry point for `uv run dev` — mirrors `python main.py`."""
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=settings.PORT,
        reload=True,
        log_config=None,
    )


if __name__ == "__main__":
    main()
