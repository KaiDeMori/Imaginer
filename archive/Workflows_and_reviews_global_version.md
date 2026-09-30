
origin: Otis
first test: Imaginer

# Workflows and reviews — global version

Read this when you are about to use a workflow, work with spawned agents, or run an adversarial review. Spawning any agent needs the user's permission first.

The main model is the model of the chat session. Every other model in a run is an agent.

This file is the workspace-independent form of one workspace's workflow file. A workspace fills the placeholders once and keeps its filled copy as its own workflow file.

## Placeholders

A workspace fills these once:

- `<project_name>` — the name of the project the agents work on.
- `<planning_file_path>` — the file that specifies the current step: its decisions, its facts, its open items, and what is out of scope.
- `<hand_over_file_path>` — the file that names the current step for the next session.
- `<plan_path>` — the plan file of one step, one file per step.
- `<documentation_folder>` and `<documentation_index>` — the documentation and the file that maps it.
- `<source_folder>` — the source code.
- `<tests_folder>` — the tests.
- `<check_command>` — the command that proves the source is consistent: a type check, a compiler run, or a linter.
- `<targeted_test_command>` — the test run for named test files.
- `<full_test_command>` — the full test suite.
- The forbidden-files block, the naming block, and the comments block — the workspace's own rules, each with a correct and a wrong example.
- The examples inside the prompt blocks — replaced once with concrete examples from the workspace's own code, and kept from then on. A concrete example holds an agent better than a placeholder does.

A workspace without a check command gates on the nearest check it has, such as a syntax check, and names that check in every gate block. A workspace without tests drops the phase Tests and the test-writer.

## The standard sequence

One step runs through this sequence of phases. The step lives in `<planning_file_path>`, and `<hand_over_file_path>` names the current step.

1. Discussion — the main model and the user close every decision of the step in chat, one at a time. The main model then writes the decisions into the step in `<planning_file_path>`, in one piece, and removes the open items they close. From here on the step is the specification. A step is planned only when no open item blocks it.
2. Plan — one Opus planner writes the plan file `<plan_path>`.
3. Review — Sonnet reviewers check the plan against the code, one reviewer per area.
4. Judging — the main model reads the plan and the findings, judges each finding against the code, and amends the plan.
5. Implementation — Sonnet implementers, one per implementation step, in order.
6. Tests — one Sonnet test-writer.
7. Verification — the main model runs `<full_test_command>`, then `<check_command>`, then reviews the result.
8. Documentation — the main model writes every statement the plan's section Documentation names, against the code as built. The documentation describes what works, so it is written once the tests pass.
9. Close — the main model decides whether the step needs a manual test and, if it does, writes it. It records the step as built in `<planning_file_path>` and updates `<hand_over_file_path>`.

The main model does not read the plan between phases 2 and 3, and does not look at the code between phases 5 and 6. What it has not seen, it cannot steer. Workflows enforce this: one runs phases 2 and 3, another runs phases 5 and 6, and each returns only what its script returns.

Delegating the work does not remove the main model's own checks. The sequence places them at phases 4 and 7.

The user approves the run before the first workflow starts. That approval covers the access to `<tests_folder>` and the full-suite run this sequence describes.

## Roles

Source and tests are never one agent. An agent that owns both makes an old assertion pass by bending the code.

### Main model

- Closes the decisions with the user and writes them into the step in `<planning_file_path>`.
- Gives the planner the planning file, the step name, and the facts it established against the code for this step.
- Writes every agent prompt, in plain, precise engineering English. The user reads the prompts and the transcripts.
- Judges the findings. A finding is an unverified claim, and false positives occur. Judging a finding means reading the code the finding points at. An empty review is a claim as well; check it against a search of your own.
- Amends the plan.
- In Verification: runs the full suite, then the check; reviews the source against the plan's design, the documentation, and the tests; fixes small defects itself; after its own test edits, runs the changed test files, then the check.
- In Documentation: writes every statement the plan's section Documentation names, following the conventions of `<documentation_index>`.
- In Close: decides on a manual test, records the step's state, and updates `<hand_over_file_path>`.
- Owns `<planning_file_path>`, `<hand_over_file_path>`, and `<documentation_folder>`. No agent edits any of them.
- Reasons from the code, the documentation, and the user, never from tests: tests are written after the code, and they are its output, never its specification.
- Renames only a symbol the user asked it to rename. A requested rename covers every reference, the tests, and the documentation.

