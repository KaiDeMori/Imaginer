# Imaginer User Manual Style Guide

*Standards and conventions for writing consistent, clear documentation*

---

## Writing Style & Standards

### Tone & Voice
- **Clear and direct**: Use simple, everyday language.
- **Friendly but professional**: Approachable without being casual.
- **Action-oriented**: Focus on what users can do, not technical implementation.
- **Timeless**: Avoid version numbers, dates, or temporary references in main content.

### Formatting Conventions
- **UI elements** in bold: "Click the **Config** button".
- **User actions** as steps: numbered lists for procedures.
- **File names and technical terms** in code format: `image.png`, `localStorage`.
- **Important notes** in callout boxes.

### Punctuation Rules
- **Full stops after sentences**: Every complete sentence must end with a period (`.`).
- **Omit full stops only for**:
  - Headings and subheadings.
  - Non-sentence fragments (e.g., standalone labels).
  - Lists where items are not complete sentences.
- Apply this rule consistently throughout all documentation.

### Writing Rules
- Use second person ("you") for user instructions.
- Keep paragraphs short (2-4 sentences).
- Use active voice.
- Avoid technical jargon unless necessary.
- When technical terms are needed, explain them simply.

### Section Numbering Rule

**Do not use section numbers or letter prefixes** in any documentation (manual, TBD file, etc.) unless order is absolutely critical (e.g., sequential steps that must be followed in a specific order). Keep sections clean and unnumbered for easier maintenance and reorganization.

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

## Target Audience

**This manual serves both children and adults.** The app is designed to be accessible for kids, but documentation should be clear and helpful for all ages.

### Writing Balance
- Use simple, clear language that anyone can understand.
- Avoid condescending or overly childish tone.
- Explain technical concepts in plain terms without being patronizing.
- Focus on being helpful and approachable, not age-specific.

---

## Documentation Structure

Imaginer documentation is split into three companion files:

### User Manual (`Imaginer_User_Manual.md`)
**Audience**: End users (children and adults)  
**Purpose**: Clear, practical instructions for using the app

**Content guidelines**:
- Focus on "what" and "how" from the user's perspective
- Simple language accessible to all ages
- Minimal technical jargon
- Step-by-step instructions and workflows
- Practical tips and feature descriptions

### Technical Manual (`Imaginer_Technical_Manual.md`)
**Audience**: Help chat AI, developers, and power users  
**Purpose**: Technical reference and implementation details

**Content guidelines**:
- Architecture and data storage mechanisms
- API endpoints and integration details
- File formats and technical specifications
- Implementation-specific behavior
- Keyboard shortcuts and debug features
- Version history and technical appendices

### FAQ (`Imaginer_FAQ.md`)
**Audience**: Users troubleshooting problems and seeking quick answers  
**Purpose**: Problem-solving reference and common questions

**Content guidelines**:
- Common issues and their solutions
- Error scenarios and recovery steps
- Quick-answer format for frequent questions
- Links to relevant sections in User Manual when more detail is needed
- Practical workarounds and tips

### Content Placement Decision

**Put in User Manual when**:
- Users need it to accomplish their goals
- It's a visible feature or setting
- It affects user workflow or decisions

**Put in Technical Manual when**:
- It explains how things work under the hood
- It's implementation-specific (IndexedDB, localStorage, API details)
- It's for troubleshooting or advanced understanding
- It's reference material (keyboard shortcuts, version history)

**Put in FAQ when**:
- It's a common problem with a quick solution
- Users are asking "why doesn't this work?"
- It's a frequently asked question
- It needs troubleshooting steps

---

## AI Help Chat Consideration

All three documentation files serve as the knowledge base for the integrated help chat AI:
- **User Manual** provides user-friendly explanations the AI can relay directly
- **Technical Manual** gives the AI deeper context for advanced questions
- **FAQ** offers quick solutions for common problems and questions

Write all documentation with AI assistance in mind:
- Use consistent terminology across all files
- Structure content logically for question-answering
- Keep cross-references clear and maintainable

---

## Avoiding Content Duplication

When a topic (like a configuration setting) is relevant in multiple places:

- **Document it fully once** in its primary location (usually the most technical or comprehensive section).
- **Reference it briefly** in other sections where it's relevant, with a pointer to the full documentation.
- Include just enough context so readers understand what it does in that specific situation.
- **Do NOT use section number references** (e.g., "see Section III.2") - these are difficult to maintain as the manual evolves.

## Navigation Path Format

When referencing UI navigation paths, menu items, or configuration settings, use the hierarchical arrow format with the bold element at the END of the path. This creates a consistent, scannable format throughout the manual.

**Format**: `Parent → Child → **Final Element**`

**When to use this format:**
- Referencing UI navigation sequences (e.g., opening dialogs, tabs, sections).
- Pointing to specific settings or controls.
- Cross-referencing documentation sections.
- Any hierarchical navigation path in the app.

**Examples**:
```
Use Config → Advanced → **Refresh Models** to update the list.
Adjust Config → Basic → **Number of Images (n)** to generate multiple variations.
See Data Management → **Delete Mode** for full details.
```

**Guidelines:**
- Use the right arrow symbol `→` (not `>`, `/`, or `-`).
- Bold only the final element in the path.
- Use actual UI labels as they appear in the app.
- Keep parent elements unbolded for visual hierarchy.
- Use this format consistently throughout all documentation.

This keeps the reading flow natural while maintaining a single source of truth for technical details.

---

## Documentation Focus

**⚠️ CRITICAL**: This style guide is exclusively for documenting existing features. The goal is to get it right and not forget anything. Do NOT invent new features or interactive elements while writing documentation.

### Verification Before Writing

**Before writing any documentation, the assistant MUST:**
- Read relevant source files to verify features exist as described.
- Check configuration keys and default values in the actual code.
- Verify UI elements, button labels, and behavior.
- Confirm technical details (storage mechanisms, API endpoints, etc.).
- Note any discrepancies between the topic outline and actual implementation.

**Never assume** a feature works as outlined - always verify in the codebase first. This step-by-step approach ensures accuracy.

---

## Related Documentation Files

- **`Imaginer_User_Manual.md`** - User-facing manual with practical instructions and feature documentation
- **`Imaginer_FAQ.md`** - Troubleshooting guide and frequently asked questions
- **`Imaginer_Technical_Manual.md`** - Technical reference with architecture details and implementation specifics
- **`User_Manual_roadmap.md`** - Content structure, priorities, workflow, and strategic planning
- **`User_Manual_styleguide.md`** - This file: Writing guidelines and style standards
