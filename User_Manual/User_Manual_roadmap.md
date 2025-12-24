# Imaginer User Manual Roadmap

*Planning document for the comprehensive user manual*

## Purpose
This document serves as the master plan for creating the Imaginer User Manual. It contains the feature inventory, content structure, priorities, and topics to cover.

**⚠️ DOCUMENTATION FOCUS**: This roadmap is exclusively for documenting existing features. The goal is to get it right and not forget anything. Do NOT invent new features or interactive elements while writing documentation.

**Writing Style**: See `User_Manual_styleguide.md` for detailed writing guidelines and standards.

---

## Documentation Workflow

### How to Work on Documentation

When documenting topics from `User_Manual_topics_TBD.md`:

1. **Start a conversation** by attaching the TBD file and specifying which topic(s) you want to work on
2. **Check what's already documented**: Read the relevant sections of `Imaginer_User_Manual.md` to avoid duplicating content
3. **Create a todo list** using `manage_todo_list` with specific, granular tasks for the topic
   - Each todo should represent checking/documenting ONE specific feature or aspect
   - Example todos: "Verify orientation button locations", "Document Generate button behavior", "Check image storage mechanism"
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
   - Link to Config section for full details
   - Example: "To generate multiple images at once, increase 'Number of Images (n)' in Config → Basic"

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

## Content Structure & Organization

The detailed topic structure has been moved to `User_Manual_topics_TBD.md` for tracking documentation progress.

### Main Sections Overview

1. **Getting Started** - Help new users set up and understand the basics
2. **Core Features** - Main functionality users will use regularly
3. **Configuration & Settings** - All configuration options
4. **Advanced Features** - Power-user features and special capabilities
5. **Understanding Image Generation** - How the system works
6. **Troubleshooting & FAQ** - Common issues and questions
7. **Technical Information** - Deeper understanding for interested users
8. **Appendices** - Glossary, keyboard reference, defaults, version history

---

## Topics Priority

### Phase 1 (Essential)
- What is Imaginer?
- First-Time Setup
- Understanding the Interface
- Basic Image Generation
- Gallery basics
- Viewing images
- Configuration (API key, basic settings)

### Phase 2 (Important)
- Advanced generation options
- Image editing with drag-and-drop
- Gallery management (delete, download)
- All configuration options
- Troubleshooting basics

### Phase 3 (Advanced)
- Mask mode and inpainting
- Conversation mode
- PNG metadata details
- Technical information
- Complete FAQ

---

## Notes from Codebase Analysis

### Features Discovered
- ✅ OOBE/Intro sequence (cinematic starfield)
- ✅ Remote control for intro (intro_remote_control.js)
- ✅ Version manager with update messages
- ✅ Resizable divider with saved state
- ✅ Gallery drag-and-drop for import
- ✅ Viewer with zoom/pan/mask mode
- ✅ Brush cursor with absolute size
- ✅ Drop area manager for input images
- ✅ Error modal system
- ✅ Config dialog (tabbed: Basic/Advanced)
- ✅ Model fetcher with auto-refresh
- ✅ PNG metadata reader/writer (iTXt, XMP)
- ✅ Image converter (auto-convert to PNG)
- ✅ Download all as ZIP
- ✅ Delete mode toggle
- ✅ Conversation mode (experimental)
- ✅ Performance limit warning
- ✅ Generation cooldown mechanism

### Component Structure
- Menu bar with orientation selector, model dropdown, config/about buttons
- Gallery with placeholder support
- Generation panel with drop area
- Conversation panel (separate mode)
- Viewer with mask manager, zoom/pan manager, debug manager
- Various dialogs (config, about, error, download progress)

### Configuration Keys Found
- `imaginer.prompt` - Current prompt text
- `imaginer.max_parallel_generations` - Concurrency limit
- `imaginer.n` - Number of images per generation
- `imaginer.background` - Background setting
- `imaginer.quality` - Quality setting
- `imaginer.image_size` - Size setting
- `imaginer.strip_metadata` - Strip metadata flag
- `imaginer.add_prompt_to_image` - iTXt embedding
- `imaginer.add_prompt_to_image_xmp` - XMP embedding
- `imaginer.show_mask_mode_button` - Show mask mode button
- `imaginer.dividerWidth` - Gallery width
- `imaginer.mode` - Generation vs Conversation mode