### Planner — Opus

- Reads the planning file, the documentation, and the code. Never reads `<tests_folder>`: planning reasons from the code only.
- Writes only the plan file.
- Returns only the plan path and the number of implementation steps.

### Reviewers — Sonnet

- One reviewer per area of the plan. A plan that spans several areas gets one reviewer per area, because each lens finds defects the others do not. Completeness and documentation is one of the areas.
- Read-only. Never read `<tests_folder>`.
- Every finding carries its code evidence. An empty list is a valid result.
- Mandatory after every plan. Beyond that, an adversarial review is a deliberate choice, not a default step.

### Implementers — Sonnet

- One implementer per implementation step, run in order. Each reads the whole plan and implements its own implementation step only.
- Never read `<tests_folder>`. Never edit `<documentation_folder>`.
- Gate: `<check_command>` reports no errors. In an implementation step whose removal breaks test files, the gate is the check without errors in `<source_folder>`, and the errors in `<tests_folder>` are listed, not fixed.
- The workflow stops when a gate fails.

### Test-writer — Sonnet

- Full read and write access to `<tests_folder>`, and `<source_folder>` read-only. One boundary at a folder edge is easier to hold than a partial boundary inside the agent's own working folder, and the capacity it frees goes into the tests.
- Writes the tests from the plan's asserted behaviours and from the code. The existing tests are replaceable.
- A test that fails against the code, and a check error that can only be fixed in `<source_folder>`, are findings for the main model.
- Gate: the targeted test run, then the check, one after the other. A test runner that does not run the check lets a test file pass every case and still fail the check. The prompt writes the check step out: an agent told only that its gate is "tests plus typecheck" skipped the check and handed back type errors.
- A test in doubt is deleted and written from scratch; that is the default. The main model deletes the test and spawns one Sonnet agent through the Agent tool, model `sonnet`, under the test-writer prompt below. The Agent tool takes no effort setting; a one-agent workflow takes both model and effort.
- That agent takes the expected results from the intended behaviour: the plan's section Asserted behaviours and the planning file. The current code supplies the signatures and the setup. A test that restates what the code does passes by construction and asserts nothing.

## The plan file

The plan of one step is the plan file `<plan_path>`. The planner prompt below fixes its sections: the title, Design, Implementation steps, Documentation, Asserted behaviours, Out of scope.

### Title

`# <step name>`, then one paragraph naming the step in the planning file as the specification.

### Design

The complete specification of the code change. An implementer who was not in the Discussion carries out every implementation step without asking a question.

It contains:

- One H3 per unit: a module, a function, a page, or a store.
- New and changed identifiers in backticks, spelled as the code spells them, with their signatures. Code blocks for signatures and short bodies.
- The behaviour per case, including every failure path.
- Every comment text the code receives, verbatim.
- An H3 "What does not change" for the adjacent code that stays as it is.

It does not contain:

- The order of work, documentation wording, or tests.
- Reasons the planning file already states. Design names the decision instead.
- Anything learned from `<tests_folder>`. The planner reasons from the code only.
- Line numbers.

### Implementation steps

The order of work. One implementer carries out one implementation step.

It contains:

- A numbered list, because the order matters.
- Per implementation step: a title, each file it changes with what changes there by reference to Design, and the gate with the reason it holds.
- The gate: `<check_command>` reports no errors. For a removal that breaks test files: no errors in `<source_folder>`, and the broken test files listed. For a markdown-only implementation step: the check is not run.

It does not contain:

- Design detail that Design does not hold.
- Tests. The test-writer works after the last implementation step, from Asserted behaviours.
- Documentation. The main model writes it after Verification.
- A removal ahead of the implementation step that rewrites its callers. Every implementation step ends with a tree for which the check reports no errors.

### Documentation

Every file and section in `<documentation_folder>` whose statement the step changes. The main model writes the statements in the phase Documentation, against the code as built.

It contains:

- One list item per file, its path in backticks.
- Per file: the names of the sections it changes, as sub-items.

It does not contain:

- Statement text. A statement written before the tests pass describes a design, not what works, and is written twice when the code changes on the way.
- `<planning_file_path>` and `<hand_over_file_path>`. The main model updates both in Close.

### Asserted behaviours

The test-writer's input. The test-writer has not seen the Discussion.

It contains:

- One H3 per unit under test.
- One observable behaviour per item, each with one deterministic expected result.
- The definition of every shorthand the items use, ahead of the first item.
- Behaviours a later step changes, named as not to be asserted.

It does not contain:

- Test file names or test code. The test-writer owns `<tests_folder>`, and the planner never reads it.
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

### Implementation and tests

1. The implementers, in a loop over the implementation steps: model `sonnet`, effort `high`, the implementer schema. When `gate_passed` is false, the script stops and returns the reports so far.
2. The test-writer: model `sonnet`, effort `high`, the test-writer schema.
3. The script returns every implementer report and the test-writer report. The main model reads them only after the workflow has ended.

## Prompt blocks

The wording below comes from a workspace where it produced a run without drift, without git use, and without hard-wrapped comments.

### Planner prompt

```markdown
# Task: plan the step "<step name>"

You are the planner for one step of <project_name>. You write exactly one file, the plan file `<plan_path>`. You change no source file, no test file, and no other documentation file.

## What to read

1. `<documentation_index>`.
2. `<planning_file_path>`: <the chapters that specify every step>, and the step "<step name>". Together they are the specification. Their decisions are closed; do not reopen them.
3. <the documentation files and sections the step touches>
4. The code: <the files the step touches>, and every further file the design touches.

## Access rules

- Write only `<plan_path>`.
- Never open, list, or search `<tests_folder>`.
<the forbidden-files block>
<the no-git block>
- Do not run the test suite, a build, or any server.

## Facts established against the code

<one list item per fact the main model verified in the code for this step and the planning file does not state, naming the file and the symbol>

## Scope

In scope: the step "<step name>", including the list of documentation statements it changes.

Out of scope: the other steps of the planning file. Do not plan them, and do not remove code they own.

<one list item per other step, with the boundary where it touches this step>

## The plan file

Write the plan to `<plan_path>` with these sections:

1. `# <step name>`, then one paragraph naming the step in `<planning_file_path>` as the specification.
2. `## Design`: <the design questions the plan answers>.
3. `## Implementation steps`: a numbered list, because the order matters. Each step names the files it changes and what changes in each. Every step ends with a tree for which `<check_command>` reports no errors. When a removal would break the build until a later step rewrites its callers, the removal belongs to that later step. Implementation steps never touch `<tests_folder>` or `<documentation_folder>`; a separate test-writer works after the last step, and the main model writes the documentation after the tests pass.
4. `## Documentation`: each file under `<documentation_folder>` and each section in it whose statement the step changes, as paths and section names only, without statement text. The main model writes the statements after the tests pass. `<planning_file_path>` and `<hand_over_file_path>` are not part of this section; the main model updates both at the close.
5. `## Asserted behaviours`: the observable behaviours the test-writer turns into tests. One behaviour per list item, each with one deterministic expected result. The test-writer has not seen this discussion.
6. `## Out of scope`: the items listed above.

Write the plan so that an implementer who has not seen this discussion can carry out each step without asking a question.

## Writing rules for the plan

- Plain, precise engineering English. Short sentences. No metaphors.
- Refer to code by its identifier, in backticks, spelled exactly as the code spells it. Never paraphrase an identifier into an English word.
- No line numbers anywhere. Refer to functions, sections, and symbols by name.
- Never hard-wrap prose. A paragraph is one line in the file; a line break separates points, never a sentence.
  - Correct: "The service writes the record first. It then sends the notification." written on one line.
  - Wrong: the same two sentences broken across lines after a fixed column width.
- Headings for structure, unordered lists for items, numbered lists only where the order matters. No bold lead-in standing in for a heading.

## What to return

Return only the plan path and the number of implementation steps.
```

### Reviewer prompt

```markdown
# Task: adversarial review of a plan against the code

A planner wrote `<plan_path>` for the step "<step name>" in `<planning_file_path>`. The step, together with the planning file's decisions, facts, and out-of-scope items, is the specification. Your job is to find defects in the plan: statements about the code that are false, designs that break under the code's actual behaviour, missing cases, and implementation steps that leave the tree failing `<check_command>`.

