# ZIP import

## Goal

A ZIP file from ZIP export restores a gallery: Import to Gallery brings its pictures back in the same order, with their prompts and timestamps.

## Plan

Today, a restore means unzipping the ZIP file by hand and importing the loose files.
The order gets lost on the way, because neither the unzip tool nor the file dialog keeps it.
Import to Gallery therefore accepts the ZIP file itself.

*ZIP import*: Import to Gallery of a ZIP file.

### Behaviour

- The 📂 button and a drop on the gallery both accept ZIP files.
- The input area refuses a ZIP file, with a message.
- The restored pictures appear in the same order as in the gallery they were exported from.
- A restored picture keeps the timestamp of its gallery record.
- Both also hold for ZIP files exported by Imaginer 1.12.
- A picture whose timestamp cannot be restored gets the time of the import. Such pictures keep the order they have in the ZIP file.
- A restored timestamp before 2025 or in the future is not trusted. The picture gets the time of the import.
- Above 100 pictures, Import to Gallery asks first, as it does for loose files. For a ZIP file, the question counts the pictures in that ZIP file and is asked once per ZIP file. Its wording is a draft; the final wording is decided in the review.
- A file in the ZIP file whose name does not end in `.png`, `.jpg`, `.jpeg` or `.webp`, in any letter case, is not a picture. Such files are only counted, in one line of the dialog after the import: "2 files in your ZIP are not images that Imaginer can understand." Folders are not counted.
- A picture that cannot be imported is listed by name in the same dialog, as one that Imaginer could not understand. A reason follows only when Imaginer knows it as a fact. Imaginer does not guess: words such as "damaged" or "corrupt" do not appear.

### Constraints

- Export stays as it is: Download and ZIP export.
- Every picture from a ZIP file passes intake exactly like a loose file at Import to Gallery. The intake rules in `misc/metadata_terms.md` apply unchanged.
- The metadata checkboxes are at their defaults, all three on. Other settings are not planned for.
- The release files `version.json` and `version_messages/` stay untouched.
- No existing check in `tools/check/` is weakened or removed.

### Out of scope

- Masks: they are not exported, so a restore brings none.
- Duplicates: a ZIP file imported into a gallery that already holds its pictures adds them again.
- Download, and loose files imported by hand: no change.
- A size limit for ZIP files: none is planned. The manual tests include the ZIP file of a large gallery.

## Steps

- [ ] The ZIP import works as described in the plan.
- [ ] `bash tools/check/check.sh` passes.
- [ ] README, User Manual, Technical Manual and `misc/metadata_terms.md` describe the ZIP import.
- [ ] The manual tests are listed in this file, in a section "Manual test".
- [ ] The user ran the manual tests.
- [ ] Reviewed.
