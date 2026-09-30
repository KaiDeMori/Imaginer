# Workflow lessons

Rules for agents and workflows, learned in earlier runs. Archived together with `Workflows_and_reviews.md` and its template.

- Spawning an agent or running a workflow needs the user's permission. The workflow is designed per task.
- Every agent names its model, and every workflow stage names its model and its effort. An agent is never Fable.
- An agent's report is an unverified claim. Reports have omitted files the agent changed and stated things that were not so. Verify every claim against the files on disk before relaying it.
- Every rule in an agent prompt carries a correct and a wrong example. A rule without an example is ignored.
- Agents never run `git` or `gh`. The word "untracked" in a report comes from the repository status the harness shows every agent at start, not from a git command.
- No agent edits the gate `tools/check/`, the documentation `README.md` and `User_Manual/`, or the release files `version.json` and `version_messages/`. An agent that can change its gate makes a failing step pass by weakening the gate.
- The gate is `bash tools/check/check.sh`, run from the repository root. It passes when it prints `check passed`. There is no test suite.
- Agents start no server and no browser. Browser tests are run by hand.
- The user reads every agent prompt and transcript. Write prompts in plain, precise engineering English.
