// Every SKILL.md in this repo must stay under Anthropic's recommended 500-line ceiling.
//
// A skill is loaded whole on every turn that triggers it, so its length is a permanent
// per-turn cost. Past the ceiling the model starts skimming instead of reading, which
// fails silently: the answer still looks compliant and is missing sections. That is
// exactly why the skill copy files its templates under templates/ instead of inlining
// them — this test is what stops that split from being quietly undone.
//
// Run: node --test scripts/

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// The ceiling itself, and how close a file may get before this test starts complaining.
// Both live here and nowhere else; AGENTS.md quotes the number in prose only.
const MAX_LINES = 500;
const HEADROOM_WARN = 25;

const SKIP_DIRS = new Set([".git", "node_modules", ".scratch"]);

function findSkillFiles(dir = ROOT, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      findSkillFiles(join(dir, entry.name), found);
    } else if (entry.name === "SKILL.md") {
      found.push(join(dir, entry.name));
    }
  }
  return found;
}

// Trailing newline means the last split element is an empty string — not a line.
const countLines = (text) => text.replace(/\n$/, "").split("\n").length;

const skills = findSkillFiles().sort();

test("every SKILL.md was found at all", () => {
  assert.ok(
    skills.length > 0,
    "no SKILL.md anywhere in the repo — the discovery walk is broken, not the skills"
  );
});

for (const abs of skills) {
  const rel = relative(ROOT, abs);

  test(`${rel} is at most ${MAX_LINES} lines`, () => {
    const lines = countLines(readFileSync(abs, "utf8"));
    const headroom = MAX_LINES - lines;

    assert.ok(
      lines <= MAX_LINES,
      `${rel} is ${lines} lines, ${-headroom} over the ${MAX_LINES}-line ceiling. ` +
        `Move rule text into reference/ or templates/ and point at it from SKILL.md — ` +
        `do not delete a rule to fit, and do not raise MAX_LINES.`
    );

    if (headroom <= HEADROOM_WARN) {
      console.log(
        `  note: ${rel} has ${headroom} line(s) of headroom left (${lines}/${MAX_LINES}). ` +
          `The next rule you add has to be filed, not inlined.`
      );
    }
  });
}
