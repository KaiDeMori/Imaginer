Create a new component named `[Component Name]` using the "Runtime Fetch" pattern.

**Requirements:**
1.  **Folder Structure**: Create a folder `components/[component_name]/` with `[component_name].js`, `.html`, and `.css`.
2.  **Class Structure**: Export a class `[Class_Name]` in the JS file.
3.  **Async Init**:
    *   The constructor should start an `async init()` method.
    *   Store the initialization promise (e.g., `this.ready_promise`) if external methods need to wait for it.
4.  **CSS Loading**: In `init()`, check if the CSS file is already linked in `document.head`. If not, dynamically create and append a `<link>` tag.
5.  **HTML Loading**: Fetch the `.html` file, get the text, and inject it.
    *   *If it's a modal:* Append to `document.body`.
    *   *If it's a UI widget:* Inject into a `root` element passed to the constructor.
6.  **Event Wiring**: Create a method (e.g., `wire_events()`) called at the end of `init()` to set up listeners.
7.  **No Build Tools**: Use standard ES modules and vanilla JS.

**Specific Functionality for this component:**
[Describe what the component should actually do here...]