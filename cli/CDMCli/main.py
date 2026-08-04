from __future__ import annotations

import math
import sys
from datetime import datetime
from typing import Annotated, Optional

import httpx
import typer
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from . import config
from .client import CDMClient

app = typer.Typer(
    name="cdm",
    help="CDM Server CLI",
    add_completion=False,
    rich_markup_mode="rich",
    pretty_exceptions_show_locals=False,
)
users_app = typer.Typer(help="User management", rich_markup_mode="rich")
devices_app = typer.Typer(help="Device management", rich_markup_mode="rich")
status_app = typer.Typer(help="Download status & control", rich_markup_mode="rich")
tmdb_app = typer.Typer(help="TMDB browse & search", rich_markup_mode="rich")

app.add_typer(users_app, name="users")
app.add_typer(devices_app, name="devices")
app.add_typer(status_app, name="status")
app.add_typer(tmdb_app, name="tmdb")

out = Console()
err = Console(stderr=True)

BANNER = "[bold cyan]╔═╗╔╦╗╔╦╗[/bold cyan] [dim]CDM Server CLI[/dim]"


def _banner() -> None:
    out.print(Panel(BANNER, border_style="cyan", padding=(0, 2)), height=3)


def _ok(msg: str) -> None:
    err.print(f"[bold green]✓[/bold green] {msg}")


def _fail(msg: str, code: int = 1) -> None:
    err.print(f"[bold red]✗[/bold red] {msg}")
    raise SystemExit(code)


def _progress_bar(pct: int, width: int = 18) -> str:
    filled = round(width * pct / 100)
    bar = "█" * filled + "░" * (width - filled)
    color = "green" if pct == 100 else "yellow" if pct > 50 else "red"
    return f"[{color}]{bar}[/{color}] [dim]{pct}%[/dim]"


def _human_size(b: int) -> str:
    if b == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = int(math.floor(math.log(b, 1024)))
    return f"{b / 1024**i:.1f} {units[i]}"


def _status_color(status: str) -> str:
    s = status.lower()
    if "seeding" in s or "complete" in s:
        return "green"
    if "error" in s:
        return "red"
    if "stopped" in s:
        return "dim"
    if "download" in s or "active" in s:
        return "cyan"
    return "yellow"


# ─── Auth ────────────────────────────────────────────────────────────────────


@app.command()
def login(
    server: Annotated[Optional[str], typer.Option("--server", "-s", help="Server URL")] = None,
    email: Annotated[Optional[str], typer.Option("--email", "-e")] = None,
    password: Annotated[Optional[str], typer.Option("--password", "-p", hide_input=True)] = None,
) -> None:
    """Login to CDM Server and save credentials."""
    _banner()
    server_url = server or config.get_server_url()
    if not server_url:
        server_url = typer.prompt("Server URL")
    server_url = server_url.rstrip("/")

    if not email:
        email = typer.prompt("Email")
    if not password:
        password = typer.prompt("Password", hide_input=True)

    try:
        resp = httpx.post(
            f"{server_url}/api/auth/login/",
            json={"email": email, "password": password},
            timeout=10,
        )
    except httpx.ConnectError:
        _fail(f"Cannot connect to [bold]{server_url}[/bold]")

    if resp.status_code == 200:
        data = resp.json()
        config.save_login(server_url, data["access_token"], data["refresh_token"])
        _ok(f"Logged in as [bold]{email}[/bold] → [dim]{server_url}[/dim]")
    elif resp.status_code == 401:
        _fail("Invalid credentials")
    else:
        _fail(f"Login failed ({resp.status_code})")


@app.command()
def logout() -> None:
    """Logout and clear stored tokens."""
    c = CDMClient()
    c.post("/api/auth/logout/")
    config.clear_tokens()
    _ok("Logged out")


