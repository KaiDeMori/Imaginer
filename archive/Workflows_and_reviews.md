# Workflows and reviews

Read this when you are about to use a workflow, work with spawned agents, or run an adversarial review. Spawning any agent needs the user's permission first.

The main model is the model of the chat session. Every other model in a run is an agent.

This file is Imaginer's filled copy of `custom_instructions/Workflows_and_reviews_global_version.md`. The global version stays the template; this copy is the one to follow.

## Imaginer's values

- Project: Imaginer.
- Planning file: the planning file of the task, `Tasks/<task_name>.md`. Every task that runs through workflows has its own. Small tasks done by hand follow `Tasks/Tasks.blueprint.md` instead.
- Hand-over file: `Status.md`, updated following `HandOver_Protocol.md`. It names the current step and its phase and points to the plan file; everything detailed stays in the planning file and the plan file.
- Plan file: `Tasks/plans/<step_name>.plan.md`, one file per step.
- Documentation: `README.md` and `User_Manual/`. `README.md`, section Documentation, maps it; `User_Manual/User_Manual_styleguide.md` sets its conventions.
- App code: the root `*.js` files, `index.html`, `main.css`, `cache_manifest.json`, `components/`, `storage/`, `png_iTXt/`, `png_XMP_via_iTXt/`, and `strip_metadata_from_PNG/`.
- Check: `bash tools/check/check.sh`, run from the repository root. It passes when it prints `check passed` and exits with code 0. It checks the module graph and the names with `tsc`, and the cache manifest with `tools/check/check_manifest.mjs`.
- Tests: Imaginer has no test suite. The phase Tests and the test-writer are dropped; the check is the gate, and Close decides on a manual test.
- The gate: `tools/check/` belongs to the main model. No agent edits it.
- The release: `version.json` and `version_messages/` change only in a release, which the main model does together with the user. No agent edits them.

## The standard sequence

One step runs through this sequence of phases. The step lives in the task's planning file, and `Status.md` names the current step.

1. Discussion — the main model and the user close every decision of the step in chat, one at a time. The main model then writes the decisions into the step in the planning file, in one piece, and removes the open items they close. From here on the step is the specification. A step is planned only when no open item blocks it.
2. Plan — one Opus planner writes the plan file `Tasks/plans/<step_name>.plan.md`.
3. Review — Sonnet reviewers check the plan against the code, one reviewer per area.
4. Judging — the main model reads the plan and the findings, judges each finding against the code, and amends the plan.
5. Implementation — Sonnet implementers, one per implementation step, in order.
6. Verification — the main model runs `bash tools/check/check.sh`, then reviews the result.
7. Documentation — the main model writes every statement the plan's section Documentation names, against the code as built. The documentation describes what works, so it is written once Verification has passed.
8. Close — the main model decides whether the step needs a manual test and, if it does, writes it. It records the step as built in the planning file and updates `Status.md`.

The main model does not read the plan between phases 2 and 3. What it has not seen, it cannot steer. Workflows enforce this: one runs phases 2 and 3, another runs phase 5, and each returns only what its script returns.

Delegating the work does not remove the main model's own checks. The sequence places them at phases 4 and 6.

The user approves the run before the first workflow starts.

## Roles

The gate is never an agent's. An agent that can change its own gate makes a failing step pass by weakening the gate.

### Main model

- Closes the decisions with the user and writes them into the step in the planning file.
- Gives the planner the planning file, the step name, and the facts it established against the code for this step.
- Writes every agent prompt, in plain, precise engineering English. The user reads the prompts and the transcripts.
- Judges the findings. A finding is an unverified claim, and false positives occur. Judging a finding means reading the code the finding points at. An empty review is a claim as well; check it against a search of your own.
- Amends the plan.
- In Verification: runs `bash tools/check/check.sh`; reviews the app code against the plan's design, its asserted behaviours, and the documentation; fixes small defects itself and runs the check again.
- In Documentation: writes every statement the plan's section Documentation names, following `User_Manual/User_Manual_styleguide.md`.
- In Close: decides on a manual test, records the step's state in the planning file, and updates `Status.md`.
- Owns the planning file, `Status.md`, `README.md`, `User_Manual/`, and `tools/check/`. No agent edits any of them.
- Does the release together with the user.
- Reasons from the code, the documentation, and the user.
- Renames only a symbol the user asked it to rename. A requested rename covers every reference and the documentation.

