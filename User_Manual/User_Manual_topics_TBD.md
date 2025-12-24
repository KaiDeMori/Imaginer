# Imaginer User Manual - Topics To Be Documented

*This file tracks remaining documentation work. As topics are completed and added to the main manual, they are removed from here.*

---

## Documentation Workflow

### How to Work on Documentation

1. **Start a conversation** by attaching the TBD file and specifying which topic(s) you want to work on
2. **Check what's already documented**: Read the relevant sections of `Imaginer_User_Manual.md` to avoid duplicating content
3. **Create a todo list** using `manage_todo_list` with specific, granular tasks for the topic
   - Each todo should represent checking/documenting ONE specific feature or aspect
   - Example todos: "Verify orientation button locations", "Document Generate button behavior", "Check image storage mechanism"
   - Add the final task "Rework section according to styleguide" that instructs to fully read the `User_Manual_styleguide.md` (again) and then rework the current section using the fresh knowledge from the styleguide.
4. **Work through todos one at a time:**
   - Mark todo as in-progress
   - Read source code to verify the feature
   - Document what actually exists (never invent features)
   - Mark todo as completed
   - Move to next todo
5. **After all todos are complete:**
   - Add the compiled content to `Imaginer_User_Manual.md`
   - Remove the completed topic from the TBD file

**Important**: Use `manage_todo_list` to break topics into small, verifiable chunks. This prevents overwhelming analysis and ensures each feature is properly verified before documenting.

### Configuration Settings Documentation Strategy

**Avoiding duplication while maintaining readability:**

1. **In feature sections** (Core Features, Advanced Features):
   - Brief practical mention of the setting in context
   - Focus on "what" and "why" for the user's immediate task
   - Reference Configuration & Settings section for full details (see **Navigation Path Format** in style guide)

2. **In Configuration section**:
   - Complete technical documentation of each setting
   - All available values/options
   - Default values and behavior
   - Impact on cost, performance, quality, etc.
   - This is the single source of truth for technical details

3. **Benefits**:
   - Users reading feature sections get practical, contextual guidance
   - Users in Config section get comprehensive reference
   - Changes only need to be made in one place (Config section)
   - No content duplication

---

## Pending Topics

All user manual topics are now documented. Add new items here when future features need coverage.
