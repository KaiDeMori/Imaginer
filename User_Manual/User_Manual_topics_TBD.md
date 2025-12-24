# Imaginer User Manual - Topics To Be Documented

*This file tracks remaining documentation work. As topics are completed and added to the main manual, they are removed from here.*

## How This Works

This file serves as your working backlog for writing the Imaginer User Manual. Here's the workflow:

1. **Start a conversation** by attaching this file and specifying which topic(s) you want to work on
2. **The assistant researches** the codebase to verify every statement and feature mentioned in the topic
3. **The assistant writes** complete, polished documentation following the guidelines in `User_Manual_roadmap.md`
4. **Content is added** to `Imaginer_User_Manual.md` (the actual user manual)
5. **Topic is removed** from this TBD file once completed
6. **Repeat** until all topics are documented

### Critical Rule: Verify Before Writing

**Before writing any documentation, the assistant MUST:**
- Read relevant source files to verify features exist as described
- Check configuration keys and default values in the actual code
- Verify UI elements, button labels, and behavior
- Confirm technical details (storage mechanisms, API endpoints, etc.)
- Note any discrepancies between the topic outline and actual implementation

**Never assume** a feature works as outlined - always verify in the codebase first. This step-by-step approach ensures accuracy.

### Related Files

- **`Imaginer_User_Manual.md`** - The actual user manual where completed documentation lives
- **`User_Manual_roadmap.md`** - Writing guidelines, style standards, priorities, and strategic planning

### Additional Context for Documentation

**Target Audience**: This manual serves both children and adults. The app is designed to be accessible for kids, but documentation should be clear and helpful for all ages.

**Writing Balance**:
- Use simple, clear language that anyone can understand
- Avoid condescending or overly childish tone
- Explain technical concepts in plain terms without being patronizing
- Focus on being helpful and approachable, not age-specific

**AI Help Chat Consideration**: This manual will be the knowledge base for the integrated help chat AI. Write content that:
- Can be easily referenced by an AI assistant
- Provides complete, accurate information
- Uses consistent terminology throughout
- Is structured logically for question-answering

Keep the text meant for humans short and non-technical and prefer to add technical details that the Help Chat AI might need to the end of the manual in separate sections.

The assistant will use the `manage_todo_list` tool to track verification and writing progress within each conversation.

---

## I. Getting Started

---

## II. Core Features

### 1. Image Generation

#### Basic Generation
- Writing effective prompts
- Choosing image orientation (landscape, portrait, square)
- The Generate button
- Understanding the generation process
- Viewing generated images

#### Multiple Images
- Generating multiple images at once (n parameter)
- Parallel generation limits
- Managing generation queue

### 2. The Gallery

#### Understanding the Gallery
- How images are stored (IndexedDB, local to browser)
- Thumbnail view
- Import images via drag-and-drop
- Automatic format conversion (to PNG)

#### Managing Gallery Images
- Viewing images (click to open in Viewer)
- Downloading images individually
- Delete mode (trash icon in menu)
- Clearing entire gallery
- Drag images from gallery to prompt panel for editing

### 3. The Viewer

#### Viewing Images
- Opening an image (click thumbnail)
- Closing the viewer (click outside image)
- Full-screen display

#### Zoom and Pan
- Mouse wheel zoom
- Zoom behavior (mouse-centric)
- Panning with drag
- Reset to fit view

#### Mask Mode (Advanced)
- What is mask mode?
- Enabling mask mode button (Config setting)
- Activating mask mode
- Painting masks with brush
- Removing masks
- Using masks for inpainting
- Mask visualization (red overlay)

### 4. Image Editing

#### Edit Mode vs Generation Mode
- Drag-and-drop images to prompt panel
- Visual feedback (thumbnails in drop area)
- Editing with reference images
- Removing input images

#### Using Masks for Inpainting
- Creating a mask in Viewer
- Dragging masked image to prompt panel
- Prompting for specific edits
- Understanding mask-active indicator (red border)

### 5. Model Selection
- Model dropdown in menu bar
- Auto-refresh on config changes
- Understanding model capabilities
- gpt-image-1 as primary model

---

## III. Configuration & Settings

### 1. Accessing Configuration
- Config button (gear icon)
- Basic vs Advanced tabs

### 2. Basic Settings

#### API Key
- Entering your OpenAI API key
- Testing the connection
- Key storage (localStorage, browser-specific)

#### Maximum Parallel Generations
- What this controls
- Recommended values
- Performance considerations

#### Number of Images (n)
- Generate multiple variations
- Cost considerations

### 3. Advanced Settings

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

### 4. Data Management

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

## IV. Advanced Features

### 1. Conversation Mode (Experimental)
- What is Conversation Mode?
- Switching between Generation and Conversation modes
- Multi-turn image refinement
- Conversation history
- Adding images to gallery from conversations

### 2. PNG Metadata

#### Reading metadata from imported images
- Prompts embedded in PNGs
- Auto-population of prompt field

#### Writing metadata to generated images
- iTXt chunks
- XMP metadata
- Compatibility considerations

### 3. Keyboard Shortcuts (Main App Only)
- **Viewer**: 
  - `D` key: Toggle debug overlay
  - (Document other shortcuts as they exist in the main app)
- **Note**: Intro sequence has separate keyboard controls documented in Appendix E

### 4. Debug Features
- Debug overlay (if enabled)
- Understanding debug information

---

## V. Understanding Image Generation

### 1. The Generation Process
- From prompt to image
- Role of the API
- What happens during generation
- Error handling

### 2. Quality and Performance
- Factors affecting generation time
- Quality settings impact
- Network considerations
- Browser performance

### 3. Costs
- How API usage is billed
- Impact of settings on cost (quality, n parameter)
- Monitoring usage (outside app)

---

## VI. Troubleshooting & FAQ

### 1. Common Issues

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

### 2. Frequently Asked Questions
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

## VII. Technical Information

### 1. Architecture Overview
- Client-side only application
- No server-side storage
- IndexedDB for image persistence
- localStorage for settings

### 2. Data Storage
- What's stored in IndexedDB
- What's stored in localStorage
- Browser storage limits
- Privacy considerations
- **Technical note**: API key hashing (cryptographically non-secure hash used for basic obfuscation)

### 3. Image Formats
- Why PNG only?
- Automatic conversion process
- Metadata preservation

### 4. OpenAI Integration
- Which APIs are used
- gpt-image-1 model specifics
- Response API (for conversation mode)

---

## VIII. Appendices

### A. Glossary
- Key terms explained (inpainting, mask, iTXt, XMP, etc.)

### B. Keyboard Reference (Main App)
- Complete list of keyboard shortcuts for the main application
- (Intro sequence shortcuts are in Appendix E)

### C. Default Values
- All default configuration settings
- Initial prompt

### D. Version History
- How to check current version
- Understanding version messages
- What's new (link to version messages)

### E. The Intro Sequence (Advanced)
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