@app.command()
def whoami() -> None:
    """Show current user info."""
    c = CDMClient()
    resp = c.get("/api/users/me/")
    if resp.status_code != 200:
        _fail(f"Failed ({resp.status_code})")
    d = resp.json()
    panel = Panel(
        f"[bold]{d.get('name', '')}[/bold]\n"
        f"[dim]Email:[/dim]  {d.get('email', '')}\n"
        f"[dim]Admin:[/dim]  {'[green]yes[/green]' if d.get('isAdmin') else '[dim]no[/dim]'}\n"
        f"[dim]nCore:[/dim]  {'[green]set[/green]' if d.get('isNcoreCredentialSet') else '[dim]not set[/dim]'}",
        title="[bold cyan]Current User[/bold cyan]",
        border_style="cyan",
        padding=(0, 2),
    )
    out.print(panel)


# ─── Users ────────────────────────────────────────────────────────────────────


@users_app.command("list")
def users_list() -> None:
    """List all users (admin only)."""
    c = CDMClient()
    resp = c.get("/api/users/")
    if resp.status_code == 403:
        _fail("Admin access required")
    if resp.status_code != 200:
        _fail(f"Failed ({resp.status_code})")

    users = resp.json()["data"]["users"]
    t = Table(box=box.ROUNDED, border_style="cyan", header_style="bold cyan")
    t.add_column("ID", style="dim", width=6)
    t.add_column("Name")
    t.add_column("Email")
    for u in users:
        t.add_row(str(u["id"]), u["name"], u["email"])
    out.print(t)


@users_app.command("add")
def users_add(
    email: Annotated[str, typer.Option("--email", "-e", prompt=True)],
    name: Annotated[str, typer.Option("--name", "-n", prompt=True)],
    password: Annotated[str, typer.Option("--password", "-p", prompt=True, hide_input=True, confirmation_prompt=True)],
    admin: Annotated[bool, typer.Option("--admin/--no-admin")] = False,
) -> None:
    """Create a new user (admin only)."""
    c = CDMClient()
    resp = c.post("/api/users/", json={"email": email, "name": name, "password": password, "isAdmin": admin})
    if resp.status_code == 403:
        _fail("Admin access required")
    if resp.status_code == 200:
        _ok(f"User [bold]{email}[/bold] created")
    else:
        _fail(f"Failed: {resp.json().get('message', resp.status_code)}")


@users_app.command("delete")
def users_delete(
    user_id: Annotated[int, typer.Option("--user-id", "-u", prompt=True)],
) -> None:
    """Delete a user by ID (admin only)."""
    c = CDMClient()
    typer.confirm(f"Delete user {user_id}?", abort=True)
    resp = c.delete(f"/api/users/{user_id}/")
    if resp.status_code == 403:
        _fail("Admin access required")
    if resp.status_code == 200:
        _ok(f"User {user_id} deleted")
    else:
        _fail(f"Failed: {resp.json().get('message', resp.status_code)}")


@users_app.command("passwd")
def users_passwd(
    user_id: Annotated[int, typer.Option("--user-id", "-u", prompt=True)],
    password: Annotated[str, typer.Option("--password", "-p", prompt=True, hide_input=True, confirmation_prompt=True)],
) -> None:
    """Change a user's password (admin only)."""
    c = CDMClient()
    resp = c.patch(f"/api/users/{user_id}/", json={"password": password})
    if resp.status_code == 403:
        _fail("Admin access required")
    if resp.status_code == 200:
        _ok(f"Password updated for user {user_id}")
    else:
        _fail(f"Failed: {resp.json().get('message', resp.status_code)}")


@users_app.command("me")
def users_me(
    password: Annotated[Optional[str], typer.Option("--password", "-p", hide_input=True)] = None,
    name: Annotated[Optional[str], typer.Option("--name", "-n")] = None,
    ncore_user: Annotated[Optional[str], typer.Option("--ncore-user")] = None,
    ncore_pass: Annotated[Optional[str], typer.Option("--ncore-pass", hide_input=True)] = None,
) -> None:
    """Update own profile."""
    payload: dict = {}
    if password:
        payload["password"] = password
    if name:
        payload["name"] = name
    if ncore_user is not None:
        payload["ncoreUser"] = ncore_user
    if ncore_pass is not None:
        payload["ncorePass"] = ncore_pass
    if not payload:
        _fail("Nothing to update. Provide at least one option.")
    c = CDMClient()
    resp = c.patch("/api/users/me/", json=payload)
    if resp.status_code == 200:
        _ok("Profile updated")
    else:
        _fail(f"Failed: {resp.json().get('message', resp.status_code)}")


