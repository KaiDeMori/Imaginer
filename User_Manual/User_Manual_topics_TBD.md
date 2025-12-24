# Imaginer User Manual - Topics To Be Documented

*This file tracks remaining documentation work. As topics are completed and added to the main manual, they are removed from here.*

**Workflow and style guidelines**: Always start with reading `User_Manual_roadmap.md` for documentation workflow and `User_Manual_styleguide.md` for writing standards.

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
- Deleting images (brief mention, see Data Management → **Delete Mode** for full details)

#### Working with Gallery Images
- Dragging images to prompt panel for editing
- Downloading individual images
- Downloading all images as ZIP (mention briefly, see Data Management → **Download All Images** for details)

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