You review one area. <number> other reviewers cover the other areas.

Read the planning file, then the plan, then the code in your area. A finding counts only when you have read the code that shows it; name the file and the symbol. A finding may state that a decision in the planning file conflicts with the code; say so explicitly in the defect. When the plan is correct in your area, return an empty list; an empty list is a valid result.

Out of scope for findings: <the planning file's out-of-scope items>; the other steps of the planning file.

The plan's section Documentation lists paths and section names without statement text; the main model writes the statements after the tests pass. That is not a defect.

## Access rules

- You change no file. You only read.
- Never open, list, or search `<tests_folder>`.
<the forbidden-files block>
<the no-git block>
- Do not run the test suite, the check, a build, or any server.

## Your area: <area name>

<the files of the area>. Check at least:

- <one item per property the reviewer checks>

Return the findings.
```

The area "completeness and documentation", filled in:

```markdown
## Your area: completeness and documentation

Check at least:

- Every reference in `<source_folder>` to a symbol the plan removes or replaces (<the symbols>, and any other the plan names) is handled by a step.
- Every implementation step ends with a tree for which `<check_command>` reports no errors, judged by reading the code each step changes and every caller of it.
- Code comments in `<source_folder>` that describe the replaced behaviour, for example in <files>.
- Every statement under `<documentation_folder>` that describes the replaced behaviour appears in the plan's section Documentation, as a path and a section name. Search the whole folder, including <documents written for readers outside the code, such as a manual>.
- The plan stays inside its step and does not implement another step.
- The asserted behaviours cover every behaviour the step specifies, each with one deterministic expected result.
```

### Implementer prompt

```markdown
# Task: implement step <n> of the plan "<step name>"

The plan is `<plan_path>`. Read the whole plan first; its section "Design" specifies the code, and its section "Implementation steps" lists the steps. You implement step <n>, "<step title>", and nothing else. Other implementers did the earlier steps and do the later ones; their work is already in the files or comes after you.

Change exactly what step <n> names. Do not implement another step, do not improve code the step does not name, and do not reformat untouched code. When the plan and the code disagree, follow the plan where it is unambiguous and report the disagreement; when the plan is ambiguous, choose the reading that matches the section "Design" and report it.

## Access rules

- Never open, list, or search `<tests_folder>`.
<the forbidden-files block>
<the no-git block>
- Do not run the tests, a build, or any server.
<the out-of-memory block>

<the naming block>

<the comments block>

<one of the gate blocks>

## What to return

The step number, every file you changed or created, whether the gate passed, the relevant `<check_command>` output (or "not run" for a markdown-only step), every expected error in a file under `<tests_folder>`, and every deviation from the plan with its reason.
```

### Test-writer prompt

```markdown
# Task: write the tests for the step "<step name>"

The step is implemented in `<source_folder>`. The plan is `<plan_path>`. Your input is its section "Asserted behaviours" and the code in `<source_folder>`. Turn each asserted behaviour into a test with one deterministic expected result.

## Access rules

- `<tests_folder>`: full read and write access. Create, change, and delete test files as the behaviours require. Treat the existing tests as replaceable.
- `<source_folder>`: read-only. Read any file; never edit, create, or delete one.
  - Correct: read `src/billing/invoice_store.ts` to learn the signature of `save_invoice`.
  - Wrong: add an `export` to a file in `src/` so a test can reach an internal function. Report that need as a finding instead.
- A test that fails against the code, and a check error that can only be fixed in `<source_folder>`, are findings for the main model. Never resolve either by changing `<source_folder>`, and never by weakening an assertion until it passes.
<the forbidden-files block>
<the no-git block>
- Do not start a server. Do not run the full test suite; run only the test files you created or changed.
<the out-of-memory block>

## Facts

<one list item per fact: the test files to create, and the module to mock to reach the code under test>
<one list item per fact about the test environment: the environment, the setup a test file needs, and the import path to the source>
- <the behaviours a later step changes, which the tests do not assert>

<the naming block>

<the comments block>

## Gate

Run these one after the other, never concurrently:

1. `<targeted_test_command>` with every test file you created or changed as arguments. Every test passes, or each failing test is a finding.
2. After the test run has finished: `<check_command>` from the repository root. It must report no errors anywhere, including `<tests_folder>`. Fix errors in test files yourself.

