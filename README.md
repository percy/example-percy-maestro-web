# example-percy-maestro-web

Working examples of [`@percy/maestro-web`](../percy-maestro-web) for Maestro web flows. Each flow in `flows/` demonstrates a specific Percy feature, with a matching npm script and a reference Percy build so teammates can see each feature in isolation.

## Prerequisites

1. **Node 16+** and **Yarn**.
2. **Java 17**:
   ```sh
   brew install openjdk@17
   ```
3. **Maestro CLI**:
   ```sh
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
4. Add to `~/.zshrc`:
   ```sh
   export PATH="$HOME/.maestro/bin:/opt/homebrew/opt/openjdk@17/bin:$PATH"
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
   export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
   ```
5. **Percy Web project** + token:
   ```sh
   export PERCY_TOKEN="<your-web-project-token>"
   ```

## Setup

```sh
cd ~/Desktop/percy/example-percy-maestro-web
yarn install
```

The SDK is linked via `file:../percy-maestro-web`, so SDK edits are picked up on the next `yarn install`.

## One flow per feature

Each flow is self-contained. Run the npm script for the feature you want to demo, open the resulting Percy build URL, and you'll see that feature in isolation.

| Feature | Flow file | Run with | Reference build |
|---|---|---|---|
| Everything — comprehensive demo | `flows/web-percy.yaml` | `yarn test-web` | [Build #26](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48958270) — 9 snapshots, 4 test cases |
| Multi-page navigation + cookies | `flows/auth-flow.yaml` | `yarn test-auth` | [Build #31](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48980917) |
| Regions (ignore / layout / intelliignore) | `flows/regions-demo.yaml` | `yarn test-regions` | [Build #34](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48981196) |
| `createRegion()` programmatic API | `flows/coded-regions.yaml` + `scripts/build-regions.js` | `yarn test-coded-regions` | [Build #39](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48983192) |
| Responsive DOM capture (per-width re-serialize) | `flows/responsive-demo.yaml` | `yarn test-responsive` | [Build #32](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48980926) |
| Scoped snapshot (capture a DOM subtree) | `flows/scoped-demo.yaml` | `yarn test-scoped` | [Build #33](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48980933) |
| Test cases + labels (UI grouping) | `flows/test-cases-labels.yaml` | `yarn test-cases-labels` | [Build #36](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48981219) |
| Cross-origin iframe serialization | `flows/cors-iframe.yaml` + `public/cors-demo.html` | `yarn test-cors` | [Build #37](https://percy.io/9560f98d/web/maestro-new-a7230563/builds/48981224) |
| Run every flow (full sweep) | — | `yarn test-all` | Produces 8 builds |

## Project layout

```
example-percy-maestro-web/
├── .percy.yml                  ← project defaults (widths, minHeight, ...)
├── package.json                ← npm scripts for each focused flow
├── scripts/
│   └── build-regions.js        ← createRegion() helper for coded-regions demo
├── public/
│   └── cors-demo.html          ← localhost page with cross-origin iframes
└── flows/
    ├── web-percy.yaml          ← comprehensive (everything in one)
    ├── auth-flow.yaml          ← multi-page navigation + cookies
    ├── regions-demo.yaml       ← 3 region algorithms side-by-side
    ├── coded-regions.yaml      ← regions built programmatically
    ├── responsive-demo.yaml    ← responsive capture per viewport
    ├── scoped-demo.yaml        ← SCOPE="nav" — capture only a subtree
    ├── test-cases-labels.yaml  ← groups + chips in the review UI
    └── cors-iframe.yaml        ← cross-origin iframe serialization
```

## `.percy.yml` — project-level defaults

Widths / minHeight / percyCSS / discovery options etc. — the standard Percy config file, shared with Selenium/Playwright projects.

```yaml
version: 2
snapshot:
  widths: [375, 1280]
  minHeight: 1024
```

Per-snapshot `env:` blocks override these only when they need to differ.

## Minimum flow file

```yaml
url: https://example.com
---
- launchApp
- runScript:
    file: ../node_modules/@percy/maestro-web/scripts/snapshot.js
    env:
      NAME: "Home"
```

Four YAML lines. `NAME` is the only required field — widths + minHeight come from `.percy.yml`.

## `createRegion()` — programmatic regions

The SDK exports a `createRegion()` helper matching `percy-playwright`'s exact shape. Use it from a Node script to build region JSON, then paste (or dynamically inject) into `PERCY_SNAPSHOT_REGIONS`:

```js
// scripts/build-regions.js
const { createRegion } = require('@percy/maestro-web');

const regions = [
  createRegion({
    boundingBox: { x: 0, y: 0, width: 1280, height: 80 },
    padding: 4,
    algorithm: 'ignore'
  }),
  createRegion({ elementCSS: 'footer', algorithm: 'layout' }),
  createRegion({
    boundingBox: { x: 0, y: 600, width: 1280, height: 400 },
    algorithm: 'intelliignore',
    carouselsEnabled: true,
    bannersEnabled: true,
    adsEnabled: true
  })
];

process.stdout.write(JSON.stringify(regions));
```

Run `yarn build-regions`, copy the JSON output into the `REGIONS:` env var in your flow.

## Cross-origin iframe demo

The `test-cors` script starts a local `python3 -m http.server` on port 8000 serving `public/cors-demo.html` (which embeds iframes from `httpbin.org` and `jsonplaceholder.typicode.com` — different origins from `localhost`), runs `percy-maestro-web exec -- maestro test flows/cors-iframe.yaml`, then tears down the server.

In the resulting Percy build, the capture server's CDP `Target.getTargets` enumerates both iframe contexts and includes their serialized DOM under `domSnapshot.corsIframes` — identical behavior to `percy-playwright`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Unable to locate a Java Runtime` | Install JDK 17 |
| `0 devices connected` | YAML uses `appId:` instead of `url:` for a web flow |
| `Flow file does not exist: .../flows/node_modules/...` | Script path is relative to YAML — use `../node_modules/...` |
| `TypeError: Cannot read property 'NAME' of undefined` | Script used `env.NAME` — GraalJS exposes env as direct globals, use `NAME` |
| `Missing required URL for snapshot` | Wrong Percy project type — make sure the project is **Web** |
| `Element not found: Text matching regex: ...` | Maestro's web driver is beta; some selectors (especially buttons with embedded icons) don't match reliably. Use `openLink:` / `id:` instead where possible |

## License

MIT