### Planner — Opus

- Reads the planning file, the documentation, and the code.
- Writes only the plan file.
- Returns only the plan path and the number of implementation steps.

### Reviewers — Sonnet

- One reviewer per area of the plan. A plan that spans several areas gets one reviewer per area, because each lens finds defects the others do not. Completeness and documentation is one of the areas.
- Read-only.
- Every finding carries its code evidence. An empty list is a valid result.
- Mandatory after every plan. Beyond that, an adversarial review is a deliberate choice, not a default step.

### Implementers — Sonnet

- One implementer per implementation step, run in order. Each reads the whole plan and implements its own implementation step only.
- Never edit `README.md`, `User_Manual/`, `tools/check/`, `version.json`, or `version_messages/`.
- Gate: `bash tools/check/check.sh` prints `check passed`.
- The workflow stops when a gate fails.

## The plan file

The plan of one step is the plan file `Tasks/plans/<step_name>.plan.md`. The planner prompt below fixes its sections: the title, Design, Implementation steps, Documentation, Asserted behaviours, Out of scope.

### Title

`# <step name>`, then one paragraph naming the step in the planning file as the specification.

### Design

The complete specification of the code change. An implementer who was not in the Discussion carries out every implementation step without asking a question.

It contains:

- One H3 per unit: a module, a function, a page, or a store.
- New and changed identifiers in backticks, spelled as the code spells them, with their signatures. Code blocks for signatures and short bodies.
- The behaviour per case, including every failure path.
- Every comment text the code receives, verbatim.
- Every file the step adds, removes, or renames, with its line in `cache_manifest.json`.
- An H3 "What does not change" for the adjacent code that stays as it is.

It does not contain:

- The order of work or documentation wording.
- Reasons the planning file already states. Design names the decision instead.
- Line numbers.

### Implementation steps

The order of work. One implementer carries out one implementation step.

It contains:

- A numbered list, because the order matters.
- Per implementation step: a title, each file it changes with what changes there by reference to Design, and the gate with the reason it holds.
- The gate: `bash tools/check/check.sh` prints `check passed`. For a markdown-only implementation step: the check is not run.

It does not contain:

- Design detail that Design does not hold.
- Documentation. The main model writes it after Verification.
- A removal ahead of the implementation step that rewrites its callers. Every implementation step ends with a tree for which the check passes.

### Documentation

Every file and section in `README.md` and `User_Manual/` whose statement the step changes. The main model writes the statements in the phase Documentation, against the code as built.

It contains:

- One list item per file, its path in backticks.
- Per file: the names of the sections it changes, as sub-items.

It does not contain:

- Statement text. A statement written before Verification describes a design, not what works, and is written twice when the code changes on the way.
- The planning file and `Status.md`. The main model updates both in Close.

### Asserted behaviours

The observable behaviours the step must show. They are the input for Verification and for the manual test at Close.

It contains:

- One H3 per unit.
- One observable behaviour per item, each with one deterministic expected result.
- The definition of every shorthand the items use, ahead of the first item.
- Behaviours a later step changes, named as not to be checked.

It does not contain:

- A vague result such as "works" or "is handled".

### Out of scope

The planning file's out-of-scope items and the other steps of the planning file, each with the boundary where it touches this step.

## Writing agent prompts

- Use the prompt blocks below verbatim, and fill the placeholders in angle brackets per step.
- Every house rule an agent must follow goes into its prompt with a correct and a wrong example. A rule without an example is ignored: implementers hard-wrapped their comments against a plain rule, and none did once the example was there.
- Every agent returns structured output through a schema, and the schema carries only what the main model needs next.
- Every agent and every workflow stage states its model and its effort explicitly. Never Fable.

