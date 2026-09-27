# Notes

Shared notes on Imaginer: its addresses, its intro, and how it stores data.
Nothing in this file is a plan, a task or a commitment.
Plans and tasks are extracted from here once the picture is clear.
`README.md` in this folder describes what is where.

Started 2026-09-27.

**Current focus:** D1, one address for Imaginer. Evidence being gathered: U4.

## 1. How we work

1. **Discuss first.** Claude acts only on an explicit go, and only once we know what we are chasing.
2. **Goals before solutions.** We agree on what should happen (G) before we choose how (D).
3. **This file is the shared memory.** Findings go here. The user reads in the editor pane; chat stays short and refers to entry IDs.
4. **Evidence over memory.** Every Known entry names its source. A recollection is a data point, not proof. This applies to the user and to Claude alike; Claude has already been wrong once (R4).
5. **Entries move, they are never deleted.** A Suspected entry becomes Known or Refuted only with evidence. IDs are never reused or renumbered.
6. **Browser state is read through console snippets** that the user runs (Appendix A). The user controls what leaves the machine. Claude does not open browser profile folders without asking.
7. **Git, including commits, is done by the user.**
8. **Progression:** Notes → Plan → Tasks.

### Entry types

| Prefix | Meaning                                                      |
| ------ | ------------------------------------------------------------ |
| K      | Known: verified, with evidence.                              |
| S      | Suspected: hypothesis, with what would confirm or refute it. |
| U      | Unclear: open question.                                      |
| R      | Refuted: disproved hypothesis, kept for the record.          |
| G      | Goal: desired behavior. Draft until agreed.                  |
| D      | Decision: candidate or agreed, with its reasoning.           |

## 2. Terms

- **Origin:** scheme, host and port. The browser keeps `localStorage`, IndexedDB and the Cache API per origin. Paths do not separate storage.
- **Apex address:** `https://peopleoftheprompt.org/Imaginer/`, origin `https://peopleoftheprompt.org`.
- **www address:** `https://www.peopleoftheprompt.org/Imaginer/`, origin `https://www.peopleoftheprompt.org`.
- **Gallery:** IndexedDB database `imaginer-db`, object store `images`.
- **Intro flag:** `localStorage` key `imaginer.intro.first_start`. States: missing, `"true"` (intro page loaded, intro not finished), `"false"` (intro finished or skipped).
- **Interrupted-intro dialog:** the `confirm` dialog "The intro sequence was interrupted…" that `app.js` shows when the intro flag is `"true"`.
- **Interrupted-intro logic:** the mechanism around the intro flag that offers to restart an interrupted intro (Section 9).
- **This machine:** the user's development machine.
- **Second machine:** the user's other machine with Firefox.

## 3. Known

- **K1:** No Imaginer code empties `localStorage` and IndexedDB together, except the console-only `window.tabula_rasa()`. This holds for every commit in the history. The 1.12 and 1.13 updates add no deletion of any kind.
  *Evidence: code search; `git log -S` for `localStorage.clear`, `sessionStorage.clear`, `deleteDatabase`, `deleteObjectStore`, `store.clear()`, `database_store.clear`; `git diff 65f5fd4..HEAD`.*
