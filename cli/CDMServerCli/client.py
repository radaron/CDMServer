import sys
from importlib.metadata import version

import httpx
from rich.console import Console

from . import config

console = Console(stderr=True)

CLI_USER_AGENT = f"CDMServerCli/{version('CDMServerCli')}"


class CDMError(Exception):
    pass


class CDMClient:
    def __init__(self, require_auth: bool = True):
        server_url = config.get_server_url()
        if not server_url:
            console.print("[bold red]✗[/bold red] Not configured. Run [bold]cdm login[/bold] first.")
            sys.exit(1)
        self.base = server_url
        self._access, self._refresh = config.get_tokens()
        if require_auth and not self._refresh:
            console.print("[bold red]✗[/bold red] Not logged in. Run [bold]cdm login[/bold] first.")
            sys.exit(1)
        self._http = httpx.Client(headers={"User-Agent": CLI_USER_AGENT})

    def _auth_headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self._access:
            h["Authorization"] = f"Bearer {self._access}"
        return h

    def _do_refresh(self) -> bool:
        if not self._refresh:
            return False
        try:
            resp = self._http.post(
                f"{self.base}/api/auth/refresh/",
                json={"refresh_token": self._refresh},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                self._access = data["access_token"]
                self._refresh = data.get("refresh_token", self._refresh)
                config.save_tokens(self._access, self._refresh)
                return True
        except Exception:
            pass
        return False

    def request(self, method: str, path: str, **kwargs) -> httpx.Response:
        url = f"{self.base}{path}"
        kwargs.setdefault("timeout", 30)
        resp = self._http.request(method, url, headers=self._auth_headers(), **kwargs)
        if resp.status_code == 401:
            if self._do_refresh():
                resp = self._http.request(method, url, headers=self._auth_headers(), **kwargs)
        if resp.status_code == 401:
            config.clear_tokens()
            console.print("[bold red]✗[/bold red] Session expired. Run [bold]cdm login[/bold] again.")
            sys.exit(1)
        return resp

    def get(self, path: str, **kwargs) -> httpx.Response:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs) -> httpx.Response:
        return self.request("POST", path, **kwargs)

    def put(self, path: str, **kwargs) -> httpx.Response:
        return self.request("PUT", path, **kwargs)

    def patch(self, path: str, **kwargs) -> httpx.Response:
        return self.request("PATCH", path, **kwargs)

    def delete(self, path: str, **kwargs) -> httpx.Response:
        return self.request("DELETE", path, **kwargs)