## Agent claims are unverified

Verify every claim an agent makes against the code and the documentation before relaying it. A report can omit a file it changed and still read as complete, and workflow agents have produced fictional statements and missed details. The files a run changed on disk are the check against a report that leaves one out.

A word such as "untracked" in a report comes from the repository status the harness shows every agent at start, not from a git command. Whether an agent ran git shows in its transcript. Search the tool calls, not the whole transcript: the harness's own tool descriptions mention git in every transcript. Parse the transcript's lines as JSON and list the tool-use blocks: a text search over the raw file misses a command whose characters the JSON escapes.

## The workflows

### Plan and review

1. The planner: model `opus`, effort `high`, the planner schema.
2. The reviewers, in parallel: model `sonnet`, effort `high`, the findings schema, one prompt per area.
3. The script returns the plan path, the number of implementation steps, and the findings per area.

### Implementation

1. The implementers, in a loop over the implementation steps: model `sonnet`, effort `high`, the implementer schema. When `gate_passed` is false, the script stops and returns the reports so far.
2. The script returns every implementer report. The main model reads them only after the workflow has ended.

## Prompt blocks

The wording below comes from a workspace where it produced a run without drift, without git use, and without hard-wrapped comments. This copy fills its placeholders for Imaginer and takes its examples from Imaginer's code.

### Planner prompt

```markdown
# Task: plan the step "<step name>"

You are the planner for one step of Imaginer. You write exactly one file, the plan file `Tasks/plans/<step_name>.plan.md`. You change no app code and no documentation file.

## What to read

1. `README.md`, section Documentation, and `User_Manual/User_Manual_styleguide.md`.
2. `Tasks/<task_name>.md`: <the chapters that specify every step>, and the step "<step name>". Together they are the specification. Their decisions are closed; do not reopen them.
3. <the documentation files and sections the step touches>
4. The code: <the files the step touches>, and every further file the design touches.

## Access rules

- Write only `Tasks/plans/<step_name>.plan.md`.
<the no-git block>
- Do not run the check, a build, or any server.

## Facts established against the code

<one list item per fact the main model verified in the code for this step and the planning file does not state, naming the file and the symbol>

## Scope

In scope: the step "<step name>", including the list of documentation statements it changes.

Out of scope: the other steps of the planning file. Do not plan them, and do not remove code they own.

<one list item per other step, with the boundary where it touches this step>

## The plan file

Write the plan to `Tasks/plans/<step_name>.plan.md` with these sections:

1. `# <step name>`, then one paragraph naming the step in `Tasks/<task_name>.md` as the specification.
2. `## Design`: <the design questions the plan answers>. Name every file the step adds, removes, or renames, with its line in `cache_manifest.json`.
3. `## Implementation steps`: a numbered list, because the order matters. Each step names the files it changes and what changes in each. Every step ends with a tree for which `bash tools/check/check.sh` prints `check passed`. When a removal would break the check until a later step rewrites its callers, the removal belongs to that later step. A step that adds, removes, or renames a file the app loads changes `cache_manifest.json` in the same step. Implementation steps never touch `README.md`, `User_Manual/`, `tools/check/`, `version.json`, or `version_messages/`; the main model writes the documentation after Verification.
4. `## Documentation`: each file in `README.md` and `User_Manual/` and each section in it whose statement the step changes, as paths and section names only, without statement text. The main model writes the statements after Verification. `Tasks/<task_name>.md` and `Status.md` are not part of this section; the main model updates both at the close.
5. `## Asserted behaviours`: the observable behaviours the step must show. One behaviour per list item, each with one deterministic expected result. The main model checks them in Verification and turns them into the manual test at the close.
6. `## Out of scope`: the items listed above.

Write the plan so that an implementer who has not seen this discussion can carry out each step without asking a question.