- **K4:** The server answers `200` on both the apex address and the www address. It does not redirect between them. It sends no `Clear-Site-Data` header.
  On both hosts, `http` redirects to `https` (301), and a missing trailing slash redirects to the address with slash (301).
  Both hosts send `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
  *Evidence: curl (Appendix B).*
- **K5:** Imaginer shares its origin storage with other apps on `peopleoftheprompt.org`.
  The apex origin storage on this machine contains the IndexedDB databases `thinking_machines` and `thinking_machines_log`. Firefox encodes database names into file names; these names are decoded from them.
  The same storage contains Cache API data. Imaginer does not use the Cache API.
  *Evidence: Firefox profile listing on 2026-09-27.*
- **K6:** Firefox blocked the second song (`Bach_Air.m4a`) with its autoplay policy.
  The rejected promise of `play()` is not handled, and the log line "Bach Air started" is printed anyway.
  The file is served correctly (`200`, `audio/mp4`). The first song (Ogg) played.
  *Evidence: console log ("The play method is not allowed by the user agent…"); curl.*
- **K7:** The www origin holds its own Imaginer state with an interrupted intro: opening the www address shows the interrupted-intro dialog.
  *Evidence: user observation.*
- **K10:** Opening the www address in Firefox on this machine ends on the apex address. Exception: when the interrupted-intro dialog appears, the browser stays on the www address (K7).
  *Evidence: user observation.*
- **K11:** On the server, only the web root has a `.htaccess` file, and it contains no redirect. The `Imaginer` folder has no `.htaccess` file.
  Consequence: the `http` to `https` redirect from K4 is configured outside the `.htaccess` files, for example in the hosting configuration.
  *Evidence: user check of the server files on 2026-09-27, done twice.*
- **K12:** Firefox's site-level clearing works per base domain, including every subdomain. This covers the identity panel (lock icon) "Clear cookies and site data", Settings › Privacy & Security › Cookies and Site Data › Manage Data, and "Forget About This Site". Clearing per host or per origin is not possible there.
  The Storage Inspector in the developer tools is the exception: it is organized per origin and deletes per storage type. No single action there clears all storage types at once.
  This behavior exists since Firefox 89 (2021). No later change was found.
  Consequence: a subdomain per app does not protect against site-level clearing in Firefox; only a separate registrable domain does (D5).
  *Evidence: Firefox source docs, Data Sanitization: "Clears all data associated with the base domain of the selected site", "Clearing data on a more granular (host or origin) level is not possible."; Mozilla bug 1712028 (per-subdomain clearing requested, WONTFIX: "We opt for the third option of removing subdomain data as well"); Mozilla Security Blog, Firefox 91 Enhanced Cookie Clearing; Firefox source docs, Storage Inspector. Links in Reference › Firefox.*

## 4. Suspected

- **S3:** U1 is caused by a permanent redirect that Firefox cached at some earlier point. Firefox keeps permanent redirects indefinitely; curl does not cache.
  *Support: K11 shows that redirects exist outside the `.htaccess` files. A www redirect in the hosting configuration may have existed earlier and been removed since.*
  *Would confirm: the www address stays on the www address in a private window, which starts with an empty cache.*
- **S4:** Existing users use the apex address.
  *Support: the user only shares links to the apex address.*
  *Would confirm: U4.*

## 5. Unclear

- **U1:** Why does Firefox on this machine go from the www address to the apex address (K10), while the server does not redirect (K4)? The `.htaccess` files are ruled out as the source (K11). Candidate: S3.
- **U2:** What exactly "completely breaks" on the www address when the interrupted-intro dialog appears?
- **U3:** Why did Firefox block the second song, although the user had clicked Start and pressed keys in the same document?
- **U4:** Which address do existing users, and the second machine, use?
  Being worked on:
  - Server logs. Every app start fetches `/Imaginer/version.json`; crawlers usually only fetch the page. Requests for it on the www host therefore indicate real use. Check that the log records the host, check the retention period, and exclude the user's own visits.
  - Signal group of key users. Ask them to read the address bar while their gallery is visible, not what they type. The group covers the key users only, not every user.
- **U6:** Which apps share the origin, and which of them can clear origin-wide storage (`localStorage.clear()`, deleting all IndexedDB databases, `Clear-Site-Data`)?
  Possible evidence: the reset code of the other apps on the domain. Claude can read it once the user points to their repositories.
- **U7:** Does any app on the origin register a service worker whose scope covers `/Imaginer/`? Such a worker would control Imaginer's pages. Prompted by the Cache API data in K5.
- **U8:** For G4, what counts as the start of the intro: loading the intro page, or clicking Start? Today the intro page sets the intro flag on load, before the user has seen anything.

## 6. Refuted

- **R4:** The second song fails because Firefox cannot decode AAC. *Claude's first guess. Refuted by K6.*

## 7. Goals (draft)

### Data safety

- **G1:** No automatic flow deletes or overwrites the gallery, the API key or the settings: not the intro, not a version update, not a missing key, not a network error. Only explicit, confirmed user actions delete data.
  *Source: the user's general rule: nothing may cause the loss of the gallery, not a network problem, not a missing API key, nothing else. Current state: met (K1).*
- **G2:** Imaginer deletes only its own data (its `localStorage` keys and `imaginer-db`), never origin-wide storage.
  *Current state: violated by `tabula_rasa()`, which deletes every IndexedDB database of the origin, including those of other apps.*

### Intro

- **G3:** On storage without Imaginer state, the intro plays once.
- **G4:** The intro counts as seen the moment it starts (U8). Interrupted or not, every later visit opens the app directly.
- **G5:** A "Rewatch intro" button replays the intro. Afterwards the app is back with everything intact.

### Address and storage

- **G6:** Imaginer has exactly one address.
- **G7:** Firefox never evicts the gallery on its own. Optional.
- **G8:** Other apps cannot delete Imaginer's data, and Imaginer cannot delete theirs. Optional.

## 8. Decisions

All entries are candidates. Nothing is agreed yet.

- **D1:** One canonical address. *Serves G6.*
  - **Q-A, which address?** Decisive: U4. Lean: the apex address, because it is shorter, it fits S4, and this machine holds its data there. A server-level www redirect would affect all apps on the domain, not only Imaginer.
  - **Q-B, how does existing data move?** A plain server redirect strands every gallery stored under the old origin: the data stays in the browser, but no page can reach it anymore. Options:
    1. Manual: ZIP export on the old address, drop the images into the new one. Works today. Loses the API key, the settings and the masks; creation dates become the import date. Prompts survive only where they are embedded in the image metadata, which is on by default.
    2. Automatic transfer: the new address loads a transfer page from the old address in a hidden frame. That page reads the old storage and passes it over with `postMessage`. Assumption to test: both hosts count as the same site, so the frame sees its normal, unpartitioned storage. Large galleries need a chunked transfer.
    3. Smart forwarding: the page on the old address checks its own storage first. Empty: forward at once. Data: offer the transfer (2), with the ZIP (1) as fallback. A server redirect follows only after a transition period.

    Recommendation: 3, backed by 1 and 2.
  - **Q-C, coordinate with D5?** If Imaginer ever moves to its own origin, switch once, directly to the final address.
  - Preconditions: resolve U1 before adding any redirect. Test with a temporary redirect (302 or 307) first, because browsers cache a 301 indefinitely.
- **D2:** Replace the interrupted-intro logic with a "Rewatch intro" button. *Serves G3, G4, G5.*
  Rationale (user): the interrupted-intro logic produces odd edge cases (U2). With the button, a disrupted intro always leads straight to the app, and the intro stays reachable.
  Open: location of the button, About dialog or config dialog.
  The intro flag is coupled to several places (Section 9). After D2, the intro's own key screen remains the onboarding path on the first visit; the app's missing-key dialog covers every other case.
- **D3:** Limit `tabula_rasa()` to Imaginer's own `localStorage` keys and `imaginer-db`. *Serves G2.*
- **D4:** Request persistent storage with `navigator.storage.persist()`. *Serves G7.*
  Firefox asks the user once. Protects against eviction only, not against user-initiated clearing and not against code in other apps.
- **D5:** Give each app its own origin. *Serves G8.* Same migration problem as D1 (Q-B, Q-C). Two variants, compared by K12:
  - Subdomain per app (for example `imaginer.peopleoftheprompt.org`). Protects against code in other apps, because `localStorage` and IndexedDB are per origin, and against deletions in the Storage Inspector. Does not protect against Firefox's site-level clearing, which covers every subdomain.
  - Separate registrable domain for Imaginer. Protects against code in other apps and against site-level clearing of the other apps' domain. Costs a domain of its own.

  Neither variant protects against clearing all sites at once (Clear Recent History with site data).
- **D6:** Make the intro music robust: handle a rejected `play()`, and start playback in a way that does not depend on the autoplay policy. *Depends on U3.*

## 9. Reference

### Storage used by Imaginer

See also `User_Manual/localStorage_keys_explained.md`.

- `localStorage`:
  - Intro flag: `imaginer.intro.first_start`.
  - API key: `imaginer.scrambled_api_key`, obfuscated with the per-browser key `imaginer.scramble_key`.
  - Version: `imaginer_app_version`.
  - Intro: `eu_seed` (timestamp of the first run of intro phase 3 on this storage), `imaginer_audio_volume`, `imaginer_font_scale`.
  - Settings: further `imaginer.*` keys. Defaults in `default_config.js`.
- `sessionStorage`: `imaginer.intro.is_running`, set by the intro before it loads the app in a frame.
- IndexedDB: `imaginer-db`, version 2, object store `images`.

### Deleting paths in the current code

| Path                                     | Deletes                                                                          | Guard                     |
| ---------------------------------------- | -------------------------------------------------------------------------------- | ------------------------- |
| `window.tabula_rasa()`                   | All `localStorage`, all `sessionStorage`, every IndexedDB database of the origin | Console only              |
| Config dialog, "Clear Gallery"           | All images                                                                       | Second click, typed `YES` |
| Performance warning, "Clear Gallery"     | All images                                                                       | Typed `YES`               |
| Gallery delete mode                      | Selected images                                                                  | Confirmation modal        |
| Config dialog, save with empty key field | API key                                                                          | Explicit save             |
| Interrupted-intro dialog, OK             | Intro flag                                                                       | Explicit OK               |

### Places that read or write the intro flag

Relevant for D2.

- `app.js`, top level: missing flag → redirect to the intro. Flag `"true"` → interrupted-intro dialog; OK removes the flag and restarts the intro, Cancel sets `"false"`. The `sessionStorage` flag marks the app as running inside the intro and is cleared there.
- `app.js`, `DOMContentLoaded` handler: the startup overlay treats flag `"true"` as "running inside the intro frame".
- `version_manager.js`, `finalize_oobe` inside `check_and_show_update_message`: turns `"true"` into `"false"` and leaves fullscreen.
- `intro/00/cinematic_starfield_and_the_great_everywhere_shake.html`, inline script in the head: sets `"true"` on page load. If the flag is `"false"`, it first shows an alert ("This page should not be loaded if the intro is already done"). This alert would interrupt a rewatch.
- `intro/00/pre_intro_ui.js`, `initialize_pre_intro`: without WebGL, sets `"false"` and goes to the app.
- `intro/00/pre_intro_ui.js`, `check_for_api_key` and `setup_api_key_interface`: the intro's own API key screen.
- `intro/04/app_transition_manager.js`: sets the `sessionStorage` flag, loads the app in a frame, and finally rewrites the URL to `index.html`.

### Deployment

- Deployed by SFTP from the working tree (VS Code SFTP extension).
- The upload excludes `*.md`, `misc` and a few other folders. Notes in `Tasks/*.md` therefore never go live; other file types in `Tasks/` would.
- Live under the apex address and the www address (K4).
- Server configuration: only the web root has a `.htaccess` file, without redirects. `Imaginer` has none. The `http` to `https` redirect comes from outside the `.htaccess` files (K11).
- `.gitignore` excludes every file in `intro/audio/` except `*.webm`, but the intro loads `Also_sprach_Zarathustra.ogg`, `Bach_Air.m4a` and `blip.wav`. The upload from the working tree includes them; a deployment from a fresh clone would lack the intro audio.

### Firefox

- Firefox keeps permanent redirects (301) in its cache indefinitely. A private window starts with an empty cache (S3).
- Firefox clears the developer console on every navigation unless "Persist Logs" is on (Appendix A).
- Site-level clearing covers the base domain with every subdomain (K12). Removing the entry `peopleoftheprompt.org` in Manage Data, or using "Clear cookies and site data" in the identity panel on any page of the domain, removes the storage of both addresses and of all apps on the domain.
- Sources for K12:
  - [Firefox source docs: Data Sanitization](https://firefox-source-docs.mozilla.org/toolkit/components/antitracking/anti-tracking/data-sanitization/)
  - [Mozilla bug 1712028: delete per subdomain, WONTFIX](https://bugzilla.mozilla.org/show_bug.cgi?id=1712028)
  - [Mozilla Security Blog: Firefox 91 introduces Enhanced Cookie Clearing](https://blog.mozilla.org/security/2021/08/10/firefox-91-introduces-enhanced-cookie-clearing/)
  - [Firefox source docs: Storage Inspector](https://firefox-source-docs.mozilla.org/devtools-user/storage_inspector/index.html)

### Git anchors

- 1.11: `65f5fd4`. 1.12: `fb69ce8`, follow-ups until `a40867c`. 1.13: `39bdc35`.
- Interrupted-intro logic: `30bac03`, `ab2942a`, `0d814f1` (2025-11).
- Hard reset added in `d18bf87` (2025-06-14). The name `tabula_rasa` first appears in `09d1658` (2025-11-24).
- Gallery-wide cleanup removed from `Viewer.open`: `3164d96`.

## Appendix A: console diagnostic snippet

Run it in the developer console on an Imaginer page.
It only reads. It prints no API key, no prompts and no images.
Firefox asks to type `allow pasting` before the first paste into the console.
Enable "Persist Logs" in the console settings when investigating; otherwise every navigation clears the console.

Reports: origin, browser, storage persistence, usage and quota, `localStorage` keys (values only for non-sensitive keys), IndexedDB databases, gallery size and date range, and whether both intro songs can be loaded.

Useful runs: on this machine and on the second machine, on every address that holds Imaginer data.
The snippet writes no storage. Loading an Imaginer page on an origin without Imaginer state does: it starts the intro and writes the intro flag.

```js
(async () => {
  const report = {
    origin: location.origin,
    user_agent: navigator.userAgent,
    now: new Date().toISOString(),
  };
  const to_iso = (created) => new Date(created > 1e12 ? created : created * 1000).toISOString();

  try {
    report.storage_persisted = await navigator.storage.persisted();
    const estimate = await navigator.storage.estimate();
    report.storage_usage_MB = Math.round(estimate.usage / 1048576);
    report.storage_quota_MB = Math.round(estimate.quota / 1048576);
  } catch (error) {
    report.storage_error = String(error);
  }

  const readable_keys = ["imaginer_app_version", "imaginer.intro.first_start", "eu_seed"];
  report.local_storage = {};
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    const value = localStorage.getItem(key) ?? "";
    report.local_storage[key] = readable_keys.includes(key) ? value : `<${value.length} chars>`;
  }
  const eu_seed = Number(localStorage.getItem("eu_seed"));
  if (eu_seed) report.intro_first_run_on_this_storage = new Date(eu_seed).toISOString();

  try {
    report.databases = await indexedDB.databases();
  } catch (error) {
    report.databases = String(error);
  }

  report.gallery = await new Promise((resolve) => {
    const request = indexedDB.open("imaginer-db");
    // Aborting the upgrade keeps a missing database from being created by this probe.
    request.onupgradeneeded = () => request.transaction.abort();
    request.onerror = () => resolve(`not present (${request.error?.name})`);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("images", "readonly");
      const created_index = transaction.objectStore("images").index("created");
      const result = {};
      created_index.count().onsuccess = (event) => (result.image_count = event.target.result);
      for (const [direction, name] of [["next", "oldest_image"], ["prev", "newest_image"]]) {
        created_index.openKeyCursor(null, direction).onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) result[name] = to_iso(cursor.key);
        };
      }
      transaction.oncomplete = () => {
        database.close();
        resolve(result);
      };
      transaction.onerror = () => resolve(`read failed (${transaction.error?.name})`);
    };
  });

  const probe_audio = (path) =>
    new Promise((resolve) => {
      const audio = new Audio();
      let timer = null;
      const finish = (outcome) => {
        clearTimeout(timer);
        audio.oncanplay = audio.onerror = null;
        audio.removeAttribute("src");
        audio.load();
        resolve(outcome);
      };
      timer = setTimeout(() => finish(`timeout (readyState ${audio.readyState}, networkState ${audio.networkState})`), 20000);
      audio.oncanplay = () => finish(`decodable, duration ${Math.round(audio.duration)} s`);
      audio.onerror = () => finish(`error ${audio.error?.code}: ${audio.error?.message || "no message"}`);
      audio.preload = "auto";
      audio.src = new URL(path, location.origin).href;
    });

  report.audio = {
    can_play_AAC: new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"') || "no",
    can_play_vorbis: new Audio().canPlayType('audio/ogg; codecs="vorbis"') || "no",
    bach_air_m4a: await probe_audio("/Imaginer/intro/audio/Bach_Air.m4a"),
    zarathustra_ogg: await probe_audio("/Imaginer/intro/audio/Also_sprach_Zarathustra.ogg"),
  };

  const text = JSON.stringify(report, null, 2);
  console.log(text);
  try {
    copy(text);
    console.log("Report copied to the clipboard.");
  } catch (_) {
    console.log("Copy the JSON above manually.");
  }
})();
```

## Appendix B: server checks

Redirects and storage-related headers of both addresses:

```sh
for url in \
  "http://peopleoftheprompt.org/Imaginer/" "https://peopleoftheprompt.org/Imaginer/" \
  "http://www.peopleoftheprompt.org/Imaginer/" "https://www.peopleoftheprompt.org/Imaginer/"; do
  echo "=== $url"
  curl -s -o /dev/null -D - --max-time 15 "$url" | grep -i -E '^(HTTP|location|clear-site-data|strict-transport|cache-control)'
done
```
