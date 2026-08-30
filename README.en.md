# dsh-tip-jar 🫙

**Tip jar for DeepSeek Harness** — a contributor support system for open-source
plugins. Contributors declare their support channels once in `sponsors.json`
(USDC, fiat platforms, subscriptions, sponsor slots); users reach them in one
tap from a sponsor-center panel, a settings page, or tool-card credits.
Pure P2P, zero custody, privacy by default (pseudonymous + unverified badges).

## Features

- **Sponsor center**: conversation "Support" tab + settings "Support contributors" page
- **USDC (Polygon)**: payment QR code + copyable address (format-checked `0x`+40 hex)
- **Fiat / subscriptions**: Afdian, GitHub Sponsors, Patreon, Ko-fi links
- **Sponsor slots**: static "Sponsored by …" placements (author negotiates directly with advertisers)
- **Privacy by default**: alias only, unverified badge, no forced identity
- **Safe degradation**: missing/corrupt registry or invalid addresses → empty state or error, never a crash

## Install (persistent)

```bash
npm install && npm run build

# Add to a profile (either)
dsh plugin --profile <name> add dsh-tip-jar
# or add "dsh-tip-jar" to the profile's dsh.profile.bundles (cordis.patch.yml applies automatically)
```

After restarting the Harness every session loads the sponsor center; page
refreshes do not lose it.

## Registry `sponsors.json` (workspace root)

```jsonc
{
  "schemaVersion": 1,
  "privacyNote": "Contributors may use an alias only; unverified until certified.",
  "contributors": [{
    "id": "ghost-trader",            // required, unique
    "alias": "ghost_trader",         // required, pseudonym
    "verified": false,               // required; false → unverified badge
    "bio": "one-liner",
    "tips": {
      "usdc": "0x…(40 hex)",         // optional, format-checked
      "fiat": [{ "label": "Afdian", "url": "https://…" }]
    },
    "subscriptions": [{ "label": "Patreon", "url": "https://…" }]
  }],
  "plugins": [{
    "pluginId": "dsh-tip-jar",
    "name": "Tip Jar",
    "contributorId": "ghost-trader", // references contributors.id
    "sponsors": [{ "name": "Advertiser", "message": "tagline", "url": "https://…" }]
  }]
}
```

Full design & manifest spec: see `dsh-sponsors/PROJECT.md` and
`dsh-sponsors/manifest-spec.md` in the project workspace.

## Development

```bash
npm test       # registry validation tests (red/green)
npm run build  # esbuild: host / remote / client (__ModuleLoader__)
```

## License

MIT
