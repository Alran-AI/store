# tools

The store builder, copied from the Alran Code repository
([Alran-AI/alran-code](https://github.com/Alran-AI/alran-code), MIT, © 2026 Alran Code) so that this
repository can build its own store without access to that repository:

| Path | From |
| --- | --- |
| `store/build-store.mjs`, `store/lib/` | `tools/store/` |
| `plugins/validate-plugin.mjs` | `tools/plugins/` |
| `../schemas/` | `schemas/` |

They are the reference implementation of the store format (`docs/store/index-format-v1.md` in the Alran Code
repository). Copy them again when they change there, and check that the result is the same:

```sh
node tools/store/build-store.mjs --source . --check
```
