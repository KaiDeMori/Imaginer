# Imaginer User Manual - Topics To Be Documented

*This file tracks remaining documentation work. As topics are completed and added to the main manual, they are removed from here.*

## How This Works

This file serves as your working backlog for writing the Imaginer User Manual. Here's the workflow:

1. **Start a conversation** by attaching this file and specifying which topic(s) you want to work on
2. **Check what's already documented**: Read the relevant sections of `Imaginer_User_Manual.md` to avoid duplicating content
3. **Create a todo list** using `manage_todo_list` with specific, granular tasks for the topic
   - Each todo should represent checking/documenting ONE specific feature or aspect
   - Example todos: "Verify orientation button locations", "Document Generate button behavior", "Check image storage mechanism"
4. **Work through todos one at a time:**
   - Mark todo as in-progress
   - Research the codebase to verify that specific feature
   - Write the documentation for that feature
   - Mark todo as completed
   - Move to next todo
5. **After all todos are complete:**
   - Add the compiled content to `Imaginer_User_Manual.md`
   - Remove the completed topic from this TBD file

**Important**: Use `manage_todo_list` to break topics into small, verifiable chunks. This prevents overwhelming analysis and ensures each feature is properly verified before documenting.

### Critical Rule: Document Only What Exists

**⚠️ CRITICAL**: This document is exclusively for documenting existing features. The goal is to get it right and not forget anything. Do NOT invent new features or interactive elements while writing documentation.

**Before writing any documentation, the assistant MUST:**
- Read relevant source files to verify features exist as described
- Check configuration keys and default values in the actual code
- Verify UI elements, button labels, and behavior
- Confirm technical details (storage mechanisms, API endpoints, etc.)
- Note any discrepancies between the topic outline and actual implementation

**Never assume** a feature works as outlined - always verify in the codebase first.

### Formatting Rule: No Numbering

**Do not add section numbers or letter prefixes** to topics in this file unless order is absolutely critical (e.g., sequential steps that must be followed in a specific order). Keep topics clean and unnumbered for easier maintenance and reorganization.

### Related Files

- **`Imaginer_User_Manual.md`** - The actual user manual where completed documentation lives
- **`User_Manual_roadmap.md`** - Content structure, priorities, and strategic planning
- **`User_Manual_styleguide.md`** - Writing guidelines and style standards

### Configuration Settings Documentation Strategy

**Avoiding duplication while maintaining readability:**

1. **In feature sections** (Core Features, Advanced Features):
   - Brief practical mention of the setting in context
   - Simple explanation of what it does for this specific feature
   - Reference to Config section for full details (e.g., "You can adjust this in Config → Advanced")
   - **Do NOT use section numbers** - they're difficult to maintain as the manual evolves
   - Example: "To generate multiple images at once, increase 'Number of Images (n)' in Config → Basic"

2. **In Configuration section**:
   - Complete technical documentation of each setting
   - Default values, all options, implications
   - Cross-references back to where the setting is used
   - This is the single source of truth for technical details

3. **Benefits**:
   - Users reading feature sections get practical, contextual guidance
   - Config section serves as comprehensive reference
   - Help Chat AI has access to full technical details
   - No content duplication

### Additional Context for Documentation

**Target Audience**: This manual serves both children and adults. The app is designed to be accessible for kids, but documentation should be clear and helpful for all ages.

**Writing Balance**:
- Use simple, clear language that anyone can understand
- Avoid condescending or overly childish tone
- Explain technical concepts in plain terms without being patronizing
- Focus on being helpful and approachable, not age-specific

**Formatting**:
- **UI elements** in bold: "Click the **Config** button"
- **User actions** as steps: numbered lists for procedures
- **File names and technical terms** in code format: `image.png`, `localStorage`
- Keep paragraphs short (2-4 sentences)

**Tone & Voice**:
- Clear and direct using simple, everyday language
- Friendly but professional - approachable without being casual
- Action-oriented focusing on what users can do
- Timeless - avoid version numbers, dates, or temporary references in main content

**AI Help Chat Consideration**: This manual will be the knowledge base for the integrated help chat AI. Write content that:
- Can be easily referenced by an AI assistant
- Provides complete, accurate information
- Uses consistent terminology throughout
- Is structured logically for question-answering
- Keeps text for humans short and non-technical
- Adds technical details the Help Chat AI might need in separate sections at the end of the manual

The assistant will use the `manage_todo_list` tool to track verification and writing progress within each conversation.

---

## Getting Started

*DONE*

---

## Core Features

### The Gallery

#### Basic Gallery Usage
- Viewing your image collection as thumbnails
- Importing images via drag-and-drop
- Opening images (click to view full-screen)
- Deleting images (brief mention, link to Data Management section for full details)

#### Working with Gallery Images
- Dragging images to prompt panel for editing
- Downloading individual images
- Downloading all images as ZIP (mention briefly, link to Config section)

### The Viewer

#### Viewing and Navigating
- Opening and closing images
- Zooming with mouse wheel
- Panning by dragging
- Fitting image to screen

### Image Editing
- How to use images as edit references (drag from gallery to prompt panel)
- Visual feedback in drop area
- Editing with prompts
- Removing input images

### Model Selection
- Selecting models from dropdown
- What models are (brief, simple explanation)

---

## Configuration & Settings

