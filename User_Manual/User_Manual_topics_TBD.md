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

## Getting Started

*DONE*

---

## Core Features

*DONE*

---

## Configuration & Settings ("Config")

### Accessing Configuration
*DONE*

### Basic Settings

*DONE*

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
