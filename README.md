# CDMServer

## What is CDM?

Centralized Download Manager: A server-client solution for managing your downloads. Search on Ncore or TMDB and seamlessly download content to your chosen device using Transmission or QBittorrent (torrent clients).

## How to use it
For comprehensive guidance on using the webpage, refer to the [Usage Guide](doc/USAGE.md).

## Components

* [CDM Server](webapp/README.md) — the web application (API, frontend, wishlist worker). Architecture, features, installation and configuration are documented there.
* [CDM CLI](cli/README.md) — command-line interface for CDM Server
* [CDM Client](client/README.md) — client daemon that talks to Transmission/QBittorrent, published to PyPI as `CDMClient`
* [Browser Extension](browser-extension/README.md) — Chrome/Firefox extension adding a CDM button to IMDb pages
