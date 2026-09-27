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
