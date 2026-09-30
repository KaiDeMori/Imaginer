# Rock-solid metadata

The planning file of this task, as [Workflows_and_reviews.md](../Workflows_and_reviews.md) defines it.

## Goal

Every path through Imaginer treats metadata according to agreed rules, and code, config, and documentation match those rules.

## Plan

Linked words are terms from [misc/metadata_terms.md](../misc/metadata_terms.md), which also holds the agreed rules.

Today, each path handles metadata its own way:
- [Download](../misc/metadata_terms.md) can break palette PNGs or write the prompt twice.
- The [edit request](../misc/metadata_terms.md) sends private data such as GPS location and original filenames to OpenAI.
- Parts of the documentation contradict the code.

Core idea: [intake](../misc/metadata_terms.md) converts every image once into an upright RGBA PNG, so [Export](../misc/metadata_terms.md) and [edit request](../misc/metadata_terms.md) only remove or add PNG chunks.
Together, we compare the rules with today's code, one path at a time, in [misc/metadata_gap_analysis.md](../misc/metadata_gap_analysis.md); the differences become the steps.
Local browser tests settle the technical unknowns before code depends on them.
Open points are decided when a step needs them.

## Out of scope

- The gallery import button: a task of its own.
- Color spaces.

## Steps

Each step is an H3 that names its state: in discussion, planned, or built. Under it follow four H4 sections: Decisions, Facts, Open items, Out of scope. Once its plan exists, the step links its plan file.

No step is written yet. The first one comes from the Discussion.