## Writing rules for the plan

- Plain, precise engineering English. Short sentences. No metaphors.
- Use every term the specification defines, exactly as it defines it. A defined term is a name, not a metaphor.
- Refer to code by its identifier, in backticks, spelled exactly as the code spells it. Never paraphrase an identifier into an English word.
- No line numbers anywhere. Refer to functions, sections, and symbols by name.
- Never hard-wrap prose. A paragraph is one line in the file; a line break separates points, never a sentence.
  - Correct: "The gallery saves the record first. It then adds the thumbnail." written on one line.
  - Wrong: the same two sentences broken across lines after a fixed column width.
- Headings for structure, unordered lists for items, numbered lists only where the order matters. No bold lead-in standing in for a heading.

## What to return

Return only the plan path and the number of implementation steps.
```

### Reviewer prompt

```markdown
# Task: adversarial review of a plan against the code

A planner wrote `Tasks/plans/<step_name>.plan.md` for the step "<step name>" in `Tasks/<task_name>.md`. The step, together with the planning file's decisions, facts, and out-of-scope items, is the specification. Your job is to find defects in the plan: statements about the code that are false, designs that break under the code's actual behaviour, missing cases, and implementation steps that leave the tree failing `bash tools/check/check.sh`.

You review one area. <number> other reviewers cover the other areas.

Read the planning file, then the plan, then the code in your area. A finding counts only when you have read the code that shows it; name the file and the symbol. A finding may state that a decision in the planning file conflicts with the code; say so explicitly in the defect. When the plan is correct in your area, return an empty list; an empty list is a valid result.

Out of scope for findings: <the planning file's out-of-scope items>; the other steps of the planning file.

The plan's section Documentation lists paths and section names without statement text; the main model writes the statements after Verification. That is not a defect.

## Access rules

- You change no file. You only read.
<the no-git block>
- Do not run the check, a build, or any server.

## Your area: <area name>

<the files of the area>. Check at least:

- <one item per property the reviewer checks>

Return the findings.
```

The area "completeness and documentation", filled in:

```markdown
## Your area: completeness and documentation

Check at least:

- Every reference in the app code to a symbol the plan removes or replaces (<the symbols>, and any other the plan names) is handled by a step.
- Every implementation step ends with a tree for which `bash tools/check/check.sh` prints `check passed`, judged by reading the code each step changes and every caller of it.
- Every file the plan adds, removes, or renames has its line in `cache_manifest.json` changed in the same implementation step.
- Code comments in the app code that describe the replaced behaviour, for example in <files>.
- Every statement in `README.md` and `User_Manual/` that describes the replaced behaviour appears in the plan's section Documentation, as a path and a section name. Search all of it, including `User_Manual/Imaginer_User_Manual.md`, `User_Manual/Imaginer_FAQ.md`, and `User_Manual/Imaginer_Technical_Manual.md`.
- The plan stays inside its step and does not implement another step.
- The asserted behaviours cover every behaviour the step specifies, each with one deterministic expected result.
```

### Implementer prompt

```markdown
# Task: implement step <n> of the plan "<step name>"

The plan is `Tasks/plans/<step_name>.plan.md`. Read the whole plan first; its section "Design" specifies the code, and its section "Implementation steps" lists the steps. You implement step <n>, "<step title>", and nothing else. Other implementers did the earlier steps and do the later ones; their work is already in the files or comes after you.

Change exactly what step <n> names. Do not implement another step, do not improve code the step does not name, and do not reformat untouched code. When the plan and the code disagree, follow the plan where it is unambiguous and report the disagreement; when the plan is ambiguous, choose the reading that matches the section "Design" and report it.

## Access rules

- Never edit `README.md`, `User_Manual/`, `tools/check/`, `version.json`, or `version_messages/`.
<the no-git block>
- Do not start a server or a browser.
<the out-of-memory block>

<the naming block>

<the comments block>

<one of the gate blocks>

## What to return