### Accessing Configuration
- Config button (gear icon)
- Basic vs Advanced tabs

### Basic Settings

#### API Key
- Entering your OpenAI API key
- Testing the connection
- Key storage (localStorage, browser-specific)

#### Maximum Parallel Generations
- What this controls
- Recommended values
- Performance considerations
- cost considerations (accidentally clicking many times)

#### Number of Images (n)
- Generate multiple variations
- Cost considerations

### Advanced Settings

#### Background
- Auto, Transparent, Opaque options
- When to use each

#### Image Quality
- Auto vs High quality
- Impact on generation time and cost

#### Orientation/Size
- Landscape (1536×1024)
- Portrait (1024×1536)
- Square (1024×1024)

#### PNG Metadata Options
- Strip metadata from generated images
- Embed prompt as iTXt chunk
- Embed prompt as XMP metadata
- What each option does

#### Mask Mode Button
- Show/hide mask mode in Viewer
- When to enable

### Data Management

#### Delete Mode
- How to enable delete mode (trash button in menu bar)
- How to delete images (click thumbnails when delete mode active)
- How to exit delete mode
- Visual feedback (button appearance, cursor changes)

#### Download All Images
- Creates ZIP file of all gallery images
- File naming (based on prompt)

#### Clear Gallery
- Removes all images from IndexedDB
- Cannot be undone

#### Refresh Models
- Update available models list
- When to use

---

## Advanced Features

### Conversation Mode (Experimental)
- What is Conversation Mode?
- Switching between Generation and Conversation modes
- Multi-turn image refinement
- Conversation history
- Adding images to gallery from conversations

### PNG Metadata

#### Reading metadata from imported images
- Prompts embedded in PNGs
- Auto-population of prompt field

#### Writing metadata to generated images
- iTXt chunks
- XMP metadata
- Compatibility considerations

### Keyboard Shortcuts (Main App Only)
- **Viewer**: 
  - `D` key: Toggle debug overlay
  - (Document other shortcuts as they exist in the main app)
- **Note**: Intro sequence has separate keyboard controls documented in Appendix E

### Debug Features
- Debug overlay (if enabled)
- Understanding debug information

---

## Understanding Image Generation

### The Generation Process
- From prompt to image
- Role of the API
- What happens during generation
- Error handling

### Quality and Performance
- Factors affecting generation time
- Quality settings impact
- Network considerations
- Browser performance

### Costs
- How API usage is billed
- Impact of settings on cost (quality, n parameter)
- Monitoring usage (outside app)

---

## Troubleshooting & FAQ

### Common Issues

#### API Key Problems
- Invalid key errors
- Testing connection
- Where keys are stored

#### Generation Failures
- Content policy violations
- Network errors
- Timeout issues

#### Browser Issues
- Supported browsers
- Storage limitations
- Clearing browser data impact

### Frequently Asked Questions
- How can I edit an image?
- How can I import an external image? (and what does "import" and "external" mean?)
- How can I save an image?
- How can I backup/export my images?
- How can I delete images?
- How can I clear the whole gallery?
- Where are my images stored?
- Can I access my images on another device?
- What happens if I clear browser data?
- Can I use Imaginer offline?
- Why can't I see the mask mode button?

---

## Technical Information

### Architecture Overview
- Client-side only application
- No server-side storage
- IndexedDB for image persistence
- localStorage for settings

### Data Storage
- What's stored in IndexedDB
- What's stored in localStorage
- Browser storage limits
- Privacy considerations
- **Technical note**: API key hashing (cryptographically non-secure hash used for basic obfuscation)

### Image Formats
- Why PNG only?
- Automatic conversion process
- Metadata preservation

### OpenAI Integration
- Which APIs are used
- gpt-image-1 model specifics
- Response API (for conversation mode)

---

## Appendices

### Glossary
- Key terms explained (inpainting, mask, iTXt, XMP, etc.)

### Keyboard Reference (Main App)
- Complete list of keyboard shortcuts for the main application
- (Intro sequence shortcuts are in The Intro Sequence appendix)

### Default Values
- All default configuration settings
- Initial prompt

### Version History
- How to check current version
- Understanding version messages
- What's new (link to version messages)

### The Intro Sequence (Advanced)
- What is the intro sequence?
  - Epic cinematic experience completely separate from the main app
  - Plays AFTER API key entry on first launch only
  - Can be skipped during playback
  - Has no connection to image generation functionality

- The flow on first start
  - API key dialog appears first (with format validation and test button)
  - After successful key entry, audio setup screen appears
  - User tests audio, optionally enables fullscreen
  - Intro sequence begins ("Also sprach Zarathustra" soundtrack)
  - After completion, user is taken to main app

- Technical requirements
  - WebGL support required (automatically checked, skips to main app if unavailable)
  - Browser compatibility (works best in Firefox per developer recommendation)
  - Audio support for soundtrack

- Keyboard controls during intro
  - `1`-`5`: Switch font family (Andika, Comic Neue, Noto Sans, Orbitron, Quicksand)
  - `+`/`-` or `=`/`-`: Adjust font scale
  - Arrow Up/Down: Adjust audio volume
  - Font and volume settings persist via localStorage

- Debug tools reference
  - Standalone debug page at `intro/intro_debug_tools.html`
  - Links to individual intro phases
  - Interactive font and scale testing
  - Direct access to intro components for development/testing
