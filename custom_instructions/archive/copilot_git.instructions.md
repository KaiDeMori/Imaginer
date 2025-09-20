---
applyTo: '**'
---

# Copilot Git Operations Standards

## Scope
These standards apply to all Git operations automated by GitHub Copilot within this workspace.

## Command Concatenation for Copilot Git Automation

- For all Git workflow automation performed by Copilot as described in these instructions, always concatenate multiple shell or terminal commands into a single command line using `&&` (e.g., `git add . && git commit -m "msg" && git push`).
- Do not execute Git-related commands separately or in sequence unless explicitly instructed.
- This rule applies only to Copilot’s Git automation and does not affect other shell command usage outside these instructions.

## Commit Comment Generation Rules
- **Never mention file names** in commit messages. File names are already referenced in the Git workflow and do not need to be repeated in the commit message.
- **Read the actual file contents** that are being committed to generate meaningful commit messages. Do not guess or invent what was changed—summarize based on the real content.
- **Prefix commit messages** according to the type of change:
  - `doc`: For changes to documentation or markdown files.
  - `feature`: For new features or significant enhancements.
  - `bug`: For bugfixes or corrections.
  - `refactor`: For code refactoring or restructuring without changing external behavior.
  - `test`: For changes or additions to tests.
  - `chore`: For maintenance, build scripts, or non-functional changes.
  - `style`: For formatting, whitespace, or stylistic changes that do not affect code logic.
  - `perf`: For performance improvements.
  - `fun`: For fun or experimental changes that do not fit other categories.
  - `archive`: For file movements into an `archive` folder.
- **If multiple types apply**, use the most significant one or combine as needed (e.g., `feature, doc`).

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

## Shortcut: `geronimo!`
**Note:** `geronimo!` is a workflow shortcut for Copilot to automate a full commit-and-push process for all changes in the workspace.

When the request contains `geronimo!`, Copilot will:
  1. Automatically generate a commit message that summarizes all files and changes about to be committed (i.e., all staged changes in the workspace).
  2. Stage all changes in the workspace (`git add .`).
  3. Commit all staged changes with the generated message (`git commit -m "<auto message>"`).
  4. Push to the remote (`git push`).
 - **If no file changes are detected in the current conversation**, Copilot must first run a `git status` command to verify if there are any unstaged or uncommitted changes. Usually, there will be changes, so Copilot should explicitly verify this before reporting that there are no files to commit.

- Do not issue a second `git push` if the first is still in progress or has completed successfully.

## Examples
- `gitit!`
- `geronimo!`
- `commit the file example.md please.`
- `what's the git status?`

**Summary:** Use Copilot to automate Git workflows as described above. Use the `gitit!` shortcut for a full **commit-and-push** workflow with an auto-generated message, but only for files changed in the current conversation. If no changes are detected in the conversation, Copilot must explicitly run `git status` to verify before reporting no changes. Use the `geronimo!` shortcut to commit and push all changes in the workspace.