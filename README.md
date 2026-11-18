# Alran store

A curated catalogue of Skills and Plugins for Alran Code. Nothing here is written by us: every Skill is a
copy from an open-source project or a platform vendor's own skills repository, at a pinned commit, under its
own licence. All are **unmodified**, except the Superpowers package, whose differences from upstream are
listed in `packages/superpowers/PATCHES.md`. `THIRD_PARTY_NOTICES.md` lists every source with its commit and licence
text; each Skill folder also carries its own `LICENSE.txt` and `SOURCE.md`.

It builds into a store that Alran Code reads (`docs/store.md` in the Alran Code repository): **176 Plugins**
(175 built from one source's Skills each, and Superpowers as a package with scripts and a hook) and **10023
individually installable Skills**; 10058 Skills in all. The 21 engineering-workflow Skills and the 14 Superpowers
Skills are only offered inside their Plugin, because they link to shared checklists the Plugin carries or
call each other by the Plugin's name.

| Area | Sources |
| --- | --- |
| Engineering workflow | Addy Osmani (MIT), Superpowers (MIT, a package), Context engineering, TypeScript engineering (Matt Pocock), Frontend craft (Emil Kowalski), GitHub Spec Kit, Planning with files, Ponytail, Gentle AI, Archify, Claude Code Templates, Spec-Driven Development, PStack, Skillkit, dzhng, Bama, Skills Hub, Evo, Modem, Agent Skills (mblode), Forge Harness, Aeon, Babysitter, Code Review Triage, Agent Verifier |
| Cloud and hosting | Cloudflare, Cloudflare Workers SDK, Cloudflare Agents, Netlify, Firebase, Supabase, Neon, Terraform, Packer, Google Cloud, Microsoft Azure, Microsoft SDKs, AWS, Docker, Deno, Self-Host |
| Data | MongoDB, Redis, ClickHouse, DuckDB, Hugging Face, Replicate, Gemini API, Elastic, dbt, Azure SDK for Python, Azure SDK for .NET, Azure REST APIs, Cognee, TinyBase, Teable, Qdrant |
| Frameworks and tooling | Expo, Flutter and Dart, React Native (Callstack), Apollo GraphQL, Sanity, Cypress, Resend, Stripe, Stripe Agent Toolkit, Brave Search, .NET, Android, Kotlin, Vue and Vite, Builder.io, Playwright, Playwright for Python, Prisma, MetalBear (mirrord), Langfuse, LiteLLM, Streamlit, Gradio, Go, Rust Anything, Argent (Software Mansion), Data Model Code Generator, App Store Connect, VideoDB, Helius, Mailtrap, Courier, Zapier, OpenOSINT, Modern Node.js, Swift Patterns, Swift Concurrency, SDK Generation (Speakeasy), Vovk, Pachca, NodeMaven, Three.js |
| Agents and agent frameworks | Google Agents CLI, Google ADK, OpenAI Agents, Microsoft agents, Pydantic AI, Anthropic Plugins, E2B, Unsloth, GitHub Copilot, Paperclip, Fast Agent, OPC |
| Work, messaging and money | Google Workspace, Twilio, MetaMask, Cap-go, Ace Data Cloud, PostHog, GitLab, Obsidian, LinkedIn Skills, Finance Skills, Notion Cookbook, Second Brain OS, Publora, TweetClaw, Qubrics, Goose |
| Automation and integration | n8n workflows, Coupler, Browser Act, Oxylabs, Temporal, Prefect, Apache Airflow, Astronomer, Trigger.dev, ShipSwift |
| Review and quality | Sentry engineering, CodeRabbit, LambdaTest, GitHub Copilot, Anthropic Plugins, Alibaba code review, NVIDIA Skill Inspector, Grafana, CTF Skills, Thinking Skills, Cybersecurity Skills |
| Infrastructure and security | DevOps and security, Tencent AI Infra Guard, Cloudflare security audit, Cybersecurity Skills (MITRE, NIST) |
| Design, media and 3D | OpenMotion, Open Design, Baoyu, Social Auto Upload, Blender Skills, Scenario Labs, Awesome Design Skills, Effective HTML, LottieFiles, ChatCut, HyperFrames, Three.js, UI Skills, Superdesign, KiCad |
| Skill catalogues | Agentic Awesome Skills, Claude Skills Catalogue, Agent Plugin Marketplace, Product Management Skills |
| Business | Marketing (Corey Haines), Product management (Paweł Huryn), E-commerce Skills, EveryInfra, Citlyze |
| Science and making | Google DeepMind, Scientific agent skills (K-Dense AI), TypeSafe, Game development, Reverse engineering, Jane Street, Open Science, AI Research Skills (Orchestra Research) |
| Productivity | Home Assistant, Skill Seekers |

```sh
alran plugin marketplace add /path/to/alran-store/store     # or the URL it is hosted at
alran plugin search terraform
alran plugin install engineering-workflow
alran skills install wrangler
```

This repository is hosted on GitHub (`Alran-AI/store`). The built `store/` folder is what gets hosted: the Alran
platform (the `alran-platform` repository) serves a checked copy at
`https://ai.ottili.one/v1/store/index.json`, which Alran Code reads by default. After a rebuild, copy it over
with `npm run store:sync -- --from <this checkout>` there.

## Layout

| Path | What |
| --- | --- |
| `sources.json` | The pinned sources, which Skills are taken from each, and the reserved names |
| `scripts/vendor.mjs` | Copies the Skills from local clones, applies the admission rules, writes `EXCLUDED.md` and `versions.json` |
| `skills/<source>/<name>/` | Vendored Skills (unmodified, plus `LICENSE.txt` and `SOURCE.md`) |
| `packages.json` | Plugins that carry scripts or a hook, with a SHA-256 pin for every upstream file |
| `scripts/vendor-package.mjs` | Copies such a package into `packages/<id>/` and writes its manifest, hook registration, `SOURCE.md` and `PATCHES.md` |
| `packages/<id>/` | A vendored package, ready to archive (`PATCHES.md` lists what differs from upstream) |
| `shared/<source>/` | Shared files a source's Skills link to (carried inside that source's Plugin) |
| `store/plugins.json` | The name and description of each source's Plugin (hand-written) |
| `scripts/gen-config.mjs` | Writes `store/store.config.json` from `sources.json`, `versions.json` and `store/plugins.json` |
| `scripts/gen-icons.mjs` | Writes `store/icons/` (one icon per Plugin) |
| `scripts/update-sources.mjs` | Looks up the upstream head of every source, and with `--apply` moves the pins, clones the sources and vendors the Skills again |
| `tools/store/` | The store builder, copied from the Alran Code repository (MIT), so that this repository can build its own store |
| `store/index.json`, `store/archives/` | Generated by the store builder; commit the result |
| `EXCLUDED.md`, `THIRD_PARTY_NOTICES.md` | Generated |