---

## Interactive Help System Integration

### Overview
An integrated, AI-driven help system based on chat conversation, providing context-aware, multilingual assistance.

### Core Concept
- **Manual-based**: Comprehensive manual (this document's output) provided as context to AI
- **Context-aware**: Real-time app state provided to help AI give relevant answers
- **Multilingual**: AI responds in the language the user asks in (pre-prompted behavior)
- **ResponsesAPI**: Use OpenAI ResponsesAPI for server-side persistence and features

### UI Integration - Ideas Under Consideration
- **Full-screen overlay** (current preference)
  - Completely covers app
  - Clean, focused help experience
  - Easy dismiss to return to app
  
- **Alternative ideas** (for future consideration)
  - Sidebar panel (sliding from right)
  - Modal with transparency
  - Bottom sheet (mobile-friendly)

**Decision**: UI design to be finalized during implementation phase

### Context Information to Provide

The help system will receive the following context about the current app state:

#### Configuration (localStorage)
- `imaginer.prompt` - Current prompt text
- `imaginer.max_parallel_generations` - Concurrency limit
- `imaginer.n` - Number of images per generation
- `imaginer.background` - Background setting (auto/transparent/opaque)
- `imaginer.quality` - Quality setting (auto/high)
- `imaginer.image_size` - Size/orientation setting
- `imaginer.strip_metadata` - Strip metadata flag
- `imaginer.add_prompt_to_image` - iTXt embedding enabled
- `imaginer.add_prompt_to_image_xmp` - XMP embedding enabled
- `imaginer.show_mask_mode_button` - Mask mode button visibility
- `imaginer.dividerWidth` - Gallery panel width
- `imaginer.mode` - Current mode (generation/conversation)
- `imaginer.api_key` - Whether API key is configured (boolean only, not actual key)

#### Gallery State
- Total number of images in gallery
- Total storage/memory used by gallery (in MB)
- Whether gallery is empty

#### Current App State
- Active mode (Generation vs Conversation)
- Selected model
- Whether intro/OOBE was completed
- Viewer state (open/closed, mask mode active/inactive)
- Number of pending/active generations
- Last error message (if any occurred recently)

#### Browser/Environment
- Browser type and version
- Screen resolution
- Device pixel ratio (DPI)
- Available storage quota
- Used storage

### Predefined Questions

Questions organized by category, presented as quick-start buttons:

#### Quick Start
- How do I generate my first image?
- How do I set up my API key?

#### Working with Images
- How can I edit an image?
- How can I import an image? (and what does "import" mean?)
- How can I save/download images?
- How can I use mask mode for inpainting?

#### Managing Gallery
- How can I delete images?
- How can I clear the whole gallery?
- How can I backup/export all my images?

#### Troubleshooting
- Why isn't my API key working?
- Why did my generation fail?
- Where are my images stored?

### Technical Implementation

#### Model Selection
- Hardcoded model selection (not user-configurable)
- Model to be determined through testing (balance cost vs quality)
- Separate from main image generation model

#### API Integration
- Use OpenAI ResponsesAPI
- Provides server-side persistence
- Enables multi-turn conversation support
- Serves as initial implementation of ResponsesAPI before full Conversation mode

#### Conversation Persistence
- Store current help conversation in localStorage or session
- "New Question" button to clear and start fresh
- Allow closing and reopening to continue same conversation
- No conversation history (single active conversation only)

#### System Prompt Template
```
You are a helpful assistant for Imaginer, an AI image generation app.
Base your answers on the provided manual.
Always respond in the same language the user asked in.
Be concise but friendly.
When referring to UI elements, use bold formatting.
If the user's question isn't covered in the manual, admit it rather than guessing.
```

### Implementation Phases

#### Phase 1: Basic Implementation
- Question mark button in menu bar
- Full-screen overlay (or chosen UI pattern)
- System prompt + manual in context
- Basic context (localStorage config only)
- Free text input (no predefined questions yet)
- ResponsesAPI integration
- Simple conversation persistence

#### Phase 2: Enhanced Features
- Predefined question buttons (categorized)
- Full context implementation (gallery stats, app state, browser info)
- Multi-turn conversation refinement
- Improved UI polish and animations
- Better error handling

---