// The cache refresh reloads only the files listed in cache_manifest.json. Every file the app loads without a version query must be listed there, or returning users keep a stale copy after an update.

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const workspace_root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CODE_AND_TEXT_EXTENSIONS = new Set([".js", ".mjs", ".css", ".html", ".json", ".md"]);

function to_workspace_path(absolute_path) {
   return relative(workspace_root, absolute_path).split(sep).join("/");
}

function is_inside_workspace(absolute_path) {
   const relative_path = relative(workspace_root, absolute_path);
   return relative_path !== "" && !relative_path.startsWith("..") && !/^[a-zA-Z]:/.test(relative_path);
}

function read_text(workspace_path) {
   return readFileSync(resolve(workspace_root, workspace_path), "utf8");
}

function extension_of(path) {
   const last_dot = path.lastIndexOf(".");
   return last_dot > path.lastIndexOf("/") ? path.slice(last_dot).toLowerCase() : "";
}

function without_query_and_hash(path) {
   return path.split(/[?#]/)[0];
}

function is_local_reference(path) {
   return !/^(?:[a-z]+:|\/\/|#)/i.test(path);
}

function is_code_or_text_file(path) {
   return CODE_AND_TEXT_EXTENSIONS.has(extension_of(without_query_and_hash(path)));
}

/**
 * Removes only comments that start a line, and keeps every line break so that reported line numbers stay correct.
 * A comment in the middle of a line is kept on purpose: a string such as "image/*" would otherwise open a false block comment and hide real code.
 */
function without_comment_lines(source) {
   return source.replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, (block) => block.replace(/[^\n]/g, "")).replace(/^[ \t]*\/\/.*$/gm, "");
}

function line_of(source, index) {
   return source.slice(0, index).split("\n").length;
}

function find_versioned_literals(source) {
   const literals = [];
   for (const match of source.matchAll(/(import\s*\(\s*)?versioned_url\(\s*(["'`])([^"'`$\n]*?)\2/g)) {
      literals.push({ path: match[3], is_module_import: Boolean(match[1]), line: line_of(source, match.index) });
   }
   return literals;
}

function find_plain_loads(source) {
   const loads = [];
   for (const match of source.matchAll(/(?:\.(?:href|src)\s*=\s*|\bfetch\(\s*)(["'`])([^"'`$\n]+?)\1/g)) {
      loads.push({ path: match[2], line: line_of(source, match.index) });
   }
   return loads;
}

/**
 * Inside import() a path resolves relative to the importing module; every other load resolves relative to index.html at the workspace root.
 */
function resolve_versioned_literal(workspace_path, literal) {
   const base_folder = literal.is_module_import ? dirname(resolve(workspace_root, workspace_path)) : workspace_root;
   return resolve(base_folder, without_query_and_hash(literal.path));
}

function read_manifest_entries(problems) {
   const manifest = JSON.parse(read_text("cache_manifest.json"));
   if (!Array.isArray(manifest.files)) {
      throw new Error("cache_manifest.json has no files array");
   }
   const entries = new Set();
   for (const entry of manifest.files) {
      const workspace_path = String(entry).trim().replace(/^\.\//, "").replace(/^\//, "");
      if (entries.has(workspace_path)) {
         problems.push(`cache_manifest.json lists "${workspace_path}" twice`);
      }
      entries.add(workspace_path);
      if (!existsSync(resolve(workspace_root, workspace_path))) {
         problems.push(`cache_manifest.json lists "${workspace_path}", which does not exist`);
      }
   }
   return entries;
}

function read_index_references() {
   const html = read_text("index.html");
   const module_scripts = [];
   const references = [];
   for (const match of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
      const tag = match[0];
      const attribute_match = tag.match(/\b(?:src|href)\s*=\s*"([^"]+)"/i);
      if (!attribute_match || !is_local_reference(attribute_match[1])) {
         continue;
      }
      const workspace_path = to_workspace_path(resolve(workspace_root, without_query_and_hash(attribute_match[1])));
      references.push(workspace_path);
      if (/^<script\b/i.test(tag) && /\btype\s*=\s*"module"/i.test(tag)) {
         module_scripts.push(workspace_path);
      }
   }
   return { module_scripts, references };
}

function list_static_module_graph(root_paths) {
   const tsc_arguments = ["--listFilesOnly", "--allowJs", "--noEmit", "--target", "es2022", "--module", "es2022", "--moduleResolution", "bundler", "--lib", "es2022,dom,dom.iterable", ...root_paths];
   const command = ["tsc", ...tsc_arguments].map((part) => `"${part}"`).join(" ");
   const result = spawnSync(command, { cwd: workspace_root, encoding: "utf8", shell: true });
   if (result.error) {
      throw result.error;
   }
   if (result.status !== 0) {
      throw new Error(`tsc --listFilesOnly exited with code ${result.status}\n${result.stdout}${result.stderr}`);
   }
   return result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => resolve(workspace_root, line))
      .filter(is_inside_workspace)
      .map(to_workspace_path);
}

function collect_dynamic_import_targets(graph_paths) {
   const targets = new Set();
   for (const graph_path of graph_paths) {
      for (const literal of find_versioned_literals(without_comment_lines(read_text(graph_path)))) {
         const absolute_target = resolve_versioned_literal(graph_path, literal);
         if (literal.is_module_import && is_inside_workspace(absolute_target) && existsSync(absolute_target)) {
            targets.add(to_workspace_path(absolute_target));
         }
      }
   }
   return targets;
}

/**
 * Modules loaded through import(versioned_url(...)) are invisible to tsc, because their path is built at run time. They join the roots until no new module appears, so their own static imports are covered as well.
 */
function list_loaded_modules(module_scripts) {
   const root_paths = new Set(module_scripts);
   for (;;) {
      const graph_paths = list_static_module_graph([...root_paths]);
      const unseen_targets = [...collect_dynamic_import_targets(graph_paths)].filter((target) => !root_paths.has(target));
      if (unseen_targets.length === 0) {
         return graph_paths;
      }
      unseen_targets.forEach((target) => root_paths.add(target));
   }
}

function check_loaded_module(graph_path, manifest_entries, problems) {
   if (!manifest_entries.has(graph_path)) {
      problems.push(`"${graph_path}" is a module the app loads, but cache_manifest.json does not list it`);
   }
   const source = without_comment_lines(read_text(graph_path));
   for (const literal of find_versioned_literals(source)) {
      const absolute_target = resolve_versioned_literal(graph_path, literal);
      const location = `${graph_path}:${literal.line}`;
      if (!is_inside_workspace(absolute_target)) {
         problems.push(`${location}: versioned_url("${literal.path}") points outside the app`);
      } else if (!existsSync(absolute_target)) {
         problems.push(`${location}: versioned_url("${literal.path}") points to "${to_workspace_path(absolute_target)}", which does not exist`);
      }
   }
   for (const load of find_plain_loads(source)) {
      if (!is_local_reference(load.path) || !is_code_or_text_file(load.path)) {
         continue;
      }
      const absolute_target = resolve(workspace_root, without_query_and_hash(load.path));
      const target_path = to_workspace_path(absolute_target);
      const location = `${graph_path}:${load.line}`;
      if (!existsSync(absolute_target)) {
         problems.push(`${location}: loads "${target_path}", which does not exist`);
      } else if (!manifest_entries.has(target_path)) {
         problems.push(`${location}: loads "${target_path}" without a version query, but cache_manifest.json does not list it`);
      }
   }
}

function check_version_messages(manifest_entries, problems) {
   const version_config = JSON.parse(read_text("version.json"));
   for (const [version, message_path] of Object.entries(version_config.history ?? {})) {
      const workspace_path = String(message_path).replace(/^\.\//, "");
      if (!existsSync(resolve(workspace_root, workspace_path))) {
         problems.push(`version.json: the message for ${version} is "${workspace_path}", which does not exist`);
      } else if (!manifest_entries.has(workspace_path)) {
         problems.push(`version.json: the message for ${version} is "${workspace_path}", but cache_manifest.json does not list it`);
      }
   }
}

function run_manifest_check() {
   const problems = [];
   const manifest_entries = read_manifest_entries(problems);
   const { module_scripts, references } = read_index_references();
   for (const reference of references) {
      if (is_code_or_text_file(reference) && !manifest_entries.has(reference)) {
         problems.push(`index.html loads "${reference}" without a version query, but cache_manifest.json does not list it`);
      }
   }
   for (const graph_path of list_loaded_modules(module_scripts)) {
      check_loaded_module(graph_path, manifest_entries, problems);
   }
   check_version_messages(manifest_entries, problems);
   return problems;
}

try {
   const problems = run_manifest_check();
   if (problems.length > 0) {
      console.log("check failed: cache manifest");
      for (const problem of problems) {
         console.log(`   ${problem}`);
      }
      process.exitCode = 1;
   }
} catch (error) {
   console.log(`check failed: the cache manifest check could not run: ${error instanceof Error ? error.message : String(error)}`);
   process.exitCode = 1;
}