## Update or add a source

```sh
git clone <repo> <work>/<clone>          # check out the commit you want; put clone and commit in sources.json
node scripts/vendor.mjs --work <work>
node scripts/vendor-package.mjs --work <work>      # packages; stops if an upstream file is not the one that was read
node scripts/gen-icons.mjs && node scripts/gen-config.mjs
node tools/store/build-store.mjs --source .          # writes ./store
node tools/store/build-store.mjs --source . --check  # exit 1 if ./store is stale
```

`tools/store/` is the store builder copied from the Alran Code repository (see `tools/README.md`); the same
commands run there as `node <alran-code>/tools/store/build-store.mjs --source .`.

Versions are `<commit date>+<short commit>` (SemVer: no zero padding); an update is recognised by the content
digest changing.

## Keeping it up to date

`.github/workflows/update-sources.yml` runs every morning. It reads `sources.json`, asks each source's
repository for its head, and opens a pull request when a source has moved: the pin is updated, the Skills are
vendored again, the store is rebuilt and checked, and the pull request lists which source moved and from where
to where. Read `EXCLUDED.md` in the pull request for the Skills that were left out and why. Nothing is published
from the workflow; the pull request is reviewed and merged by hand.

The pull request carries the vendored Skills, `sources.json` and the files the vendor writes
(`versions.json`, `EXCLUDED.md`, `THIRD_PARTY_NOTICES.md`). The built `store/` folder is not part of it: it
holds one archive per Skill and is built and published from the pipeline, so a daily pull request stays small.

The same thing can be done by hand, without the workflow:

```sh
node scripts/update-sources.mjs --work <work>                    # what has moved?
node scripts/update-sources.mjs --work <work> --apply            # move the pins and vendor again
```

The workflow does not touch the Superpowers package: its upstream files are pinned by SHA-256 and have to be
read again before they are accepted (`node scripts/vendor-package.mjs --work <work> --pin`). It leaves a frozen
source alone, and says so in the pull request.

## What is let in, and what is not

A source lists its Skills by name, or takes `"include": "clean"`: every Skill that passes the admission rules.
`scripts/vendor.mjs` takes a Skill only if

