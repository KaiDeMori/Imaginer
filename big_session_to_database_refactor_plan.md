# Big Session to Database Refactor Plan

This document outlines the plan to rename `Session_store` to `Database_store` (and the file `session_store.js` to `database_store.js`) to better reflect that it uses IndexedDB and is persistent, not session-based.

## 1. File Renaming

-   **Current**: `storage/session_store.js`
-   **New**: `storage/database_store.js`

## 2. Code Refactoring

### Class Definition
-   **File**: `storage/database_store.js` (after rename)
    -   Rename class `Session_store` to `Database_store`.
    -   Update static method calls inside the class (e.g., `Session_store.scramble_key_key` -> `Database_store.scramble_key_key`).
    -   Update comments referencing `session_store`.

### Imports and Usage
The following files need their imports and variable names updated:

-   **`app.js`**
    -   Import: `import { Session_store } from "./storage/session_store.js";` -> `import { Database_store } from "./storage/database_store.js";`
    -   Instantiation: `new Session_store()` -> `new Database_store()`
    -   Variable: `session_store` -> `database_store` (and `window.sessionStore` -> `window.databaseStore` if appropriate, or keep for compatibility if needed, but better to update).
    -   Dynamic import: `import("./storage/session_store.js")` -> `import("./storage/database_store.js")`

-   **`model_fetcher.js`**
    -   Import: `import { Session_store } from "./storage/session_store.js";`
    -   Usage: `Session_store.get_api_key()`

-   **`intro/00/pre_intro_ui.js`**
    -   Dynamic Import: `import("../../storage/session_store.js")`
    -   Destructuring: `{ Session_store }` -> `{ Database_store }`
    -   Usage: `Session_store.get_api_key()`, `Session_store.set_api_key()`

-   **`components/menu_bar/menu_bar.js`**
    -   Import: `import { Session_store } from "../../storage/session_store.js";`
    -   Usage: `Session_store.get_api_key()`

-   **`components/config_dialog/config_dialog.js`**
    -   Dynamic Import: `import("../../storage/session_store.js")`
    -   Destructuring: `{ Session_store }` -> `{ Database_store }`
    -   Usage: `Session_store.get_api_key()`, `Session_store.set_api_key()`

## 3. Documentation and Comments

The following files contain references to `Session_store` or `session_store.js` that should be updated to avoid confusion:

-   **`ResponsesAPI_Integration_planning.md`**
    -   Multiple references to `Session_store` and `session_store`.

-   **`feature_docs/png metadata.md`**
    -   Section 7: Integration Example with `Session_store`.

-   **`feature_docs/project_status.md`**
    -   "Session persistence: Integrated IndexedDB session_store..."

-   **`custom_instructions/loose_snake_case.instructions.md`**
    -   Example: `session_store.js`.

-   **`feature_docs/Imaginer_Project.md`**
    -   "9. Session_store – Thin wrapper..."
    -   Note about `loose_snake_case`.

-   **`components/viewer/viewer.js`**
    -   Comments referencing `session_store`.

## 4. Verification
-   Ensure the application still loads and images are retrieved from IndexedDB.
-   Ensure API key storage/retrieval still works.
-   Check that no `Session_store` references remain in the active codebase (excluding `archive/`).
