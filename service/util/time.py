from datetime import datetime, timezone


def utc_isoformat(value: datetime) -> str:
    """Serialize a timestamp as an explicit UTC ISO string.

    Timestamps live in naive MySQL DATETIME columns, so the offset has to be
    attached here for clients to be able to convert to local time.
    """
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()
