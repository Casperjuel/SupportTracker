# SupportTracker

A local-first desktop app for logging and analyzing support interactions. Built with Electron, React, shadcn/ui, and Tailwind CSS.

**[Download latest release](https://github.com/Casperjuel/SupportTracker/releases/latest)** · **[Website](https://casperjuel.github.io/SupportTracker/)**

## Features

- **Quick logging** — Toggle, dropdown, and typeahead fields for sub-30-second entry
- **Dashboard** — Weekly trend charts, category breakdowns, resolution rates
- **Insights** — Automatic trend detection, preventable analysis, and prioritized action items
- **Configurable fields** — Add, remove, and reorder fields and options from settings
- **Dark mode** — Light, dark, and system auto
- **Customizable branding** — Set your own org name and subtitle
- **MCP integration** — Connect with Claude Desktop or Claude Code to read, create, and analyze entries via AI
- **Optional shared database** — Connect to Supabase for team-wide data sharing
- **System tray** — Quick access via tray icon and `Cmd+Shift+G` global shortcut
- **Auto-updates** — Automatic updates via GitHub Releases
- **CSV/JSON export** — Export data for reporting

## Install

Download the latest `.dmg` from the [releases page](https://github.com/Casperjuel/SupportTracker/releases/latest).

> **Note:** On first launch, macOS may show a warning. Right-click the app → Open to bypass it.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## MCP Server

Connect Claude to your support data:

```json
{
  "mcpServers": {
    "supporttracker": {
      "command": "npx",
      "args": ["tsx", "<path-to>/SupportTracker/src/mcp/server.ts"]
    }
  }
}
```

Available tools: `list_entries`, `create_entry`, `delete_entry`, `get_insights`, `get_fields`, `add_field_option`

## Release

```bash
# Bump version in package.json, then:
git add -A && git commit -m "v1.x.x"
git tag v1.x.x
git push origin main --tags
```

GitHub Actions builds and publishes automatically.

## License

MIT
