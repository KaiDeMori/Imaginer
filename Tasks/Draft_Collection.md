# Draft collection

Loose task drafts.
When a draft becomes a task, it moves to its own file (see `Tasks.blueprint.md`) and is removed from this collection.

## User data protection

Make sure that no code path can accidentally delete user data.
User data means the gallery images in IndexedDB.
Settings that are easy to reconfigure are out of scope.

> The images are what the user will miss!

## Host URL troubles

Imaginer is reachable both with and without `www.`.
Firefox keeps separate storage for each of the two URLs, which causes a mix-up.

Idea: create a subdomain for Imaginer and tell users to use that one.
Open question: would that actually help?
A few edge cases remain that feel unsolvable.

## Rethink the intro flow logic

The logic around a canceled or restarted intro seems overly complicated.
Maybe it can be simplified.

## Re-watch intro button

A button in the UI that lets the user experience our awesome, cosmological intro again.
Possible location: the Credits page.

## Second song not played

When the intro was watched again recently, the second song ("Air on the G String") did not play.
The intro was restarted by removing all stored site data in the Firefox dev tools.
Everything else worked perfectly, including the infinity zoom and the final transition.
Only the sound was missing.
A console log of that run was saved; its location still needs to be found.

## Timestamp in the exported file

Export could write the timestamp of the gallery record (`created`) into the exported file.
An import could then restore it from a renamed file or from a single file.
Candidates: `xmp:CreateDate` in the XMP form, EXIF `DateTimeOriginal` in an `eXIf` chunk, the PNG text keyword `Creation Time`.
`tIME` does not fit: it means the last modification.
This extends Imaginer metadata, which today is the prompt only (see `misc/metadata_terms.md`).
The ZIP import does not need it: it reads the timestamp from the filename.

## Wording of the migration dialog

The confirmation dialog of the one-time migration (`components/migration_confirm_modal.js`) reads as a list of losses.
Its only instruction is "choose Later".
It does not say what Later costs: a gallery file that stays a JPEG or WebP does not leave a ZIP export with any metadata checkbox on.
Escape and a click outside also count as Later.
Goal: the dialog makes clear that converting is the way forward.

## Token efficiency of the browser tool

Opus uses Imaginer through the Claude in Chrome tools, and every screenshot, page reading and tool call costs tokens.
Ideas that could make it cheaper and clearer at the same time:
- JavaScript readings instead of screenshots wherever words are enough.
- Small screenshots, and the zoom only where details matter.
- Several steps in one batch.
- A prompt fetched from its file and handed to `set_prompt`, never retyped.
