# Imaginer User Manual Roadmap

*Planning document for the comprehensive user manual*

## Purpose
This document serves as the master plan for creating the Imaginer User Manual. It contains the feature inventory, content structure, priorities, and topics to cover.

**⚠️ DOCUMENTATION FOCUS**: This roadmap is exclusively for documenting existing features. The goal is to get it right and not forget anything. Do NOT invent new features or interactive elements while writing documentation.

**Writing Style**: See `User_Manual_styleguide.md` for detailed writing guidelines and standards.


## Supported Image Formats

### Generation Output
- **PNG only** - All AI-generated images are returned as PNG format
  - API returns base64-encoded PNG data
  - Images saved to database as PNG Blobs
  - No format selection available (API limitation)

### Image Editing Input
- **PNG** - Primary format, fully supported
- **JPEG** - Also accepted by OpenAI `/v1/images/edits` endpoint
- **Other formats** - Automatically converted to PNG before sending to API
  - Includes GIF, WebP, and any format browser can handle
  - Conversion happens transparently via `image_converter.js`

### Drag & Drop
- **From Gallery (Internal)**: PNG only
  - Gallery images are always stored as PNG
  - Includes associated masks if present
- **From External Files**: Any image format browser supports
  - PNG, JPEG, GIF, WebP, etc.
  - Non-PNG/JPEG files automatically converted to PNG for editing
  - Validation occurs in `generation_panel.js`

### Downloads
- **PNG only** - All downloaded images are PNG format
  - Original format preserved from database storage
  - Filename pattern: `imaginer_<timestamp>.png`
  - Includes embedded metadata if enabled in configuration

### Masks
- **PNG only** - Mask images must be PNG format
  - Generated from viewer canvas as PNG
  - Stored in database as PNG Blobs
  - Required format for OpenAI API

---

## Configuration Keys Reference

*see comprehensive list in `localStorage_keys_explained.md`**

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
*see comprehensive list in `localStorage_keys_explained.md`**

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