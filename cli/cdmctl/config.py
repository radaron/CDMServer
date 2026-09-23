import json
from pathlib import Path

CONFIG_DIR = Path.home() / ".config" / "cdm"
CONFIG_FILE = CONFIG_DIR / "config.json"


def load() -> dict:
    if not CONFIG_FILE.exists():
        return {}
    try:
        return json.loads(CONFIG_FILE.read_text())
    except Exception:
        return {}


def save(data: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(data, indent=2))


def get_server_url() -> str | None:
    return load().get("server_url")


def get_tokens() -> tuple[str | None, str | None]:
    cfg = load()
    return cfg.get("access_token"), cfg.get("refresh_token")


def save_login(server_url: str, access_token: str, refresh_token: str) -> None:
    cfg = load()
    cfg["server_url"] = server_url.rstrip("/")
    cfg["access_token"] = access_token
    cfg["refresh_token"] = refresh_token
    save(cfg)


def save_tokens(access_token: str, refresh_token: str) -> None:
    cfg = load()
    cfg["access_token"] = access_token
    cfg["refresh_token"] = refresh_token
    save(cfg)


def clear_tokens() -> None:
    cfg = load()
    cfg.pop("access_token", None)
    cfg.pop("refresh_token", None)
    save(cfg)
