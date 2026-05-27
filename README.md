# Bug Bounty Notes App

A lightweight notes app designed for bug bounty hunting workflows.

## Features

- Clean and responsive UI for web, Linux desktop browsers, and Android browsers
- Bug-bounty-focused note fields: target, vulnerability type, severity, and findings
- Local persistence via `localStorage`
- Network sync support via configurable endpoint (`BUG_BOUNTY_SYNC_URL`)

## Run

Because this is a static app, it runs on all platforms with a modern browser.

```bash
cd /tmp/workspace/onlybugs05/Notes-App-For-BugBounty-hunting-
python3 -m http.server 8080
```

Then open:

- Web/Linux: `http://localhost:8080`
- Android: open the same URL from your Android browser on the same network

## Optional network sync

Set `window.BUG_BOUNTY_SYNC_URL` before loading `app.js` (for example in an inline script tag) to enable sync with:

- `POST {BUG_BOUNTY_SYNC_URL}/notes/sync`
- Request body: `{ "notes": [...] }`
- Optional response body: `{ "notes": [...] }` (used to replace local notes)
