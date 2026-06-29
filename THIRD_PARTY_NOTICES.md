# Third-Party Notices

Skills in this repo are MIT-licensed (see [LICENSE](LICENSE)). The artifacts they
generate, and their optional build tooling, reference the following third-party
components. None are vendored into this repository; they are fetched at runtime or
build time as noted.

## skills/project-blueprint

**In the generated HTML output**
- **Mermaid** (MIT) — diagram rendering. During authoring it loads from the
  jsDelivr CDN; the optional build step pre-renders diagrams to inline SVG and
  removes the CDN reference, so the shipped file embeds only static SVG.
  <https://github.com/mermaid-js/mermaid>
- **Google Fonts** — IBM Plex Sans/Mono/Serif, Schibsted Grotesk, Hanken Grotesk,
  JetBrains Mono (all SIL Open Font License 1.1), loaded from Google Fonts with a
  system-font fallback so the output still renders offline.
  <https://fonts.google.com>

**In the optional build/validate tooling (`scripts/`, not shipped to end users)**
- **Puppeteer** (Apache-2.0) — headless-browser rendering and smoke-testing.
  Installed locally via `npm install`; never committed to this repo.
  <https://github.com/puppeteer/puppeteer>

Trademarks (Claude, Anthropic, GitHub, Mermaid, etc.) belong to their respective
owners. This is an independent project, not affiliated with or endorsed by Anthropic.
