# CDM Server CLI

Command-line interface for [CDM Server](../README.md).

## Installation

```bash
pip install cdmctl
```

## Quick Start

```bash
cdm login --server https://your-cdm-server.com
cdm search --pattern "inception"
cdm download --torrent-id 12345 --device-id 1
```

## Commands

| Command | Description |
|---|---|
| `cdm version` | Show CLI version |
| `cdm login` | Login and save credentials |
| `cdm logout` | Clear stored tokens |
| `cdm whoami` | Show current user |
| `cdm search` | Search torrents on nCore |
| `cdm download` | Queue a torrent for download |
| `cdm users` | User management (admin) |
| `cdm devices` | Device management |
| `cdm status` | Download status & control |
| `cdm tmdb` | Browse and search TMDB |
| `cdm wishlist` | Manage wishlist |

Run `cdm <command> --help` for options.

### Wishlist

Add movies by IMDB ID; the server retries weekly until the torrent appears on nCore.

```bash
cdm wishlist types                                              # list quality types
cdm wishlist add --imdb-id tt1375666 --device-id 1 --type hd_hun
cdm wishlist list
cdm wishlist delete --item-id 3
```
