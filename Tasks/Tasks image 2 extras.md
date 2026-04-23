# The Goal
Support the new gpt-image-2 capabilities.

# Size
The most important new capability is the free size (resolution) parameter. Former models had only 3 fixed sizes, but gpt-image-2 supports any size that meets the constraints. 
See "API_DOCS/gpt-image-2 API capabilities.md" for details on the constraints and popular sizes.

# Imaginer integration
How do we integrate this into Imaginer?
- Keep the current simple 3 options images (Portrait, Landscape, Square) as default presentation.
- Add a new option in the config "Advanced size setting". This will remove our 3 default options and show a dropdown instead.
- The dropdown is pre-populated with the popular sizes from the gpt-image-2 API capabilities doc.
- It has an option for "Custom size" that opens a modal where the user can input any size that meets the constraints. We can validate the input in the modal before allowing submission.
- We have to persist custom sizes that were entered by the user in localStorage.

Understand our current codebase, ask good questions and go through important decisions with the user until everything is clear.

# Plan and Implement the changes
- Plan the changes based on the decision of the previous chapter.
- Implement the changes based on the plan.
  

