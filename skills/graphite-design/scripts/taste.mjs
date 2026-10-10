#!/usr/bin/env node
// taste.mjs — the reader's taste profile for graphite drawings, on the command line.
//
// Since 2026-10-11 this forwards to the shared tool:
//   node skills/design-taste/scripts/taste.mjs --style=graphite <command> …
// Every command that worked here still works the same way:
//
//   node taste.mjs show | explain [knob] | suggest [--json|--css|--js] | ab
//   node taste.mjs pick <knob> <winner> <loser> [note]
//   node taste.mjs say "<what the reader said>"
//   node taste.mjs keep|drop '<json knobs>' [note]
//   node taste.mjs ingest <file> [--from=objective|critic]
//   node taste.mjs import <file.jsonl>
//   node taste.mjs reset --yes
//   node taste.mjs --self-test
//
// New: ref <pictures…> learns empty paper and number of colours from pictures the
// reader likes; --scene is accepted but graphite has no scene groups yet.
// The log moved to ${SKY_TASTE_DIR:-~/.config/sky-skills}/taste.jsonl (shared by all
// styles); the old graphite-taste.jsonl next to it is still read, never rewritten.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL = join(HERE, '../../design-taste/scripts/taste.mjs');
const args = process.argv.slice(2);
const r = spawnSync(process.execPath, [TOOL, '--style=graphite', ...args], { stdio: 'inherit' });
process.exit(r.status ?? 1);
