# Alran store

A curated catalogue of Skills and Plugins for Alran Code. Nothing here is written by us: every Skill is a
copy from an open-source project or a platform vendor's own skills repository, at a pinned commit, under its
own licence. All are **unmodified**, except the Superpowers package, whose differences from upstream are
listed in `packages/superpowers/PATCHES.md`. `THIRD_PARTY_NOTICES.md` lists every source with its commit and licence
text; each Skill folder also carries its own `LICENSE.txt` and `SOURCE.md`.

Some sources are catalogues that also carry Skills written by other projects; they are in the store under the
catalogue's own licence, and `THIRD_PARTY_NOTICES.md` names the catalogue they came from. A catalogue whose
Skills declare licences of their own — a proprietary one, say — is not taken.

It builds into a store that Alran Code reads (`docs/store.md` in the Alran Code repository): **416 Plugins**
(415 built from one source's Skills each, and Superpowers as a package with scripts and a hook) and **95053
individually installable Skills**; 95075 Skills in all. The 22 Skills that are only offered inside a Plugin — 21 in Engineering Workflow, 1 in Superpowers — cannot be installed on their own: the engineering-workflow Skills link to shared checklists the Plugin carries, or call each other by the Plugin's name. The store holds one copy of each Skill name.

| Area | Sources |
| --- | --- |
| Engineering workflow | Addy Osmani (MIT), Superpowers (MIT, a package), Context engineering, TypeScript engineering (Matt Pocock), Frontend craft (Emil Kowalski), GitHub Spec Kit, Planning with files, Ponytail, Gentle AI, Archify, Claude Code Templates, Spec-Driven Development, PStack, Skillkit, dzhng, Bama, Skills Hub, Evo, Modem, Agent Skills (mblode), Forge Harness, Aeon, Babysitter, Code Review Triage, Agent Verifier, AI-Driven Dev Framework, Waza, Brigade, Agentic SDLC, Claude Toolbox, High-Value Skills |
| Cloud and hosting | Cloudflare, Cloudflare Workers SDK, Cloudflare Agents, Netlify, Firebase, Supabase, Neon, Terraform, Packer, Google Cloud, Microsoft Azure, Microsoft SDKs, AWS, Docker, Deno, Self-Host |
| Data | MongoDB, Redis, ClickHouse, DuckDB, Hugging Face, Replicate, Gemini API, Elastic, dbt, Azure SDK for Python, Azure SDK for .NET, Azure REST APIs, Cognee, TinyBase, Teable, Qdrant, Inkbox |
| Frameworks and tooling | Expo, Flutter and Dart, React Native (Callstack), Apollo GraphQL, Sanity, Cypress, Resend, Stripe, Stripe Agent Toolkit, Brave Search, .NET, Android, Kotlin, Vue and Vite, Builder.io, Playwright, Playwright for Python, Prisma, MetalBear (mirrord), Langfuse, LiteLLM, Streamlit, Gradio, Go, Rust Anything, Argent (Software Mansion), Data Model Code Generator, App Store Connect, VideoDB, Helius, Mailtrap, Courier, Zapier, OpenOSINT, Modern Node.js, Swift Patterns, Swift Concurrency, SDK Generation (Speakeasy), Vovk, Pachca, NodeMaven, Three.js, ModelPlan |
| Agents and agent frameworks | Google Agents CLI, Google ADK, OpenAI Agents, Microsoft agents, Pydantic AI, Anthropic Plugins, E2B, Unsloth, GitHub Copilot, Paperclip, Fast Agent, OPC, Instar, Deliberation, Claude Smart |
| Work, messaging and money | Google Workspace, Twilio, MetaMask, Cap-go, Ace Data Cloud, PostHog, GitLab, Obsidian, LinkedIn Skills, Finance Skills, Notion Cookbook, Second Brain OS, Publora, TweetClaw, Qubrics, Goose, Instagram Skills, X Skills, TikTok Skills, Facebook Skills, Threads Skills, YouTube Skills, LinkedIn Automation, Stock Analysis |
| Automation and integration | n8n workflows, Coupler, Browser Act, Oxylabs, Temporal, Prefect, Apache Airflow, Astronomer, Trigger.dev, ShipSwift |
| Review and quality | Sentry engineering, CodeRabbit, LambdaTest, GitHub Copilot, Anthropic Plugins, Alibaba code review, NVIDIA Skill Inspector, Grafana, CTF Skills, Thinking Skills, Cybersecurity Skills |
| Infrastructure and security | DevOps and security, Tencent AI Infra Guard, Cloudflare security audit, Cybersecurity Skills (MITRE, NIST), Hol Guard, Signet, ClawScan |
| Design, media and 3D | OpenMotion, Open Design, Baoyu, Social Auto Upload, Blender Skills, Scenario Labs, Awesome Design Skills, Effective HTML, LottieFiles, ChatCut, HyperFrames, Three.js, UI Skills, Superdesign, KiCad |
| Skill catalogues | Agentic Awesome Skills, Agent Skill Exchange, Agent Master Skills, Claude Skills Catalogue, Agent Plugin Marketplace, Product Management Skills, High-Value Skills, Awesome Skills (Chinese), All Skills, Skill Galaxy, Skills Hub, Legal Skills (German), Legal Skills (English) |
| Business | Marketing (Corey Haines), Product management (Paweł Huryn), E-commerce Skills, EveryInfra, Citlyze, Yan Skills |
| Science and making | Google DeepMind, Scientific agent skills (K-Dense AI), TypeSafe, Game development, Reverse engineering, Jane Street, Open Science, AI Research Skills (Orchestra Research), ARIS |
| Productivity | Home Assistant, Skill Seekers, Avoid AI Writing, Creative Writing, Luong Skills |

The repositories the tooling added are not curated by area: each one is its own Plugin, filed
under the category the store gives it. There are 214 of them.

| Category | Repositories |
| --- | --- |
| Office | DDC Skills For AI Agents In Construction |
| Science & Healthcare | CaseMark Skills 2, Gtm Agents |
| Education | Ellmos Ai Skills |
| Design & Sites | Agent Master Skills, AI Business Designer, All Skills 3, Awesome Skills Cn, Awesome Skills Cn 2, Bovinphang Frontend Craft, Cc Polymath, Claude Code Minoan, Claude Code Skills, Claude Mods, ClaudeSkillz, COG Second Brain, Dotnet With Claudecode, Fusengine Agents, Jezweb Claude Skills, Knowledge Work Plugins For Codex, OneWave AI Claude Skills, Rampstackco Claude Skills, Secondsky Claude Skills, Skill MCP Claude, Spellbook, The Agency, Try Skills 10, Try Skills 7, Try Skills 8, Try Skills 9, Wondelai Skills |
| Studio | Ai Dev Standards, Ai Hive Agent Skills, Ai Workflow, Ai Workflow 2, All Skills, Animation Principles, Claude, Claude Skills Journalism, Dotfiles, Jeo Skills, Lenny Skills, Trompetilla Skills, Try Skills |
| Sales | Second Brain Starter Kit, Thinkwithblack Skill |
| Business | Acm Ai, Advanced Memory Mcp, AgentLogistics, AiToEarn, Alirezarezvani Claude Skills 2, All Skills 6, BetterPromptme Skills, Continuous Claude V3, Deutsches Recht Slim 5, Legal Skills Open, Legal Skills Open 10, Legal Skills Open 11, Legal Skills Open 2, Legal Skills Open 3, Legal Skills Open 4, Legal Skills Open 5, Legal Skills Open 6, Legal Skills Open 7, Legal Skills Open 8, Legal Skills Open 9, Marketing Skills, Useful Ai Prompts, Vexjoy Agent, Vp Real Estate, Ystack |
| Productivity | Ai Rulez, Aiwg, Claude Code Workflow, Dex, Goodvibes Plugin, Skill Forge 2, TheAngrySkills, Try Skills 2, ValentinNikolaev Agent Skills |
| Code | .Claude, Agent Alchemy, Agent Skills Standard, Agentic Coding Lab, Agentic Commerce Claude Plugins, Agentic Qe, Agentii Investment Intelligence, Agentops, Agents Inc Skills, Agentskillexchange Skills, AGI Super Skills, Ai Agents, Aibox, All Skills 2, All Skills 4, All Skills 5, All Skills 7, All Skills 8, Antigravity Awesome Skills, Aos, Axiom, Basitalisandhu Claude Skills, Beagle, BioSkills, Bounty Reaper, Buildwithclaude, Claude Code Apple Skills, Claude Code Plugins, Claude Code Workflows, Claude Codex Settings, Claude Craft, Claude Elixir Phoenix, Claude Night Market, Claude Plugin Marketplace, CloudBase AI Toolkit, Codex Game Studios, Codex Starter Kit, Context Cascade, CS2 VibeSignatures, Davila7 Claude Code Templates 2, Davila7 Claude Code Templates 3, Developer Kit, Forge Core, Glebis Claude Skills, Harness Skills, Human Skills, Jarvis, Jeffallan Claude Skills, Kbarbel640 Del Skills, Konoha, Libr Agent, Magnus919 Agent Skills, NWave, Oaustegard Claude Skills, Odin Claude Plugin, Oh My Agent, Ok Skills, Power Platform Skills, Product Forge, ProjectOdyssey, Qaskills, Ralph Orchestra, Ruby Agent Skills, Runx, Sf Skills, Sickn33 Agentic Awesome Skills 2, Sickn33 Agentic Awesome Skills 3, Sickn33 Agentic Awesome Skills 4, Skill Forge, Skill Hub, Skillhub Main, Skills Collection 1, Skills.Md, Skillset, Skillshub, Skillshub 2, SploitAgent, SriramGandhiS Skills, SuperClaude, Superpowers Sage, Superpowers Symfony, Tasktrooper, TerminalSkills Skills, The Utopia Studio Skills, TheWatcher01 Skills, Toolkit, Trompetilla Skills 2, Turbo, Vibes Plug, Webhook Skills |
| Other | Ai Native Storage Certus, Asi, Awesome Codex Plugins, Awesome Codex Plugins 2, BitBot, CaseMark Skills, Claude Configs, Claude Cookbooks, Claude Cortex, Cursor Rules Java, Deutsches Recht Slim, Deutsches Recht Slim 10, Deutsches Recht Slim 11, Deutsches Recht Slim 12, Deutsches Recht Slim 13, Deutsches Recht Slim 14, Deutsches Recht Slim 15, Deutsches Recht Slim 16, Deutsches Recht Slim 17, Deutsches Recht Slim 18, Deutsches Recht Slim 19, Deutsches Recht Slim 2, Deutsches Recht Slim 20, Deutsches Recht Slim 3, Deutsches Recht Slim 4, Deutsches Recht Slim 6, Deutsches Recht Slim 7, Deutsches Recht Slim 8, Deutsches Recht Slim 9, HPClaw, Lib Electronic Components, Longbridge Skills, Molcajete.Ai, NgAutoPilot, Pcl, Reactive Resume, SkillNet, Skillsbank, Tonone, Try Skills 3, Try Skills 4, Try Skills 5, Try Skills 6, WeReply |
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
| `store/index.json`, `store/archives/`, `store/icons/`, `store/store.config.json` | Generated by the build; **not committed**. They are the asset of a release (see "The store as a release") |
| `scripts/gen-config.mjs` | Writes `store/store.config.json` from `sources.json`, `versions.json` and `store/plugins.json` |
| `scripts/gen-icons.mjs` | Writes `store/icons/` (one icon per Plugin) |
| `scripts/check-store.mjs` | The gate before a build is published: index, archives, manifests, counts |
| `scripts/update-sources.mjs` | Looks up the upstream head of every source, and with `--apply` moves the pins, clones the sources and vendors the Skills again |
| `tools/store/` | The store builder, copied from the Alran Code repository (MIT), so that this repository can build its own store |
| `EXCLUDED.md`, `THIRD_PARTY_NOTICES.md` | Generated |

## Update or add a source

```sh
git clone <repo> <work>/<clone>          # check out the commit you want; put clone and commit in sources.json
node scripts/vendor.mjs --work <work>
node scripts/vendor-package.mjs --work <work>      # packages; stops if an upstream file is not the one that was read
node scripts/gen-icons.mjs && node scripts/gen-config.mjs
node tools/store/build-store.mjs --source .          # writes ./store
node tools/store/build-store.mjs --source . --check  # exit 1 if ./store is stale
node scripts/check-store.mjs --store store          # the gate a release goes through
```

`tools/store/` is the store builder copied from the Alran Code repository (see `tools/README.md`); the same
commands run there as `node <alran-code>/tools/store/build-store.mjs --source .`.

The built `store/` folder is **not committed**: it is what a release publishes (see below). `store/plugins.json`
is the one file under `store/` that lives in git — the hand-written name and description of every Plugin.

Versions are `<commit date>+<short commit>` (SemVer: no zero padding); an update is recognised by the content
digest changing.

## The store as a release

The built store leaves this repository as the asset of a GitHub release, never as a commit:

- `.github/workflows/release-store.yml` runs after a merged update pull request (or by hand). It builds the store,
  runs the builder's own `--check`, runs `scripts/check-store.mjs` — index.json is JSON, every archive opens and
  matches the SHA-256 the index pins, every Plugin carries its manifest, and the counts do not drop by more than
  5 % against the release before it — and then publishes `store.tar.gz`, its SHA-256 and `index.json` as the
  assets of the release `store-<date>-r<run>`.
- The platform takes that release in a pull request of its own
  (`alran-platform/.github/workflows/sync-store.yml`): it downloads the asset, checks the SHA-256, replaces the
  store copy, checks it again with the platform's own reader, and opens a pull request. **It never merges and
  never deploys** — the merge is a human decision, and the deployment stays a separate, manual step.
- By hand, the same thing is one command in the platform repository:

```sh
cd ../alran-platform
npm run store:sync -- --from ../alran-store     # a checkout of this repository with its store/ built
git add src/content/store && git commit -m "Serve the store"
```

### Rolling a release back

Every release keeps the store it published, so going back is taking an earlier release — not rebuilding:

1. In the platform repository, run the sync workflow by hand with the release you want
   (`workflow_dispatch`, the `release` input), or check out the commit that served that release and run
   `npm run store:sync -- --from <a checkout of the store repository at that release>`.
2. Merge the pull request the workflow opened, and deploy as usual.

To go back inside this repository: check out the commit before the bad one and run the release workflow again.

## Keeping it up to date

`.github/workflows/update-sources.yml` runs every morning. It reads `sources.json`, asks each source's
repository for its head, and opens a pull request when a source has moved: the pin is updated, the Skills are
vendored again, the store is rebuilt and checked, and the pull request lists which source moved and from where
to where. Read `EXCLUDED.md` in the pull request for the Skills that were left out and why. Nothing is published
from the workflow; the pull request is reviewed and merged by hand.

The pull request carries the vendored Skills, `sources.json` and the files the vendor writes
(`versions.json`, `EXCLUDED.md`, `THIRD_PARTY_NOTICES.md`). The built `store/` folder is not part of it: it
holds one archive per Skill and is published as a release (see "The store as a release"), so a daily pull
request stays small.

Merging that pull request is what starts the release: the release workflow builds the store again, checks it,
and publishes it as an asset. The platform then opens a pull request of its own.

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
- its `SKILL.md` names it, and its name is not one of the Skills built in to Alran Code. The Plugin format V1
  names a Skill after its folder, so a Skill that declares another name is taken under that name, and the folder
  in the store follows it. A source that asks for it (`"normalizeName": true`) may also name its Skills after
  the title it shows the reader: the store then sets `name` to the name of the folder and keeps the title in a
  `title` field beside it. That one field is the only thing the store changes, and the Skill's own `SOURCE.md`
  says so;
- its frontmatter is a flat mapping of scalars, the way the store's Plugin validator reads it: the
  `description` has to be a value on the line of its key (a value that only continues on the lines below
  is not one), and no key may appear twice;
- it has no invisible characters or data URIs, and no line that pipes a download into a shell, decodes a base64
  blob, loads a remote script or tells the model to ignore its instructions (unless the line itself marks it
  as a bad example, as in a security guide);
- it does not need an MCP server: Alran Code sets up no MCP connectors, so a Skill that asks for one asks for a
  tool that does not exist. A Skill that names an MCP server and a way around it (a CLI, an SDK, curl, an API)
  is kept;
- it is a Skill and not a pointer to one: an archive that keeps a `SKILL.md` only so that old links keep
  working says so, and that file is left out;
- every link that leaves its folder lands on another Skill of the same source (or a shared folder) that is in.

A Skill that fails is left out and listed in `EXCLUDED.md` with the reason; for a named Skill the run stops
instead. The Skills run no code of their own; what an agent does with their text goes through Alran's normal
permissions. A few links in the text itself are broken in the originals too (placeholders, or paths that only
make sense in the upstream repository); they are copied as they are.

A Skill whose only fault is a folder of code still comes in without that folder: the folders are `scripts/`,
`evals/`, `hooks/`, `examples/`, `tests/`, `samples/`, `demos/`, `fixtures/`, `benchmarks/`, `tools/` and
`bin/`, and the Skill is kept as long as its own text never points at that folder or at a file in it. A Skill
that says "run `scripts/analyze.py`" and then loses the folder points at a file that is not there, which is
worse than a Skill that is not in the store at all, so those are left out. The word "script" in a sentence is
prose, not a pointer: only a path counts. Every Skill that comes in this way says so in its own `SOURCE.md`,
and `EXCLUDED.md` lists them all.

A Skill whose folder name, or a file inside it, is longer than 128 bytes is left out: the Plugin format V1
holds a path segment to 128 bytes, and the store does not hold what the format cannot carry.

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
- [LeoYeAI/agent-master-skills](https://github.com/LeoYeAI/agent-master-skills) (MIT): a catalogue of 3,444 Skills that
  are written by other projects. Fourteen of them declare a licence of their own that the catalogue's licence does
  not cover — the Anthropic document Skills, which are not open-source, and seven that declare themselves
  proprietary. Those fourteen are left out by name; the rest are in the store.
- [agentskillexchange/skills](https://github.com/agentskillexchange/skills) (MIT): 3,263 Skills, and every one of
  them names itself after its display name (`name: "Activepieces Open Source Workflow Automation"`) instead of its
  folder. The source asks for the title rule, so the store sets the `name` to the name of the folder and keeps
  the title beside it.
- [majiayu000/claude-skill-registry](https://github.com/majiayu000/claude-skill-registry) (MIT): 33,565 Skills, and
  every one of them is a pointer that says the Skill was moved to another repository. A pointer is not a Skill.
- [23blocks-OS/ai-maestro](https://github.com/23blocks-OS/ai-maestro) (MIT) and
  [linked-api/linkedin-skills](https://github.com/linked-api/linkedin-skills) (MIT): their one Skill each has a name
  the store already has.
- [Capta1nRaj/goshipit](https://github.com/Capta1nRaj/goshipit) (Apache-2.0) and
  [openqa-cn/codexqa](https://github.com/openqa-cn/codexqa) (Apache-2.0): their Skills are nothing but their own
  scripts, and their text points at them.
- [ThinkFlowLab/agentdescent](https://github.com/ThinkFlowLab/agentdescent) (MIT),
  [the911fund/skill-of-skills](https://github.com/the911fund/skill-of-skills) (MIT),
  [ddrayne/openclaw-homeassistant](https://github.com/ddrayne/openclaw-homeassistant) (Apache-2.0),
  [J-nowcow/awesome-korean-agent-skills](https://github.com/J-nowcow/awesome-korean-agent-skills) (CC0-1.0),
  [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) (MIT),
  [MetaMask/skills](https://github.com/MetaMask/skills) (MIT) and
  [YouMind-OpenLab/nano-banana-pro-prompts-recommend-skill](https://github.com/YouMind-OpenLab/nano-banana-pro-prompts-recommend-skill):
  no Skill in a folder of its own, or no licence file at the root of the repository.
- [jinzhezenggroup/computational-chemistry-agent-skills](https://github.com/jinzhezenggroup/computational-chemistry-agent-skills)
  (LGPL-3.0) and [tbdavid2019/openclaw-docs-skill](https://github.com/tbdavid2019/openclaw-docs-skill) (AGPL-3.0):
  not the licences the store takes.

Whoever publishes a store is responsible for the licences of what is in it. [HashiCorp's Skills](https://github.com/hashicorp/agent-skills)
are MPL-2.0: they are redistributed unmodified, source text only. The scripts and configuration in this
repository have no licence file yet; that is for the owner to choose.
