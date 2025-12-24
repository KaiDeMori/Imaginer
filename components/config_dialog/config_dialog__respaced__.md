# Config Dialog Spacing Plan (Proxemics)

## Principles

### Visual Hierarchy
- More space = more importance/separation
- Less space = stronger grouping/relationship

### Grouping by Proximity
- Related elements should be closer together
- Unrelated elements should have more space between them

### Rhythm & Consistency
- Similar elements should have consistent spacing
- Creates predictable visual patterns

## Spacing Requirements Analysis

### 1. Dialog Container
**Current:** No explicit padding
**Proposed:** Add padding around all edges
- **Top/Bottom:** 16px - gives breathing room from edges
- **Left/Right:** 24px - comfortable reading margins
**Reason:** Dialog content shouldn't touch edges; creates comfortable frame

### 2. Title
**Current:** No spacing defined
**Proposed:** Bottom margin of 12px
**Reason:** Separates title from tabs; establishes header zone

### 3. Tab Bar
**Current:** Border but no spacing
**Proposed:**
- Bottom margin: 14px (after switching tabs, before content starts)
- Tab button padding: 12px horizontal, 10px vertical
- Tab button gap: 8px between tabs
**Reason:** Creates clear separation between navigation and content; tappable button size

### 4. Tab Content
**Current:** No padding
**Proposed:**
- No additional padding (dialog handles it)
- But needs internal vertical rhythm
**Reason:** Let dialog padding do the work

### 5. Field Spacing (Vertical Rhythm)

#### Between Fields (`.field + .field`)
**Proposed:** 10px gap
**Reason:** 
- Fields are the primary units of the form
- Enough separation to scan quickly
- Not so much that dialog feels sparse

#### Within Inline Fields (label to input)
**Proposed:** 12px gap
**Reason:**
- Clear visual connection (label belongs to input)
- But enough space that label doesn't run into input
- Allows for varying label lengths without crowding

#### Within Stacked Fields
**Proposed:** 5px gap (label to input)
**Reason:**
- Stronger connection (same field)
- Label directly above its input = tight association

### 6. Section Groups (Advanced Tab)

The advanced tab has distinct sections:
1. Strip metadata checkbox (standalone)
2. Embed prompt group (label + 2 checkboxes)
3. Show mask mode checkbox (standalone)
4. Streaming group (checkbox + indented field)
5. Action buttons (2 buttons)

**Proposed:** 14px between sections
**Reason:**
- Sections are conceptually different features
- More space than fields = stronger separation
- Creates visual "paragraphs"

#### Within Section Groups
**Proposed:**
- Checkboxes within group: 6px vertical gap
- Indented content: 10px left indent, 6px top margin
**Reason:**
- Tight grouping shows they're related options
- Indent shows parent-child relationship
- Less than field spacing = sub-grouping

### 7. Section Labels (e.g., "Embed prompt:")
**Proposed:** 
- Bottom margin: 6px
- Top margin: 0 (section spacing handles it)
**Reason:**
- Label should be close to its options
- But distinct from checkboxes

### 8. Button Row
**Proposed:**
- Top margin: 18px (larger gap from content)
- Padding: 16px (internal padding for button row area)
- Gap between Cancel/Save: 8px
**Reason:**
- Strong separation from form content (action zone)
- Internal padding creates visual frame
- Cancel/Save are closely related actions (small gap)

### 9. Buttons Inside Content (Advanced Tab)
**Proposed:** 
- "Refresh Models" + "Delete Gallery": 12px vertical gap between them
- Top margin: 14px (same as section spacing)
**Reason:**
- These are distinct actions, not a group
- Should feel like separate buttons
- But both are utility actions (less space than to button row)

### 10. Form Elements (API Key)
**Current:** Inline form with Test button
**Proposed:**
- Internal gap in form: 8px between input and button
- Feedback icon: 8px left margin
**Reason:**
- Tight grouping (all one "action")
- Button is part of the input workflow
- Feedback immediately follows button

## Summary of Spacing Variables

```css
/* Container */
--dialog-padding: 24px 16px;
--title-margin-bottom: 12px;

/* Tab Bar */
--tab-bar-margin-bottom: 14px;
--tab-padding: 10px 12px;
--tab-gap: 8px;

/* Fields */
--field-gap: 10px;                    /* between fields */
--field-inline-label-gap: 12px;       /* label to input (inline) */
--field-stacked-label-gap: 5px;       /* label to input (stacked) */

/* Sections */
--section-gap: 14px;                  /* between major sections */
--section-checkbox-gap: 6px;          /* checkboxes within section */
--section-indent: 10px;               /* indented content */
--section-label-margin: 6px;          /* section label to content */

/* Buttons */
--button-row-margin-top: 18px;        /* content to button row */
--button-row-padding: 16px;           /* internal button row padding */
--button-group-gap: 8px;              /* between related buttons */
--action-button-gap: 12px;            /* between unrelated buttons */

/* Forms */
--form-element-gap: 8px;              /* within form elements */
```

## Implementation Strategy

1. Add CSS custom properties for all spacing values
2. Apply spacing using margin/padding/gap appropriately
3. Use margin-top for consistent stacking (easier to reason about)
4. Use flexbox gap where multiple items flow together
5. Test with varying content lengths to ensure robustness

## Notes

- All spacing is designed to work without media queries at dialog's fixed width
- Spacing creates clear visual hierarchy: dialog → sections → fields → elements
- Rhythm makes dialog scannable and reduces cognitive load
- Tighter spacing for related items, looser for separate concerns
