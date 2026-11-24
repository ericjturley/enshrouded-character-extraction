# Enshrouded character extraction

Read-only character save extraction to schema-v3 JSON. Requires Node.js 22.15+ with Zstandard support. No npm dependencies.

```sh
node refresh.mjs /path/to/character0.ksd --flame 5
```

Optional flags: `--prior /path/to/EnshroudedBuild.json` carries forward Flame level; `--flame 1` through `--flame 11` overrides it; `--weapon 1:1` selects a hotbar slot. Output is JSON on stdout. No save writes or network requests are performed by these scripts.

## Attribution and data
The vendor parser is reused from [Enshrouded Save Editor](https://github.com/nicolasferreiraxn/Enshrouded-Save-Editor), copyright 2026 Nicolas Ferreira, under MIT; see vendor/LICENSE. The optimized catalogs derive from that project's game-extracted data. Game content belongs to its respective rights holders; the upstream code license does not establish separate rights to redistribute game-derived content. Confirm catalog redistribution permission before publishing publicly. No personal saves or exported builds belong in this repository. Unofficial fan project.

## Runtime release
Release tag: v1.0.0. Attach the original enshrouded-extraction-runtime.zip without repacking it. SHA-256: 8ccf595ad5edf5b4e3acce68c57e52531f7ad8b52c43266bf71722c66bc3d129
