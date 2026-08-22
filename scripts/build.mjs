#!/usr/bin/env node
/**
 * Renders every harness target from the single source of truth.
 *
 *   node scripts/build.mjs            write all generated files
 *   node scripts/build.mjs --check    fail (exit 1) if any generated file is stale
 *
 * Source of truth per plugin:
 *   src/<id>/RULES.md               the rule text, body only, no frontmatter
 *   src/<id>/meta.json              names, descriptions, manifest metadata
 *   src/<id>/fragments/*.md         the few paragraphs that legitimately differ per copy
 *
 * Repo-level: src/repo.json
 *
 * Zero dependencies on purpose — Node 18+ and nothing else.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const readJson = (p) => JSON.parse(read(p));

const repo = readJson("src/repo.json");

/** Files we intend to write: path -> contents. Filled by buildPlugin(). */
const out = new Map();
const emit = (path, contents) => {
  if (out.has(path)) throw new Error(`two targets write the same path: ${path}`);
  out.set(path, contents.endsWith("\n") ? contents : contents + "\n");
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** A YAML double-quoted scalar. JSON string escaping is valid YAML here. */
const yamlStr = (s) => JSON.stringify(s);

const GEN_MD = (id, target) =>
  `<!-- GENERATED from src/${id}/RULES.md by scripts/build.mjs — do not edit by hand.\n` +
  `     Edit the source, then run: node scripts/build.mjs\n` +
  `     Target: ${target} -->`;

const GEN_HASH = (id, target) =>
  `# GENERATED from src/${id}/RULES.md by scripts/build.mjs — do not edit by hand.\n` +
  `# Edit the source, then run: node scripts/build.mjs   (target: ${target})`;

const TEMPLATE_IDS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11"];

/**
 * Reads the template files and pulls out what the lazy-load map needs.
 * `sections` counts the numbered required sections; templates split into modes
 * (only T8 today) report one count per mode, e.g. "6 + 5".
 */
function readTemplates(id) {
  return TEMPLATE_IDS.map((tid) => {
    const body = read(`src/${id}/templates/${tid}.md`);
    const head = body.split("\n", 1)[0];
    const m = head.match(/^## (T\d+) · (.+)$/);
    if (!m) throw new Error(`${tid}.md must start with "## T<n> · <Name>", got: ${head}`);
    // Count numbered items per "### " block so a two-mode template reports both.
    const blocks = body.split(/^### /m).map((b) => (b.match(/^\d+\. \*\*/gm) || []).length);
    const counts = blocks.filter((n) => n > 0);
    return {
      id: tid,
      name: m[2],
      body: body.trimEnd(),
      sections: counts.length ? counts.join(" + ") : "—",
    };
  });
}

/**
 * Every `<!-- @x -->` marker in RULES.md other than the three structural ones is a LAZY BLOCK,
 * resolved by convention with no config:
 *
 *   src/<id>/reference/x.md      the content — what a single-file copy gets inlined
 *   src/<id>/fragments/pointer-x.md   what the skill gets instead: a pointer telling it to read the file
 *
 * A block with no reference/x.md must be listed in SKILL_ONLY_MARKERS: single-file copies get
 * nothing, because the instruction ("go read that file") is meaningless to a copy that has no files.
 * Anything else missing its reference file is a typo, and typos here silently DELETE rule text from
 * every single-file copy — so it throws.
 */
const STRUCTURAL_MARKERS = ["title", "which-copy", "templates"];
const SKILL_ONLY_MARKERS = ["checklist-reads"];

function readLazyBlocks(id, rules) {
  const names = [...rules.matchAll(/<!-- @([a-z-]+) -->/g)].map((m) => m[1]);
  for (const m of STRUCTURAL_MARKERS) {
    if (!names.includes(m)) throw new Error(`RULES.md is missing <!-- @${m} -->`);
  }
  return names
    .filter((n) => !STRUCTURAL_MARKERS.includes(n))
    .map((name) => {
      const refPath = `src/${id}/reference/${name}.md`;
      const abs = join(ROOT, refPath);
      if (!existsSync(abs) && !SKILL_ONLY_MARKERS.includes(name)) {
        throw new Error(
          `<!-- @${name} --> has no ${refPath}. Single-file copies would silently lose that ` +
            `rule text. Create the file, or add "${name}" to SKILL_ONLY_MARKERS if it is a ` +
            `skill-only instruction.`
        );
      }
      return {
        name,
        content: existsSync(abs) ? read(refPath).trimEnd() : "",
        pointer: read(`src/${id}/fragments/pointer-${name}.md`).trimEnd(),
      };
    });
}

/**
 * Renders RULES.md for one copy kind.
 * @param {string} rules     raw RULES.md, with all its markers
 * @param {string} title     H1 text
 * @param {string} frag      the which-copy fragment body
 * @param {string} templates the @templates block: full bodies, or the lazy-load map
 * @param {object[]} lazy    the lazy blocks
 * @param {boolean} canRead  true for the skill (a directory) — false for single-file copies
 */
function renderBody(rules, title, frag, templates, lazy, canRead) {
  let out = rules
    .replace("<!-- @title -->", `# ${title}`)
    .replace("<!-- @which-copy -->", frag.trimEnd())
    .replace("<!-- @templates -->", templates.trimEnd());
  for (const b of lazy) {
    out = out.replace(`<!-- @${b.name} -->`, canRead ? b.pointer : b.content);
  }
  // Collapse the blank line left behind by a marker that expanded to nothing.
  out = out.replace(/\n\n\n+/g, "\n\n");
  if (out.includes("<!-- @")) {
    throw new Error(`unresolved marker left in output: ${out.match(/<!-- @[a-z-]+ -->/)[0]}`);
  }
  return out;
}

/** Every template inlined — for copies that are a single file and cannot lazy-load. */
const templatesInline = (tpl) => tpl.map((t) => t.body).join("\n\n") + "\n";

/**
 * The lazy-load block — for the skill, which is a directory and can read bundled files.
 * T1 is inlined because it is two lines: reading a file for it costs more than the template.
 */
function templatesLazy(prose, tpl) {
  const t1 = tpl.find((t) => t.id === "T1");
  return prose.trimEnd() + "\n\n" + t1.body + "\n";
}

/** Where each template's body lives, as the skill sees it. */
const readCell = (t) => (t.id === "T1" ? "inline below" : `\`templates/${t.id}.md\``);

/**
 * Skill only: widen the "How to pick" table with `Sections` and `Read`, instead of
 * repeating all ten template names in a second table underneath. One table, one lookup.
 * Single-file copies keep the narrow table — they have no files to point at.
 */
function mergePickTable(body, tpl) {
  const head = "| | Template | Pick it when |\n|---|---|---|\n";
  if (!body.includes(head)) {
    throw new Error('the "How to pick" table header changed in RULES.md — update mergePickTable()');
  }
  let out = body.replace(head, "| | Template | Pick it when | Sections | Read |\n|---|---|---|---|---|\n");
  for (const t of tpl) {
    const row = new RegExp(`^\\| \`${t.id}\` \\| .+ \\|$`, "m");
    if (!row.test(out)) throw new Error(`no "How to pick" row for ${t.id} in RULES.md`);
    out = out.replace(row, (line) => `${line} ${t.sections} | ${readCell(t)} |`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// per-plugin targets
// ---------------------------------------------------------------------------

function buildPlugin(id, { ownsRoot }) {
  const meta = readJson(`src/${id}/meta.json`);
  const rules = read(`src/${id}/RULES.md`);
  const frag = (kind) => read(`src/${id}/fragments/which-copy.${kind}.md`);

  const dir = `plugins/${id}`;
  const tpl = readTemplates(id);

  // The skill is a DIRECTORY, so it gets the lazy-load map plus bundled template files.
  // The output style and every context file are a SINGLE file with no way to resolve a path
  // at inference time, so they get every template inlined. Same source either way.
  const lazyTpl = templatesLazy(read(`src/${id}/fragments/templates-lazy.md`), tpl);
  const inlineTpl = templatesInline(tpl);
  const blocks = readLazyBlocks(id, rules);

  const skillBody = mergePickTable(
    renderBody(rules, meta.titles.skill, frag("skill"), lazyTpl, blocks, true),
    tpl
  );
  const styleBody = renderBody(rules, meta.titles["output-style"], frag("output-style"), inlineTpl, blocks, false);
  const contextBody = renderBody(rules, meta.titles["context-file"], frag("context-file"), inlineTpl, blocks, false);

  // --- the one portable artifact: SKILL.md ---------------------------------
  const skillMd =
    `---\n` +
    `name: ${meta.skill.name}\n` +
    `description: ${yamlStr(meta.skill.description)}\n` +
    `---\n\n` +
    `${GEN_MD(id, "Agent Skill (Claude Code, Codex, Gemini, Zed, Copilot, Cursor, Pi, …)")}\n\n` +
    `${skillBody}`;
  emit(`${dir}/skills/${id}/SKILL.md`, skillMd);

  // Bundled reference files, one level deep from SKILL.md so they get read whole.
  for (const t of tpl) {
    emit(
      `${dir}/skills/${id}/templates/${t.id}.md`,
      `${GEN_MD(id, `template ${t.id}`)}\n\n${t.body}\n`
    );
  }
  for (const b of blocks.filter((b) => b.content)) {
    emit(
      `${dir}/skills/${id}/reference/${b.name}.md`,
      `${GEN_MD(id, `reference ${b.name}`)}\n\n${b.content}\n`
    );
  }

  // --- Claude Code output style -------------------------------------------
  emit(
    `${dir}/output-styles/${id}.md`,
    `---\n` +
      `name: ${meta.outputStyle.name}\n` +
      `description: ${yamlStr(meta.outputStyle.description)}\n` +
      `keep-coding-instructions: ${meta.outputStyle.keepCodingInstructions}\n` +
      // `force-for-plugin` is written only when a plugin really wants to seize the answer format
      // on enable. `false` is not the same as absent: once a forced plugin style exists, Claude
      // Code stops reading the user's own `outputStyle` at all, so the style can no longer be
      // switched off from `/config` — only by disabling the whole plugin. Opt in, never default.
      (meta.outputStyle.forceForPlugin === true ? `force-for-plugin: true\n` : ``) +
      `---\n\n` +
      `${GEN_MD(id, "Claude Code output style")}\n\n` +
      `${styleBody}`
  );

  // --- Claude Code plugin manifest ----------------------------------------
  emit(
    `${dir}/.claude-plugin/plugin.json`,
    JSON.stringify(
      {
        name: id,
        // No `displayName` here — `claude plugin validate` rejects it as an unrecognized key,
        // even though it appears in the docs' field list. Codex's manifest does accept it,
        // via `interface.displayName`.
        version: meta.version,
        description: meta.pluginDescription,
        author: repo.marketplace.owner,
        homepage: repo.repo.url,
        repository: repo.repo.url,
        license: repo.repo.license,
        keywords: meta.keywords,
        // `skills` ADDS to the default ./skills scan; outputStyles REPLACES its default.
        outputStyles: [`./output-styles/${id}.md`],
        // Deliberately NO `hooks` key. The standard ./hooks/hooks.json is auto-loaded, and
        // naming it here fails the plugin at load time with "Duplicate hooks file detected".
        // manifest.hooks is only for ADDITIONAL hook files.
      },
      null,
      2
    )
  );

  // --- Codex plugin manifest ----------------------------------------------
  emit(
    `${dir}/.codex-plugin/plugin.json`,
    JSON.stringify(
      {
        name: id,
        version: meta.version,
        description: meta.pluginDescription,
        author: repo.marketplace.owner,
        homepage: repo.repo.url,
        repository: repo.repo.url,
        license: repo.repo.license,
        keywords: meta.keywords,
        skills: "./skills/",
        // No `hooks` key here either, for the same reason as the Claude Code manifest:
        // ./hooks/hooks.json is discovered automatically at the plugin root.
        interface: {
          displayName: meta.interface.displayName,
          shortDescription: meta.interface.shortDescription,
          longDescription: meta.interface.longDescription,
          developerName: repo.marketplace.owner.name,
          category: "Productivity",
          capabilities: ["Instructions"],
          websiteURL: repo.repo.url,
          defaultPrompt: meta.interface.defaultPrompt,
          brandColor: meta.brandColor,
        },
      },
      null,
      2
    )
  );

  // --- Codex per-skill tuning ---------------------------------------------
  emit(
    `${dir}/skills/${id}/agents/openai.yaml`,
    `${GEN_HASH(id, "Codex per-skill interface")}\n\n` +
      `interface:\n` +
      `  display_name: ${yamlStr(meta.interface.displayName)}\n` +
      `  short_description: ${yamlStr(meta.interface.shortDescription)}\n` +
      `  default_prompt: ${yamlStr(meta.interface.defaultPrompt[0])}\n\n` +
      `policy:\n` +
      `  allow_implicit_invocation: true\n`
  );

  // --- Gemini CLI custom command ------------------------------------------
  // Literal multiline string ('''), so nothing in the rules is escape-processed.
  if (contextBody.includes("'''")) {
    throw new Error("RULES.md contains ''' — it would terminate the TOML literal string");
  }
  emit(
    `${dir}/skills/${id}/agents/gemini.toml`,
    `${GEN_HASH(id, "Gemini CLI custom command")}\n` +
      `# Install: cp this file to ~/.gemini/commands/${id}.toml, then type /${id}\n\n` +
      `description = ${JSON.stringify(meta.interface.shortDescription)}\n\n` +
      `prompt = '''\n${contextBody}\n\n{{args}}\n'''\n`
  );

  // --- the distributable single-file copy ----------------------------------
  // What a user copies into their own project as AGENTS.md. It lives HERE, not at the repo
  // root: the root AGENTS.md is this repo's own instructions for agents editing the plugins.
  emit(
    `${dir}/AGENTS.md`,
    `${GEN_MD(id, "distributable AGENTS.md / context file")}\n\n${contextBody}`
  );

  // --- plugin readme -------------------------------------------------------
  emit(
    `${dir}/README.md`,
    `${GEN_MD(id, "plugin readme")}\n\n` +
      `# ${meta.interface.displayName}\n\n` +
      `${meta.pluginDescription}\n\n` +
      `Everything in this directory except \`hooks/\` is generated from \`src/${id}/\`.\n` +
      `Edit the source, then run \`node scripts/build.mjs\`.\n\n` +
      `| File | Harness |\n` +
      `|---|---|\n` +
      `| \`skills/${id}/SKILL.md\` | Every skills-aware harness — always-on rules plus a map of the templates |\n` +
      `| \`skills/${id}/templates/${TEMPLATE_IDS[0]}.md\`…\`${TEMPLATE_IDS.at(-1)}.md\` | Read on demand, one per turn |\n` +
      `| \`output-styles/${id}.md\` | Claude Code — the user picks it in \`/config\` → Output style |\n` +
      `| \`.claude-plugin/plugin.json\` | Claude Code manifest |\n` +
      `| \`.codex-plugin/plugin.json\` | Codex manifest |\n` +
      `| \`skills/${id}/agents/openai.yaml\` | Codex per-skill interface |\n` +
      `| \`skills/${id}/agents/gemini.toml\` | Gemini CLI custom command |\n` +
      `| \`hooks/\` | Claude Code / Codex opt-in always-on (hand-written) |\n\n` +
      `Install commands for every harness: [../../INSTALL.md](../../INSTALL.md).\n`
  );

  if (!ownsRoot) return;

  // -------------------------------------------------------------------------
  // repository-root targets — only for the rootHarnessOwner plugin, because
  // these harnesses only read instruction files from the repo root.
  // -------------------------------------------------------------------------
  const rootHeader = (target) => `${GEN_MD(id, target)}\n\n`;

  // NOTE: the repo root AGENTS.md and CLAUDE.md are NOT generated. They are hand-written
  // instructions for agents editing this repo, and CLAUDE.md is a symlink to AGENTS.md.
  // The distributable copy of the rules is plugins/<id>/AGENTS.md, emitted above.

  // Gemini CLI extension. GEMINI.md has to stay at the root because
  // `gemini extensions install <repo-url>` only reads the repo root.
  emit("GEMINI.md", rootHeader("root GEMINI.md") + contextBody);
  emit(
    "gemini-extension.json",
    JSON.stringify(
      {
        name: id,
        version: meta.version,
        description: meta.pluginDescription,
        contextFileName: "GEMINI.md",
      },
      null,
      2
    )
  );

  // GitHub Copilot — outranks AGENTS.md
  emit(".github/copilot-instructions.md", rootHeader("GitHub Copilot instructions") + contextBody);

  // Zed — first-match-wins list, and it does not follow symlinks
  emit(".rules", rootHeader("Zed .rules") + contextBody);

  // Cursor — MUST be .mdc with alwaysApply, a plain .md here is ignored
  emit(
    `.cursor/rules/${id}.mdc`,
    `---\n` +
      `description: ${yamlStr(meta.cursorDescription)}\n` +
      `globs:\n` +
      `alwaysApply: true\n` +
      `---\n\n` +
      rootHeader("Cursor project rule") +
      contextBody
  );

  // Codex without the plugin, and every harness that scans .agents/skills.
  // Mirror the bundled templates too, or the lazy-load map points at nothing.
  emit(`.agents/skills/${id}/SKILL.md`, skillMd);
  for (const t of tpl) {
    emit(`.agents/skills/${id}/templates/${t.id}.md`, `${GEN_MD(id, `template ${t.id}`)}\n\n${t.body}\n`);
  }
  for (const b of blocks.filter((b) => b.content)) {
    emit(`.agents/skills/${id}/reference/${b.name}.md`, `${GEN_MD(id, `reference ${b.name}`)}\n\n${b.content}\n`);
  }

  // Antigravity reads a repo-root plugin.json
  emit(
    "plugin.json",
    JSON.stringify({ name: id, version: meta.version, description: meta.pluginDescription }, null, 2)
  );
}

// ---------------------------------------------------------------------------
// marketplaces
// ---------------------------------------------------------------------------

function buildMarketplaces() {
  const entries = repo.plugins.map((id) => {
    const meta = readJson(`src/${id}/meta.json`);
    return {
      name: id,
      description: meta.pluginDescription,
      source: `./plugins/${id}`,
      category: meta.category,
      tags: meta.tags,
    };
  });

  // Claude Code reads this. Codex ALSO reads it, as a legacy-compatible marketplace.
  emit(
    ".claude-plugin/marketplace.json",
    JSON.stringify(
      // `claude plugin validate` rejects `$schema` and a TOP-LEVEL `description` as unrecognized
      // keys — the marketplace description belongs under `metadata.description`.
      {
        name: repo.marketplace.name,
        owner: repo.marketplace.owner,
        metadata: { description: repo.marketplace.description },
        plugins: entries,
      },
      null,
      2
    )
  );

  // Codex's native marketplace location.
  //
  // `source.path` is what makes the plugin route work at all. Codex clones the whole repository
  // and, without a path, treats the REPOSITORY ROOT as the plugin root: it looks for `skills/`
  // there, finds nothing (this repo keeps them under `plugins/<id>/skills/`), synthesises its own
  // `.codex-plugin/plugin.json` and loads an empty plugin — while `codex plugin list` still reports
  // `installed, enabled`. With the path, the plugin root is `plugins/<id>/` and the shipped
  // `.codex-plugin/plugin.json`, `skills/`, `hooks/` are all found. Verified on codex-cli 0.147.0:
  // the install root goes from `…/low-battery/local` to `…/low-battery/<version>`, and
  // `codex debug prompt-input` lists `low-battery:low-battery`.
  //
  // Audit only with `codex debug prompt-input`, from a directory OUTSIDE this repo — inside it,
  // the project-scope `.agents/skills/` copy makes a broken plugin install look fine.
  emit(
    ".agents/plugins/marketplace.json",
    JSON.stringify(
      {
        name: repo.marketplace.name,
        interface: { displayName: "Toolbelt for Agents" },
        plugins: repo.plugins.map((id) => {
          const meta = readJson(`src/${id}/meta.json`);
          return {
            name: id,
            description: meta.pluginDescription,
            source: { source: "url", url: repo.repo.gitUrl, ref: repo.repo.ref, path: `./plugins/${id}` },
            policy: { installation: "AVAILABLE" },
            category: "Productivity",
          };
        }),
      },
      null,
      2
    )
  );
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------

for (const id of repo.plugins) {
  buildPlugin(id, { ownsRoot: id === repo.rootHarnessOwner });
}
buildMarketplaces();

const stale = [];
for (const [path, contents] of out) {
  const abs = join(ROOT, path);
  const current = existsSync(abs) ? readFileSync(abs, "utf8") : null;
  if (current === contents) continue;
  stale.push(path);
  if (!CHECK) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, contents);
  }
}

if (CHECK) {
  if (stale.length) {
    console.error("Generated files are stale:\n" + stale.map((p) => `  ${p}`).join("\n"));
    console.error("\nRun: node scripts/build.mjs");
    process.exit(1);
  }
  console.log(`up to date — ${out.size} generated files match the source`);
} else {
  console.log(
    stale.length
      ? `wrote ${stale.length} of ${out.size} files:\n` + stale.map((p) => `  ${p}`).join("\n")
      : `up to date — ${out.size} files already match`
  );
}