# ─── Devices ─────────────────────────────────────────────────────────────────


@devices_app.command("list")
def devices_list() -> None:
    """List all devices."""
    c = CDMClient()
    resp = c.get("/api/devices/")
    if resp.status_code != 200:
        _fail(f"Failed ({resp.status_code})")

    devices = resp.json()["data"]["devices"]
    if not devices:
        out.print("[dim]No devices.[/dim]")
        return

    t = Table(box=box.ROUNDED, border_style="cyan", header_style="bold cyan")
    t.add_column("ID", style="dim", width=6)
    t.add_column("Name")
    t.add_column("Status", width=10)
    t.add_column("Users")
    for d in devices:
        status = "[green]● active[/green]" if d["active"] else "[red]○ inactive[/red]"
        users = ", ".join(d.get("userEmails", [])) or "[dim]—[/dim]"
        t.add_row(str(d["id"]), d["name"], status, users)
    out.print(t)


@devices_app.command("add")
def devices_add(
    name: Annotated[str, typer.Option("--name", "-n", prompt=True)],
) -> None:
    """Add a new device."""
    c = CDMClient()
    resp = c.post("/api/devices/", json={"name": name})
    if resp.status_code == 200:
        _ok(f"Device [bold]{name}[/bold] created")
    elif resp.status_code == 409:
        _fail("Device name already exists")
    else:
        _fail(f"Failed ({resp.status_code})")


@devices_app.command("delete")
def devices_delete(
    device_id: Annotated[int, typer.Option("--device-id", "-d", prompt=True)],
) -> None:
    """Delete a device by ID."""
    c = CDMClient()
    typer.confirm(f"Delete device {device_id}?", abort=True)
    resp = c.delete(f"/api/devices/{device_id}/")
    if resp.status_code == 200:
        _ok(f"Device {device_id} deleted")
    else:
        _fail(f"Failed ({resp.status_code})")


@devices_app.command("token")
def devices_token(
    device_id: Annotated[int, typer.Option("--device-id", "-d", prompt=True)],
) -> None:
    """Show the API token for a device."""
    c = CDMClient()
    resp = c.get("/api/devices/")
    devices = resp.json()["data"]["devices"]
    device = next((d for d in devices if d["id"] == device_id), None)
    if not device:
        _fail(f"Device {device_id} not found")
    out.print(Panel(
        f"[bold yellow]{device['token']}[/bold yellow]",
        title=f"[bold cyan]Token — {device['name']}[/bold cyan]",
        border_style="cyan",
        padding=(0, 2),
    ))


# ─── Status ──────────────────────────────────────────────────────────────────


@status_app.callback(invoke_without_command=True)
def status_default(
    ctx: typer.Context,
    device_id: Annotated[Optional[int], typer.Option("--device", "-d")] = None,
) -> None:
    """Show download status. [dim]Uses first device if --device omitted.[/dim]"""
    if ctx.invoked_subcommand:
        return
    c = CDMClient()
    resp = c.get("/api/devices/")
    devices = resp.json()["data"]["devices"]
    if not devices:
        out.print("[dim]No devices.[/dim]")
        return

    if device_id is None:
        device_id = devices[0]["id"]
    dev = next((d for d in devices if d["id"] == device_id), None)
    device_name = dev["name"] if dev else str(device_id)

    resp = c.get(f"/api/status/{device_id}/")
    if resp.status_code != 200:
        _fail(f"Failed ({resp.status_code})")

    torrents = resp.json()["data"]["torrents"]
    if not torrents:
        out.print(f"[dim]No active downloads on [bold]{device_name}[/bold].[/dim]")
        return

    t = Table(
        box=box.ROUNDED,
        border_style="cyan",
        header_style="bold cyan",
        title=f"[bold]{device_name}[/bold]",
    )
    t.add_column("ID", style="dim", width=8)
    t.add_column("Name", min_width=30)
    t.add_column("Progress", min_width=24)
    t.add_column("Size", width=10)
    t.add_column("Status")

    for tor in torrents:
        color = _status_color(tor["status"])
        t.add_row(
            str(tor["id"]),
            tor["name"],
            Text.from_markup(_progress_bar(tor["progress"])),
            _human_size(tor.get("totalSize", 0)),
            f"[{color}]{tor['status']}[/{color}]",
        )
    out.print(t)


