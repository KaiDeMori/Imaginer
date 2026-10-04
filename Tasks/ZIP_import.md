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

### Decisions

Made while building; the wording is for the review.

- The module is `ZIP_import.js` in the repository root: `is_ZIP_file`, `is_picture_name`, `restore_created`, `open_ZIP_file`, `describe_ZIP_picture_failure`, `describe_ZIP_contents`. It takes JSZip from the existing loader, and its top level is free of browser globals, so Node runs it.
- A file is a ZIP file by the extension `.zip` in any letter case, or by the types `application/zip` and `application/x-zip-compressed`, because the type of a chosen file depends on the system. The file dialog of 📂 accepts `.zip` next to the three image types.
- `Gallery.import_files` imports the loose files as one batch, then every ZIP file on its own, in the order picked. One dialog follows the whole import. The path of one file, intake, record, save and thumbnail, is `import_one_file`, shared by loose files and ZIP pictures.
- The timestamp is read from the base name of the entry: the reading `<prompt>_<created>_<id>.<ext>` first, then `<prompt>_<created>.<ext>` from Imaginer 1.12, because a prompt may end in digits. A reading counts only when its timestamp lies between 2025-01-01 and the time of the import. The time of the import is taken once per ZIP file, so the pictures without a trusted timestamp share it and keep the ZIP file's order by their IDs.
- A thumbnail is inserted by timestamp, newest first, then by ID, which is the order after a reload; so a restored picture lands among the existing pictures, not on top of them. A placeholder counts by the start of its generation, so a loose import during a generation stays above it, as before.
- Pictures inside folders of the ZIP file are pictures too. In the dialog a picture is named by its entry name; as a `File` it carries its base name.
- A reason follows a picture that could not be imported only when it is a fact: a conversion this browser cannot do, an entry that could not be read from the ZIP file, a save that failed. The diagnosis intake makes for an unreadable loose file, "corrupted or mislabeled", is a guess: intake marks that error with the name `Unreadable_image_error`, and the ZIP import leaves the diagnosis out. Loose files keep their messages.
- Wording:
  - The question for a ZIP file: `"<name>" holds <count> pictures. Should all of them go into the gallery?`
  - A picture that could not be imported: `<name>: Imaginer could not understand this picture.`, the reason after it when there is one.
  - The files that are not pictures: `<count> files in "<name>" are not images that Imaginer can understand.`, in the singular for one. The ZIP file is named instead of "your ZIP", because several can be picked at once.
  - A ZIP file without pictures: `"<name>" holds no pictures.`
  - A file that cannot be opened: `"<name>" could not be read as a ZIP file.`, without JSZip's wording, which speculates about corruption.
  - The input area: `"<name>" is a ZIP file. ZIP files go into the gallery: drop them there, or choose them with 📂 in the menu bar.` A ZIP file does not count against the edit request's image count.
- The check is `tools/check/ZIP_import_check.mjs`. `gallery_import_check.mjs` runs the import path on the real prototype now, and its file dialog check names `.zip`.

## Steps

- [x] The ZIP import works as described in the plan.
- [x] `bash tools/check/check.sh` passes.
- [x] README, User Manual, Technical Manual and `misc/metadata_terms.md` describe the ZIP import. The FAQ got a question on restoring a backup.
- [x] The manual tests are listed in this file, in a section "Manual test".
- [ ] The user ran the manual tests.
- [ ] Reviewed.

## Manual test

1. Config → Advanced: the three metadata checkboxes on, OK. With a gallery of several images, some with prompts: Config → Files → **Download All Images**, then Config → Files → **Delete Gallery**. Drop the ZIP file into the gallery: the pictures appear in the same order as before, each with its 💬 prompt. Reload: the order is the same. ⬇️ on one of them: the filename carries the same timestamp as the file in the ZIP.
2. 📂 in the menu bar: the file dialog offers the ZIP file, and choosing it imports the same way.
3. A ZIP file exported by Imaginer 1.12: the pictures come back in their order, with their prompts and timestamps.
4. The ZIP file dropped into a gallery that holds newer pictures: the restored pictures land below the newer ones, by their timestamps, and a reload shows the same order.
5. A copy of the ZIP file with one picture renamed to `photo.png`, a text file added, and a text file renamed to `bad.png`: the other pictures are restored; `photo.png` lands at the top with the time of the import; the dialog afterwards lists `bad.png: Imaginer could not understand this picture.` and says `1 file in "<name>" is not an image that Imaginer can understand.`; no word like "corrupt" appears.
6. A ZIP file with more than 100 pictures: the question names the ZIP file and its count; **Cancel** imports nothing; **Yes, all of them** imports all. The ZIP file of a large gallery imports completely, the thumbnails appearing one by one.
7. The ZIP file dropped into the input area: a dialog says it is a ZIP file and points to the gallery; nothing is added.
8. A text file renamed to `.zip`: the dialog says `"<name>" could not be read as a ZIP file.`
9. Loose images dropped together with a ZIP file: the loose images get the time of the import, the ZIP file's pictures their timestamps; one dialog afterwards, if there is anything to report.

## Review

Opus, 2026-10-04: the gate passes, every constraint is kept, and `tools/check/ZIP_import_check.mjs` runs 80 checks. Findings:

- `Status.md` says Rock-solid metadata and the gallery import button "shipped with 1.14"; 1.14 is not uploaded yet.
- Pictures with the same timestamp keep the ZIP file's order, not their IDs. ZIP export writes the oldest first, so this holds for its ZIP files; for a ZIP file from Imaginer 1.12, manual test 3 shows it.
- `misc/metadata_terms.md` defines the ZIP import for a ZIP file "from ZIP export", but any ZIP file is imported. It also says the restore works because the filename carries "the timestamp and the ID", but the ID is not read.
- A ZIP file made on a Mac carries `__MACOSX/._<name>.png` helper files. Their names end in `.png`, so they are listed as pictures Imaginer could not understand.
- The notes about a ZIP file appear in the error dialog, under the title "Error".