The step number, every file you changed or created, whether the gate passed, the relevant output of `bash tools/check/check.sh` (or "not run" for a markdown-only step), and every deviation from the plan with its reason.
```

### Shared blocks

The no-git block:

```markdown
- Never run `git` or `gh` in any form.
  - Wrong: `git status`, `git diff`, `git log`, `git show`.
  - Correct: read the files themselves to confirm what they contain and which files you changed.
```

The out-of-memory block:

```markdown
- If a command reports that its process ran out of memory, that is the machine, not the code. Stop, do not retry, and report it.
```

The naming block:

```markdown
## Naming

- `loose_snake_case` for variables, properties, functions, parameters, and file names. Example: `image_blob`, `read_image_prompt`, `filename_helper.js`.
- `Loose_snake_head_case` for classes, and for a new file that contains a class. Example: `Database_store`, `Error_modal`, `PNG_encoder.js`.
- Standard abbreviations keep their case: `DB`, `SQL`, `JSON`, `UI`, `API`, `PNG`, `XMP`. Example: `strip_metadata_from_PNG`. Otherwise full English words: `image`, never `img`.
- No name starts or ends with an underscore.
- An existing name stays as it is. Do not rename any symbol the step does not name.
```

The comments block:

```markdown
## Comments

- Write a comment only when it explains why or how, never what. A longer, precise name is preferred over a comment.
- When a function needs a comment, use a JSDoc block above it, not an inline comment.
- Use every comment text the plan gives, verbatim.
- No history. A comment never mentions a previous implementation, an earlier behaviour, or a change.
  - Wrong: `// The download no longer writes the prompt twice.`
  - Wrong: `// Records saved before intake existed carry no UUID.`
  - Correct: `// The config dialog writes the same key, so saving there has to reach this dropdown.`
- No comment that restates a name.
  - Wrong: `/** Builds the image filename. */` above `build_image_filename`.
- No dates, version numbers, values, or project names in a comment, unless the comment cannot be understood without them.
- Never hard-wrap a comment. A sentence never spans two comment lines.
  - Correct: a comment of two sentences on one `//` line, however long it gets.
  - Wrong: the same sentence split over two `//` lines at a column width.
```

The gate block for a code step:

```markdown
## Gate

Run `bash tools/check/check.sh` from the repository root when the step is done. It must print `check passed`. Fix every error your step causes in the app code. Never edit `tools/check/` to make it pass.
```

The gate block for a markdown-only step:

```markdown
## Gate

This step changes only markdown. Do not run `bash tools/check/check.sh`.
```

### Schemas

The planner:

```json
{
  "type": "object",
  "properties": {
    "plan_path": { "type": "string" },
    "implementation_step_count": { "type": "number" }
  },
  "required": ["plan_path", "implementation_step_count"]
}
```

The reviewers:

```json
{
  "type": "object",
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "severity": { "type": "string", "enum": ["blocking", "significant", "minor"] },
          "plan_location": { "type": "string", "description": "The plan section and step the finding concerns." },
          "defect": { "type": "string", "description": "What is wrong or missing in the plan." },
          "code_evidence": { "type": "string", "description": "The files and symbols you read that show the defect, and what they do." },
          "consequence": { "type": "string", "description": "What goes wrong if the plan is implemented as written." },
          "proposed_change": { "type": "string", "description": "The change to the plan that removes the defect." }
        },
        "required": ["title", "severity", "plan_location", "defect", "code_evidence", "consequence", "proposed_change"]
      }
    }
  },
  "required": ["findings"]
}
```

The implementers:

```json
{
  "type": "object",
  "properties": {
    "step_number": { "type": "number" },
    "files_changed_or_created": { "type": "array", "items": { "type": "string" } },
    "gate_passed": { "type": "boolean" },
    "check_output": { "type": "string" },
    "deviations_from_plan": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["step_number", "files_changed_or_created", "gate_passed", "check_output", "deviations_from_plan"]
}
```