def _resolve_device_id(c: CDMClient, device_id: Optional[int]) -> int:
    if device_id is not None:
        return device_id
    devices = c.get("/api/devices/").json()["data"]["devices"]
    if not devices:
        _fail("No devices found")
    return devices[0]["id"]


def _send_instruction(c: CDMClient, device_id: int, instruction: str, torrent_id: Optional[int] = None, paths: Optional[list] = None) -> None:
    body: dict = {"instructions": {}}
    if torrent_id is not None:
        body["instructions"][instruction] = {"torrent_id": torrent_id}
    elif paths is not None:
        body["instructions"][instruction] = {"paths": paths}
    resp = c.post(f"/api/status/{device_id}/instructions/", json=body)
    if resp.status_code == 200:
        _ok(f"[bold]{instruction.capitalize()}[/bold] sent to device {device_id}")
    else:
        _fail(f"Failed ({resp.status_code})")


@status_app.command("start")
def status_start(
    torrent_id: Annotated[int, typer.Option("--torrent-id", "-t", prompt=True)],
    device_id: Annotated[Optional[int], typer.Option("--device", "-d")] = None,
) -> None:
    """Resume a torrent. [dim]Uses first device if --device omitted.[/dim]"""
    c = CDMClient()
    _send_instruction(c, _resolve_device_id(c, device_id), "start", torrent_id=torrent_id)


@status_app.command("stop")
def status_stop(
    torrent_id: Annotated[int, typer.Option("--torrent-id", "-t", prompt=True)],
    device_id: Annotated[Optional[int], typer.Option("--device", "-d")] = None,
) -> None:
    """Pause a torrent. [dim]Uses first device if --device omitted.[/dim]"""
    c = CDMClient()
    _send_instruction(c, _resolve_device_id(c, device_id), "stop", torrent_id=torrent_id)


@status_app.command("delete")
def status_delete(
    torrent_id: Annotated[int, typer.Option("--torrent-id", "-t", prompt=True)],
    device_id: Annotated[Optional[int], typer.Option("--device", "-d")] = None,
) -> None:
    """Delete a torrent. [dim]Uses first device if --device omitted.[/dim]"""
    c = CDMClient()
    resolved = _resolve_device_id(c, device_id)
    typer.confirm(f"Delete torrent {torrent_id} from device {resolved}?", abort=True)
    _send_instruction(c, resolved, "delete", torrent_id=torrent_id)


@status_app.command("clean")
def status_clean(
    device_id: Annotated[Optional[int], typer.Option("--device", "-d")] = None,
) -> None:
    """Send clean instruction to device. [dim]Uses first device if --device omitted.[/dim]"""
    c = CDMClient()
    resolved = _resolve_device_id(c, device_id)
    devices = c.get("/api/devices/").json()["data"]["devices"]
    dev = next((d for d in devices if d["id"] == resolved), None)
    if not dev:
        _fail(f"Device {resolved} not found")
    paths = list({v for v in dev["settings"].values() if v})
    _send_instruction(c, resolved, "clean", paths=paths)


# ─── Search / Download ───────────────────────────────────────────────────────


