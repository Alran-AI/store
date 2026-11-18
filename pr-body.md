The upstream head of 23 source(s) moved. The pins in
`sources.json` were moved, the Skills were vendored again and the store was rebuilt.

| Source | Was | Now |
| --- | --- | --- |
| addyosmani | `39b723c` | `8c99fa3` |
| gemini | `87fb017` | `c4d0c62` |
| google | `d2b18e8` | `2af5f95` |
| metalbear | `9bd05c7` | `e003956` |
| ghcopilot | `a255a19` | `74b9897` |
| rea | `93fb79e` | `caab34d` |
| skillspector | `4bd0518` | `ee4576e` |
| playwright | `4df46f3` | `e245c3f` |
| adkpy | `43e959e` | `aa0f434` |
| pydantic | `f41f7fd` | `75e4b55` |
| posthog | `2749c2a` | `7917ace` |
| litellm | `0e62b06` | `b195f06` |
| unsloth | `cf0d153` | `a2b4f89` |
| azpy | `993f110` | `1f0f67b` |
| aznet | `787c2e2` | `4e0a443` |
| cfagents | `1a450e7` | `3d33563` |
| azspec | `03baad7` | `a6eb524` |
| prefect | `67380b6` | `ec4b188` |
| paperclip | `33fac97` | `d668eeb` |
| cognee | `e6b5b5b` | `c8a0943` |
| templates | `d3a2956` | `7deaf76` |
| aas | `12c0d66` | `64d4b72` |
| dmcg | `405edcb` | `1ca56bb` |

Read `EXCLUDED.md` for the Skills that were left out and why. The Superpowers package is
not touched by this run: its files are pinned by SHA-256 and have to be read again.

This pull request is built by `.github/workflows/update-sources.yml`.