## What to return

The files you created, changed, and deleted; the test run's summary lines; whether the check is clean and its relevant output; for each asserted behaviour, the test file and test name that covers it; every asserted behaviour you did not cover, with the reason; and every finding.
```

### Shared blocks

The no-git block:

```markdown
- Never run `git` or `gh` in any form.
  - Wrong: `git status`, `git diff`, `git log`, `git show`.
  - Correct: read the files themselves to confirm what they contain and which files you changed.
```

The forbidden-files block, for a workspace that keeps files away from agents; a workspace without such files leaves it out:

```markdown
- Never read files named `<forbidden_pattern>`.
```

The out-of-memory block:

```markdown
- If a command reports that its process ran out of memory, or many tests crash at once with no assertion behind them, that is the machine, not the code. Stop, do not retry, and report it.
```

The naming block, as one workspace fills it:

```markdown
## Naming

- `loose_snake_case` for variables, properties, functions, and parameters. Example: `total_amount`, `save_invoice`.
- `Loose_snake_head_case` for classes, types, and interfaces. Example: `Invoice_record`.
- Standard abbreviations keep their case: `DB`, `SQL`, `JSON`, `UI`, `API`. Otherwise full English words: `context`, never `ctx`.
- No name starts or ends with an underscore.
- Do not rename any symbol the step does not name.
```

The comments block, as one workspace fills it:

```markdown
## Comments

- Write a comment only when it explains why or how, never what. A longer, precise name is preferred over a comment.
- Use every comment text the plan gives, verbatim.
- No history. A comment never mentions a previous implementation, an earlier behaviour, or a change.
  - Wrong: `// The export no longer runs at midnight.`
  - Wrong: `// A record written before this field existed carries no timestamp.`
  - Correct: `// Processed one at a time, not in parallel: two items in a batch may write the same record, and sequential processing keeps those writes from racing.`
- No comment that restates a name.
  - Wrong: `/** Saves the invoice. */` above `save_invoice`.
- Never hard-wrap a comment. A sentence never spans two comment lines.
  - Correct: a comment of two sentences on one `//` line, however long it gets.
  - Wrong: the same sentence split over two `//` lines at a column width.
```

The gate block for a code step:

```markdown
## Gate

Run `<check_command>` from the repository root when the step is done. It must report no errors. Fix every error your step causes in `<source_folder>`.
```

The gate block for a removal step that breaks test files:

```markdown
## Gate

Run `<check_command>` from the repository root when the step is done. It must report no errors in any file under `<source_folder>`. The check includes `<tests_folder>`, so errors in files under `<tests_folder>` that import a removed identifier are expected: list each of them in your report and do not fix them. A test-writer handles them after you.
```

The gate block for a markdown-only step:

```markdown
## Gate

This step changes only markdown. Do not run `<check_command>`.
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
    "expected_errors_in_tests": { "type": "array", "items": { "type": "string" } },
    "deviations_from_plan": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["step_number", "files_changed_or_created", "gate_passed", "check_output", "expected_errors_in_tests", "deviations_from_plan"]
}
```

The test-writer:

```json
{
  "type": "object",
  "properties": {
    "files_created": { "type": "array", "items": { "type": "string" } },
    "files_changed": { "type": "array", "items": { "type": "string" } },
    "files_deleted": { "type": "array", "items": { "type": "string" } },
    "test_run_summary": { "type": "string" },
    "check_clean": { "type": "boolean" },
    "check_output": { "type": "string" },
    "behaviours_covered": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "behaviour": { "type": "string" },
          "test_file": { "type": "string" },
          "test_name": { "type": "string" }
        },
        "required": ["behaviour", "test_file", "test_name"]
      }
    },
    "behaviours_not_covered": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "behaviour": { "type": "string" },
          "reason": { "type": "string" }
        },
        "required": ["behaviour", "reason"]
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "detail": { "type": "string" },
          "evidence": { "type": "string" }
        },
        "required": ["title", "detail", "evidence"]
      }
    }
  },
  "required": ["files_created", "files_changed", "files_deleted", "test_run_summary", "check_clean", "check_output", "behaviours_covered", "behaviours_not_covered", "findings"]
}
```
