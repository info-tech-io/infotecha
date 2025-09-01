# InfoTech.io Platform

Central hub for the InfoTech.io educational platform. This repository contains the main landing page, the module registry (`modules.json`), and the GitHub Actions workflows required to build and deploy the entire platform.

## Architecture

This repository is the "Hub" in our "Hub and Spoke" architecture.

- **`content/`**: Contains the static HTML, CSS, and JavaScript for the main landing page (`infotecha.ru`).
- **`modules.json`**: A central registry of all available educational modules. This file is the single source of truth for the platform's course catalog.
- **`.github/workflows/`**: Contains the GitHub Actions that automate the entire platform:
    - `deploy-hub.yml`: Deploys the main landing page when its content changes.
    - `module-updated.yml`: Listens for webhooks from module repositories and updates the `modules.json` registry.
    - `build-module.yml`: The core workflow that checks out a module's content, combines it with the `hugo-base` template, builds the static site, and deploys it to its subdomain.

## How It Works

1.  A course author pushes an update to a content repository (e.g., `mod_linux_base`).
2.  A webhook fires a `repository_dispatch` event to this `infotecha` repository.
3.  The `module-updated.yml` workflow runs, updates the timestamp for the changed module in `modules.json`, and commits the change.
4.  The `build-module.yml` workflow is then triggered.
5.  It builds the module's static site using the `hugo-base` template.
6.  The final static site is deployed to the production server under the correct subdomain (e.g., `linux-base.infotecha.ru`).

## Local Development

While the main platform is deployed via CI/CD, you can test the landing page locally.

```bash
# Serve the content directory on a local server
python3 -m http.server 8000 --directory ./content
```

Then open `http://localhost:8000` in your browser. Note that the `modules.json` file will be loaded from the root of the repository.
