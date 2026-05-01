the update on version increase still does not work reliably. users have all kinds of problems and the only way to actually update all resources is to have the browser console open, cache disabeld **and** using hard reload.

Thats not great, and we need to do something about it.
I think the cleanest and most reliable way we can have is to maintain an extra json that contains a list of all updatable files. we grab that json, and send a really "cache cleaning" request for that resource. of course we ignore the result actual result, since now the new version is in the cache.
Ideally, we would do this after the user OKed the version update message. we dont close the update message immedately and also dont redirect instantly, but first send all those requests and actually wait for them to "OK". (if anything goes wrong, we show just an error for now and commence).
We have to inform the user of course "Refreshing cache…" and after we got all, we can finally close the message and intitate the refresh.

Additionally, we need a button in the config UI "Refresh Cache" that triggers the same flow.

What do you think? read the code, understand the current "version update hack" and plan the implementation.

# Lock-In decisions
Search the web and find common approaches to cache busting. Make suggestions.
Guide the user through the decisions using the askQuestions tool. ask questions and find out what they want.

# Cleanup
make a list of old version update "refresh" code. remove it.

# "chache busting"
search online for approaches, make a list, output it in chat and use the askQuestions tool to find out what the user prefers (give explanations and your preference)

# plan and implementation
clear the todo list.
plan the implementation and divide the task into manageable steps.
add a todo list item for each step.
implement each step.