- it has no script or executable and nothing but plain text files (`.md`, `.txt`, `.json`, `.yaml`, `.csv`)
  or images (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`), no symlinks, and only file names a portable archive can
  hold. A vector image (`.svg`) is a document that may carry a script, so it is left out;
- its `SKILL.md` names its own folder, and its name is not one of the Skills built in to Alran Code;
- its frontmatter is a flat mapping of scalars, the way the store's Plugin validator reads it: the
  `description` has to be a value on the line of its key (a value that only continues on the lines below
  is not one), and no key may appear twice;
- it has no invisible characters or data URIs, and no line that pipes a download into a shell, decodes a base64
  blob, loads a remote script or tells the model to ignore its instructions (unless the line itself marks it
  as a bad example, as in a security guide);
- it does not need an MCP server: Alran Code sets up no MCP connectors, so a Skill that asks for one asks for a
  tool that does not exist. A Skill that names an MCP server and a way around it (a CLI, an SDK, curl, an API)
  is kept;
- every link that leaves its folder lands on another Skill of the same source (or a shared folder) that is in.

A Skill that fails is left out and listed in `EXCLUDED.md` with the reason; for a named Skill the run stops
instead. The Skills run no code of their own; what an agent does with their text goes through Alran's normal
permissions. A few links in the text itself are broken in the originals too (placeholders, or paths that only
make sense in the upstream repository); they are copied as they are.

A Skill whose only fault is a `scripts/` or an `evals/` folder still comes in without that folder: the folder
holds code the store cannot carry, and the Skill is kept as long as its own text never points at it. A Skill
that says "run `scripts/analyze.py`" and then loses the folder points at a file that is not there, which is
worse than a Skill that is not in the store at all, so those are left out. Every Skill that comes in this way
says so in its own `SOURCE.md`, and `EXCLUDED.md` lists them all.

A source that ships the same Skill twice (a plugin bundle next to the copy it was built from) contributes it
once: the first copy that is admitted is taken, the others are listed in `EXCLUDED.md`. A source's licence file
may be called `LICENSE`, `LICENSE.txt` or `LICENSE.md`, or `LICENSE-MIT` and `LICENSE-APACHE` for a repository
under both.

A source that takes `"include": "clean"` is taken in part: the large catalogues (Google Cloud, the Microsoft
SDKs, .NET, the scientific skills) hold hundreds of Skills each, and only the ones that pass the rules are
vendored. `EXCLUDED.md` lists every one of them with the reason, so nothing disappears quietly.

## Superpowers: a package, not a Skill collection

[obra/superpowers](https://github.com/obra/superpowers) (MIT) is in as one Plugin under its own name, because its
Skills call each other as `superpowers:<name>`, and some carry scripts and a session-start hook. It does not go
through the plain-text admission rules; instead every one of its 64 upstream files is pinned by SHA-256 in
`packages.json`. The scripts and the hook were read line by line (local `git`/`awk`/file helpers and a local web
server for the optional visual brainstorming companion that listens on `127.0.0.1` behind a per-session key);
the Skill text is checked by rules. An upstream change stops `scripts/vendor-package.mjs` until it is read again.

What differs from upstream (the full list, with the diff, is `packages/superpowers/PATCHES.md`):

- `skills/diagnosing-superpowers` is left out: it prepares session transcripts for a public GitHub issue on the
  upstream repository, which has no place in a Plugin that runs on someone's machine.
- One line of `skills/brainstorming/scripts/server.cjs`: the companion page loaded a logo from
  `primeradiant.com` in the user's browser every time it was shown; it shows the text brand now.
- `hooks/hooks.json` is written for Alran, because upstream's uses handler fields the Alran package format skips.
  The two hook scripts it starts are upstream's, unchanged. The Windows entry (`run-hook.cmd`) is untested.
- `package.json` (upstream's name and version, `"type": "module"`), the manifest, the icon, `SOURCE.md` and
  `PATCHES.md` are generated.

Installing it asks for approval first: the consent list shows the one hook, which runs
`bash "${PLUGIN_ROOT}/hooks/session-start"` and only prints the `using-superpowers` Skill as session context.

## Not included, and why

Facts about the source, not quality judgements:

- [replicate/skills](https://github.com/replicate/skills) (Apache-2.0): the repository was deleted in November
  2026. Its seven Skills stay in the store as the unmodified copies that were taken at the pinned commit; the
  source is marked `"frozen"` in `sources.json`, so it is neither checked nor refreshed.
- [MicrosoftDocs/Agent-Skills](https://github.com/MicrosoftDocs/Agent-Skills) (CC-BY-4.0): every one of its 201
  Skills is a stub whose content is fetched at runtime through the `mcp_microsoftdocs` MCP server, with a
  fallback to a `fetch_webpage` tool Alran Code does not have. It would be a Plugin of 201 empty indexes.
- [weaviate/agent-skills](https://github.com/weaviate/agent-skills) (BSD-3-Clause): its two Skills ship Python
  scripts, or a line that pipes a download into a shell.
- [TheQtCompanyRnD/agent-skills](https://github.com/TheQtCompanyRnD/agent-skills) (BSD-3-Clause): its Skills
  carry `.qml` and `.py` files, and some ship a licence file of their own.
- [twilio/skills](https://github.com/twilio/skills) (MIT): 53 of its 57 Skills are in the store. The four that are
  not name their folder wrong, link out of the store or carry no description.
- [MetaMask/agent-skills](https://github.com/MetaMask/agent-skills) (MIT): its Skill ships Python scripts.
- [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) (MIT): the validator
  scripts are the Skill, and it cannot do its work without them.
- [google/elephant-goldfish-model](https://github.com/google/elephant-goldfish-model) (Apache-2.0): every Skill
  carries an SVG icon.
- [vmware-skills/VMware-AIops](https://github.com/vmware-skills/VMware-AIops) (MIT): its Skill links to Skills
  the repository does not carry.
- [n8n-io/n8n](https://github.com/n8n-io/n8n): the Sustainable Use License, which is not an open-source licence.
  The community [n8n skills](https://github.com/czlonkowski/n8n-skills) (MIT) are in the store.
- [anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) (MIT) and
  [openai/openai-cookbook](https://github.com/openai/openai-cookbook) (MIT): their Skills ship Python scripts.
- [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) (Apache-2.0): its Skills ship `.cjs`
  scripts; the one that does not is a one-line joke ("Speak like a pirate").
- [openai/openai-agents-js](https://github.com/openai/openai-agents-js) (MIT): its Skills have the same names as
  the ones in the Python repository, which are in the store; the rest ship scripts.
- [microsoft/ai-agents-for-beginners](https://github.com/microsoft/ai-agents-for-beginners) (MIT): its Skills
  link to files outside their own folder and ship notebooks.
- [anthropics/claude-code](https://github.com/anthropics/claude-code): not open-source ("© Anthropic PBC. All
  rights reserved").
- [airbytehq/airbyte](https://github.com/airbytehq/airbyte) and
  [arize-ai/phoenix](https://github.com/arize-ai/phoenix): the Elastic License 2.0, which is not an
  open-source licence. [langfuse](https://github.com/langfuse/langfuse) and
  [PostHog](https://github.com/PostHog/posthog) are MIT outside their `ee/` folders, and their Skills are.
- [grafana/grafana](https://github.com/grafana/grafana): the AGPL. [Grafana's own skills](https://github.com/grafana/skills)
  are in the store.
- [vercel/next.js](https://github.com/vercel/next.js): no licence file at the root of the repository.
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills),
  [eclipse-theia/theia](https://github.com/eclipse-theia/theia) and
  [nocobase/nocobase](https://github.com/nocobase/nocobase): no licence file at the root of the repository.
- [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files) (MIT),
  [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) (MIT),
  [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0),
  [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT) and
  [Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill) (MIT): every Skill in them ships a
  script, a command file or a binary asset.
- [eigent-ai/eigent](https://github.com/eigent-ai/eigent) (Apache-2.0): its Skills are the document skills
  (docx, pdf, pptx) that Alran Code builds in itself, and they ship scripts.
- [NVIDIA/skills](https://github.com/NVIDIA/skills) (Apache-2.0 for the code, CC-BY-4.0 for the text): all 472 of
  its Skills carry an `evals/` folder with Python in it, and every one of them also carries a `skill.oms.sig`
  signature file or Python under `references/`. Leaving out the `evals/` folder is not enough for the rest to
  be plain text, so not one of them can be vendored as they are.
- [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) (MIT): its one Skill is
  called `motion-design`, which Open Design already has.
- [nateherkai/scroll-craft](https://github.com/nateherkai/scroll-craft) (MIT),
  [lackeyjb/playwright-skill](https://github.com/lackeyjb/playwright-skill) (MIT),
  [evalstate/fast-agent](https://github.com/evalstate/fast-agent) (Apache-2.0) and
  [eugeniughelbur/obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain) (MIT): their
  Skills ship JavaScript, CSS or HTML files.
- [ljagiello/ctf-skills](https://github.com/ljagiello/ctf-skills) (MIT): its Skills are about attacks, and the
  store does not take a Skill whose text decodes a base64 blob or carries an instruction-override phrase.
- [transloadit/skills](https://github.com/transloadit/skills),
  [makenotion/claude-code-notion-plugin](https://github.com/makenotion/claude-code-notion-plugin),
  [firecrawl/cli](https://github.com/firecrawl/cli) and
  [PSPDFKit-labs/nutrient-agent-skill](https://github.com/PSPDFKit-labs/nutrient-agent-skill): no licence file at
  the root of the repository. [gitroomhq/postiz-agent](https://github.com/gitroomhq/postiz-agent) is under the AGPL.
- [AvdLee/SwiftUI-Agent-Skill](https://github.com/AvdLee/SwiftUI-Agent-Skill) and
  [AvdLee/Swift-Concurrency-Agent-Skill](https://github.com/AvdLee/Swift-Concurrency-Agent-Skill) (MIT): their
  Skills carry a PNG and an SVG logo.
- [zxkane/aws-skills](https://github.com/zxkane/aws-skills) (MIT),
  [coji/natural-japanese](https://github.com/coji/natural-japanese) (MIT) and
  [UiPath/coder_eval](https://github.com/UiPath/coder_eval) (Apache-2.0): their Skills ship scripts, or name
  another Skill than their folder.
- [imxv/Pretty-mermaid-skills](https://github.com/imxv/Pretty-mermaid-skills) (MIT),
  [Gabberflast/academic-pptx-skill](https://github.com/Gabberflast/academic-pptx-skill) (MIT) and
  [zilliztech/milvus-skill](https://github.com/zilliztech/milvus-skill) (Apache-2.0): the SKILL.md sits at the
  root of the repository, not in a folder of its own.
- [snyk/agent-scan](https://github.com/snyk/agent-scan) (Apache-2.0): the Skills in it are test fixtures.
- [NVIDIA/skills](https://github.com/NVIDIA/skills) and [angular/skills](https://github.com/angular/skills):
  no licence file.
- [anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) (Apache-2.0): its
  Skills assume MCP connectors for Slack, Linear and similar, which are not set up here.
- [openai/skills](https://github.com/openai/skills) and [anthropics/skills](https://github.com/anthropics/skills):
  licensed skill by skill (the document skills of the latter are not open); each would need its own check.
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills): no licence files.
- [WordPress/agent-skills](https://github.com/WordPress/agent-skills) (licence not recognised, WordPress is GPL)
  and [trailofbits/skills](https://github.com/trailofbits/skills) (CC-BY-SA-4.0, share-alike).
- [lawve-ai/awesome-legal-skills](https://github.com/lawve-ai/awesome-legal-skills) (CC-BY-NC-ND-4.0: no
  commercial use, no derivatives), [OptimNow/cloud-finops-skills](https://github.com/OptimNow/cloud-finops-skills)
  (CC-BY-SA-4.0, share-alike) and [openaccountants/openaccountants](https://github.com/openaccountants/openaccountants)
  (AGPL-3.0): not the open-source licences the store takes.
- [momentic-ai/skills](https://github.com/momentic-ai/skills): its own integration licence, not open-source.
- [NeoLabHQ/context-engineering-kit](https://github.com/NeoLabHQ/context-engineering-kit) (GPL) and
  [NoizAI/skills](https://github.com/NoizAI/skills) (no licence file at the root).
- [ethos-link/rails-conventions](https://github.com/ethos-link/rails-conventions) and
  [kgraph57/mckinsey-style-visualization-skill](https://github.com/kgraph57/mckinsey-style-visualization-skill):
  the `SKILL.md` sits at the root of the repository, not in a folder of its own, so there is no folder to put
  the Skill in.
- [soba-labs/langchain-agent-skills](https://github.com/soba-labs/langchain-agent-skills) (MIT): its Skills carry
  Python and a `pyproject.toml` under `assets/`, which is not a folder the rules leave out.
- [wshuyi/x-article-publisher-skill](https://github.com/wshuyi/x-article-publisher-skill) (MIT) and
  [0design/unslop-skill](https://github.com/0design/unslop-skill) (MIT): their one Skill each is nothing but its
  scripts, and their text points at them.
- [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) (Apache-2.0): the one Skill that carries
  no script is a joke that lives in the repository's test data, not in its Skills.

Whoever publishes a store is responsible for the licences of what is in it. [HashiCorp's Skills](https://github.com/hashicorp/agent-skills)
are MPL-2.0: they are redistributed unmodified, source text only. The scripts and configuration in this
repository have no licence file yet; that is for the owner to choose.
