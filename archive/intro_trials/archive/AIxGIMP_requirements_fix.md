# AIxGIMP Requirements: Incremental & Flexible Workflow Support

## Background
The original AIxGIMP automation documentation assumes a batch, one-pass workflow for image plate stacking and editing. However, real creative workflows often require incremental addition of new layers, re-alignment, and re-masking after initial export. This document outlines the requirements and recommendations to support such iterative, flexible workflows.

---

## Requirements for Incremental Workflow


1. **Support Adding New Layers at Any Time**
   - Users must be able to add new image plates (layers) to an existing stack, even after previous alignment, masking, and export steps have been completed.
   - The workflow and scripts must not assume the stack is fixed after initial setup.

2. **Minimal Adjustment When Adding Layers**
   - When a new (deeper) layer is added, only the new image and the mask on the layer directly above it typically need to be updated.
   - There is no need to re-align or re-mask the upper layers unless the addition reveals a problem or further creative changes are desired.
   - Documentation and scripts should clarify this minimal workflow to avoid unnecessary work.

3. **Flexible Import, Alignment, and Export**
   - The workflow should allow for importing, aligning, and exporting layers as needed, without requiring changes to the whole stack.
   - Scripts should be idempotent and able to operate on partially completed stacks.

4. **Documentation Updates**
   - The main documentation should explicitly describe how to incrementally add layers, align the new image, and adjust only the mask on the layer above.
   - Add a troubleshooting section for common issues when modifying an existing stack.

---


## Recommended Workflow for Incremental Layer Addition

1. Open the latest XCF file containing your current stack.
2. Import the new image as a new bottom layer.
3. Upscale and align the new layer to match the pivot/feature of the layer above.
4. Adjust the mask on the layer directly above to reveal the new layer as needed.
5. Optionally, review the stack visually to confirm everything looks correct. There is no need to re-align or re-mask upper layers unless you want to make further creative changes.
6. Export the updated stack as needed.

---

## Task List for Documentation & Script Update

- [ ] Update main documentation to describe incremental layer addition and flexible workflows.
- [ ] Add a section on re-checking alignment and masks when the stack changes.
- [ ] Ensure scripts do not assume a fixed stack and can operate on partially completed projects.
- [ ] Add troubleshooting tips for iterative workflows.
- [ ] Review and test the workflow with incremental layer addition.

---

## Notes
- This change is essential for real-world creative flexibility and collaboration.
- All future scripts and documentation should be reviewed for compliance with these requirements.