@app.command()
def search(
    pattern: Annotated[str, typer.Option("--pattern", "-p", prompt=True)],
    where: Annotated[str, typer.Option("--where", "-w", help="name|leiras|imdb|cimke")] = "name",
    category: Annotated[str, typer.Option("--category", "-c", help="all_own|hd|hd_hun|xvid|...")] = "all_own",
    page: Annotated[int, typer.Option("--page")] = 1,
) -> None:
    """Search for torrents."""
    c = CDMClient()
    resp = c.get(
        "/api/download/search/",
        params={"pattern": pattern, "where": where, "category": category, "page": page},
    )
    if resp.status_code != 200:
        _fail(f"Search failed ({resp.status_code})")

    data = resp.json()
    torrents = data["data"]["torrents"]
    total_pages = data["meta"]["totalPages"]

    if not torrents:
        out.print("[dim]No results.[/dim]")
        return

    t = Table(
        box=box.ROUNDED,
        border_style="cyan",
        header_style="bold cyan",
        title=f"[bold]Results[/bold] [dim](page {page}/{total_pages})[/dim]",
    )
    t.add_column("ID", style="dim", width=10)
    t.add_column("Title", min_width=35)
    t.add_column("Category", width=14)
    t.add_column("Size", width=10)
    t.add_column("S/L", width=8)

    for tor in torrents:
        t.add_row(
            str(tor["id"]),
            tor["title"],
            tor.get("category", ""),
            tor.get("size", ""),
            f"[green]{tor.get('seeders', 0)}[/green]/[red]{tor.get('leechers', 0)}[/red]",
        )
    out.print(t)

    if total_pages > 1:
        out.print(f"[dim]Use [bold]--page[/bold] to navigate. Total: {total_pages} pages.[/dim]")


@app.command()
def download(
    torrent_id: Annotated[int, typer.Option("--torrent-id", "-t", prompt=True)],
    device_id: Annotated[int, typer.Option("--device-id", "-d", prompt=True)],
) -> None:
    """Add a torrent to a device's download queue."""
    c = CDMClient()
    resp = c.post("/api/download/", json={"torrentId": torrent_id, "deviceId": device_id})
    if resp.status_code == 200:
        _ok(f"Torrent [bold]{torrent_id}[/bold] queued on device [bold]{device_id}[/bold]")
    else:
        _fail(f"Failed ({resp.status_code})")


# ─── TMDB ────────────────────────────────────────────────────────────────────


def _print_tmdb_table(items: list, title: str) -> None:
    if not items:
        out.print(f"[dim]No {title.lower()}.[/dim]")
        return
    t = Table(
        box=box.ROUNDED,
        border_style="magenta",
        header_style="bold magenta",
        title=f"[bold]{title}[/bold]",
    )
    t.add_column("TMDB ID", style="dim", width=10)
    t.add_column("Title", min_width=30)
    t.add_column("Year", width=6)
    t.add_column("Type", width=8)
    t.add_column("Rating", width=7)
    for item in items:
        rating = f"{item['rating']:.1f}" if item.get("rating") else "—"
        t.add_row(
            str(item["tmdbId"]),
            item["title"],
            str(item.get("year") or "—"),
            item.get("mediaType", ""),
            f"[yellow]★ {rating}[/yellow]",
        )
    out.print(t)


@tmdb_app.command("search")
def tmdb_search(
    pattern: Annotated[str, typer.Option("--pattern", "-p", prompt=True)],
    language: Annotated[str, typer.Option("--lang", "-l")] = "en",
    page: Annotated[int, typer.Option("--page")] = 1,
) -> None:
    """Search TMDB."""
    c = CDMClient()
    resp = c.get("/api/tmdb/search/", params={"pattern": pattern, "page": page, "language": language})
    if resp.status_code != 200:
        _fail(f"Failed ({resp.status_code})")
    data = resp.json()
    total = data["meta"]["totalPages"]
    _print_tmdb_table(data["data"], f"TMDB: {pattern} (page {page}/{total})")


@tmdb_app.command("popular")
def tmdb_popular(language: Annotated[str, typer.Option("--lang", "-l")] = "en") -> None:
    """Show popular movies and series."""
    c = CDMClient()
    resp = c.get("/api/tmdb/popular/", params={"language": language})
    if resp.status_code != 200:
        _fail(f"Failed ({resp.status_code})")
    data = resp.json()["data"]
    _print_tmdb_table(data["movies"], "Popular Movies")
    out.print()
    _print_tmdb_table(data["tvs"], "Popular Series")
