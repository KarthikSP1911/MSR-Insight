import logging

from rich.logging import RichHandler


def setup_logging(level: str = "INFO") -> None:
    """Configure root logging with a clean, colorized console handler."""
    handler = RichHandler(
        show_time=True,
        show_path=False,
        markup=True,
        rich_tracebacks=True,
        log_time_format="[%X]",
    )

    logging.basicConfig(
        level=level,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[handler],
        force=True,
    )

    # Quiet noisy third-party loggers down to warnings only.
    for noisy in ("httpx", "urllib3", "watchfiles", "python_multipart"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
