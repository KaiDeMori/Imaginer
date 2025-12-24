# Interactive Help System

## Idea
Create an integrated help system that is based on a chat conversation.

### Manual based
We create a comprehensive manual in md format. this will be put into the context of the help chat.

### context aware
let's give the ai some additional context of the current state of the app, maybe the whole config from localStorage and some details about the gallery like the amount of images and the space/memory it uses.
any more?
maybe some info about the browser (what browser, resolution/dpi, more?)

### multilungual
although the manual and the whole ui is all english, we can pre-prompt the ai to always use the language it was asked in. so if a user asks a question in italian, the ai should reply in italian. this way it can also easily translate button labels and explain them.

### open questions
how do we integrate it?
* dedicated full screen overlay
* question mark button to open
* any better ideas?

### persistence?
I think we should keep the current help conversation stored somewhere, but no "history" for these. it seems sufficient to just have a "New Question" button since the user can always just ask the question again.
although they might want to check what they read in the actual UI (closing the help chat) and then come back to read on.

### ResponsesAPI
Since we are planning a future enhancement using ResponsesAPI (see document `ResponsesAPI_Integration_planning.md` ) and this has some interesting features like server-side persistence, we might "re-use" that. So far, we only have prototyped the general idea for integrating it into image generation, but for the help chat, this might be a perfect fit.

## predefined questions

* how can i edit an image?
* how can i import an image? (and what does "import" and "external" mean? :-) )
* how can i save an image?
* how can i backup/export my images?
* how cam i delete images?
* how can i clear the whole gallery?


