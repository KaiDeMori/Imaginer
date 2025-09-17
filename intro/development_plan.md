## Core Philosophy: Crash Hard and Fast

**NO DEFENSIVE CODE. NO ERROR HANDLING. NO CHECKING.**
- If something is missing, we crash immediately with a clear error
- If loading fails, we fail fast and loud
- If audio doesn't decode, the page breaks visibly
- No fallbacks, no graceful degradation, no "safety nets"
- Use objects directly without checking if they exist
- Let the browser's native error reporting handle failures

This approach makes debugging trivial and prevents silent failures that hide real problems.
