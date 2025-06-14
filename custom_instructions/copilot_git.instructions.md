---
applyTo: '**'
---

# Copilot Git Operations Standards

## Scope
These standards apply to all Git operations automated by GitHub Copilot within this workspace.

## Git Workflow Automation
- Use Copilot to automate standard Git operations via terminal commands.
- Supported actions include:
  - Staging changes (e.g., `git add .` or `git add <file>`)
  - Committing changes (e.g., `git commit -m "commit message"`)
  - Pushing to remote (e.g., `git push`)
  - Pulling from remote (e.g., `git pull`)
  - Displaying status or log (e.g., `git status`, `git log`)

## Shortcut: `gitit!`
- When the request contains `gitit!`, Copilot will:
  1. Automatically generate a commit message based on the recent conversation and the files that were changed.
  2. Stage only the files that were edited or developed in the current conversation (e.g., `git add <file1> <file2> ...`), not all files (`git add .`).
  3. Commit with the generated message (`git commit -m "<auto message>"`).
  4. Push to the remote (`git push`).

Do not issue a second `git push` if the first is still in progress or has completed successfully.

## Examples
  - `gitit!`
  - `commit the file example.md please.`
  - `what's the git status?`

**Summary:** Use Copilot to automate Git workflows as described above. Use the `gitit!` shortcut for a full **commit-and-push** workflow with an auto-generated message, but only for files changed in the current conversation.
