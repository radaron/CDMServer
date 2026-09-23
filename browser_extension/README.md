# CDM IMDb Button Extension

The **CDM IMDb Button** is a browser extension for Chrome and Firefox that enhances your IMDb experience by adding a **CDM** button next to the movie or series title. Clicking the button redirects you to your configured **Centralized Download Manager (CDM)** server, pre-filtered for the selected movie or series.

## Features

- Adds a **CDM** button to IMDb movie and series pages.
- Redirects to the CDM download page with filters applied for the selected movie or series.
- Configurable **CDM Server URL** via the extension's options page.
- Available for both Chrome and Firefox.

## Installation

### Chrome
1. Install the extension from the [Chrome Web Store](https://chromewebstore.google.com/detail/cdm-imdb-button/hmagbkjkgdokenodjnealeadobbdbfcm?authuser=0&hl=hu).
2. Once installed, configure the **CDM Server URL** in the extension's options page.

### Firefox
1. Install the extension from [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/cdm-imdb-button/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search).
2. After installation, set up the **CDM Server URL** in the extension's options page.

## Configuration

1. Open the extension's options page:
   - In Chrome: Click the three dots next to the extension icon in the toolbar, then select "Options."
   - In Firefox: Go to `about:addons`, find the extension, and click "Preferences."
2. Enter your **CDM Server URL** (e.g., `https://your-cdm-server.com`).
3. Click **Save** to store the configuration.

## Usage

1. Visit any movie or series page on [IMDb](https://www.imdb.com).
2. Look for the **CDM** button next to the movie or series title.
3. Click the button to open the CDM download page, pre-filtered for the selected movie or series.

## Permissions

The extension requires the following permissions:
- **Storage**: To save the configured CDM Server URL.
- **Content Scripts**: To inject the button into IMDb pages.

## See also

* [cdm client](https://github.com/radaron/CDMClient)
* [cdm server](https://github.com/radaron/CDMServer)