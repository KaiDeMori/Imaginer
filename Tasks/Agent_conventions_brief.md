# Imaginer conventions brief

Rules for every implementation agent working on the Imaginer project.
Read this file completely before touching any file.

## Ground rules

- Never run `git` or `gh`. The user handles version control.
- Never read files matching `*.realm.md` or `*.intent.md`.
- Never write outside the project directory `C:\Users\devboese\Documents\_dev\Imaginer`, except the session scratchpad `C:\Users\devboese\AppData\Local\Temp\claude\c--Users-devboese-Documents--dev-Imaginer\ac5baa0a-e8e3-4895-9227-56e791aeb12f\scratchpad`.
- Do not create temporary files inside the project.
- Modify only the files that your assigned tasks name. Do not touch other tasks.
- The specification is `Tasks/New_models_integration_Tasks.md`. Its "API facts" section is verified. Do not research the API again.
- Imaginer is a browser-only vanilla JavaScript application with ES modules. No build step, no bundler, no Node tooling, no npm packages, no new dependencies.
- Do not use `typeof` checks. The only exceptions are reflection and dynamic property access.
- Never hide UI elements or options automatically.
- Never change stored `localStorage` values on behalf of the user.
- Do not add cost estimates or token counts anywhere in the UI. Documentation mentions cost only where the tasks file explicitly allows one short general sentence.

## Naming

- Class names use Loose_snake_head_case, for example `Menu_bar`, `Config_dialog`.
- File names follow the existing project pattern: loose_snake_case, for example `menu_bar.js`, `model_fetcher.js`.
- Everything else uses loose_snake_case: variables, properties, functions, methods, CSS classes, IDs in new code, for example `clamp_quality_for_model`.
- Use full English words. Allowed abbreviations are standard ones such as `DB`, `SQL`, `JSON`, `UI`, `API`, `PNG`, `URL`. Keep their normal capitalization inside names, for example `connect_DB_endpoint`. Disallowed: `img`, `ctx`, `btn`, `cfg`, `err`, `res`.
- Built-in and library names are exempt, for example `onMouseDown`, `toString`.
- Never rename existing identifiers, even when they diverge from these rules.
- No leading or trailing underscores in new names.
- Naming is case-sensitive. Treat file names as case-sensitive.

## Comments

Do not write a comment unless it follows these rules.

- Keep comments timeless and general.
- Comments explain the why and the how, never the what.
- Prefer a longer, precise name over a comment.
- Use documentation comments (JSDoc) only when a function, class, method or module needs an explanation. Avoid inline comments.
- No actual values in comments unless they are necessary to understand the code.
- No dates and no version numbers in comments.
- No specific names (project, people) in comments unless necessary.
- No redundant comments that restate the name of the function or variable.
- No history keeping: never reference previous attempts, old behaviour, removed code or the fact that something is new or changed.
- No useless documentation comments that only repeat the method name.
- When you change code that carries a comment violating these rules, fix or remove that comment. Leave comments in untouched code alone.

## Line breaks

Line breaks separate distinct, self-contained points: a new sentence starting a new remark, a paragraph boundary, or a list item.
Never split a sentence or clause mid-thought because it reached a column width.
Break where the meaning breaks, not where the line length breaks.
This applies to comments, Markdown, HTML text and version cards.

## Writing style for documentation, UI texts and version cards

- Use correct technical terms. Never use a metaphor, simile or other figure of speech.
- Describe things precisely, with two or more words where one word is ambiguous.
- Stick to the established nomenclature of the project. Never use two different wordings for the same thing.
- Short sentences. Active voice. No flowery prose.
- Headings for structure. Markdown lists: unordered unless the order matters.
- Strict capitalization of identifiers and names. Names use `_` to separate words.
- No line numbers in any document. Refer to code by method name or by context.
- The user manual, FAQ and technical manual follow `User_Manual/User_Manual_styleguide.md`: navigation paths as `Parent → Child → **Final Element**`, UI labels in bold, full stops after sentences, no section numbers, timeless content without dates or version numbers.
- Avoid morbid or military wording such as "kill", "dead", "nuke", "time bomb". Use OpenAI's terms: deprecation, retirement, removal from the API.

## Code style

- Match the existing style of the file you edit: two-space indentation, double quotes, semicolons, trailing commas as present.
- Keep changes minimal and local. Do not refactor beyond the task. Do not improve unrelated code.
- Components load their HTML and CSS at runtime with `versioned_url`. Dynamic imports use `versioned_url`. Follow the existing pattern.
- Create a new file only when the task requires it and report every new file, because it must be listed in `cache_manifest.json`.

## Reporting

At the end of your work, report in this order and keep it short:

1. Files changed.
2. Functions, methods or sections added or changed, by name.
3. Every deviation from the task specification and the reason.
4. Anything that needs a follow-up.

Do not paste diffs unless a decision is needed.
