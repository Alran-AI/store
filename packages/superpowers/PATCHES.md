# What differs from upstream

Upstream: https://github.com/obra/superpowers at 22f0b46. Every other file of this package is identical to upstream;
`scripts/vendor-package.mjs` in the Alran store repository pins the SHA-256 of each one and stops when an
upstream file is not the one that was read.

## Left out

- `skills/diagnosing-superpowers`: It reads the session transcripts of the host tool and prepares them for a public GitHub issue on the Superpowers repository (`gh issue create --repo obra/superpowers`). Its session discovery looks for another harness's files, and what it does goes to a third party. It is a support channel to the upstream project, not part of the workflow.

## Changed

- `skills/brainstorming/scripts/server.cjs`: The visual-companion page loads a logo from https://primeradiant.com in the user's browser every time it is shown, unless an environment variable says not to. That is a request to a third party that the user never agreed to. With this line the page shows the text brand only, which is what upstream shows when the variable is set. The server itself is unchanged: it listens on 127.0.0.1, needs a per-session key, and makes no outbound request.

  ```diff
  - const SUPERPOWERS_TELEMETRY_DISABLED = TELEMETRY_DISABLE_ENV_VARS.some(name => isTruthyEnv(process.env[name]));
  + const SUPERPOWERS_TELEMETRY_DISABLED = true; // Alran store: never load the remote brand logo
  ```

## Written for Alran

- `hooks/hooks.json`: Upstream's hooks/hooks.json uses the handler fields `shell` and `powershell`, which the Alran package format skips, so its hook would never run. This file registers the same two scripts (unchanged) in the Alran format: the session-start script starts with an explicit `bash`, because archives do not keep the executable bit.
- `package.json`: upstream's name and version with `"type": "module"` and nothing else. The brainstorm server shows this version in its page header, and `skills/writing-skills/render-graphs.js` is written as an ES module.
- `.alran-plugin/plugin.json`, `icon.png`, `SOURCE.md` and this file.

## Limits of an archive

An Alran Plugin archive does not keep the executable bit. The Skills call their scripts through `bash`
or `node`, as upstream's own text asks; where a Skill names a script by its bare path (the
`executing-plans` Skill does), run it as `bash <path>`.
