# Story long dialogue motion and choices

Restore the authored long-text-compress-portrait effect for standard story artwork. As visible text grows, expand the bottom-anchored dialogue upward within the stage. On mobile translate the portrait upward by the same growth, retaining its scale and stage clipping; desktop artwork stays fixed. Cap dialogue height and scroll excess text. Preserve ordinary nodes, typing speed, options and navigation.

Reserve option shadow and focus gutters inside the bounded scroller. Replace pink choices with warm paper and restrained character accents, including hover and pressed states. Validate real typing, long overflow and choices at desktop/390/360px; synchronize system design and Trellis layout contract. Inline workflow; no agents.

## Validation

136 focused component/style/document tests passed. Six browser cases passed across desktop, 390px and 360px: three real typing/motion cases and three reduced-motion layout/overflow/navigation/choice cases. Production build and built CSS contracts passed. Repository lint passed; expanded file lint matches 13 pre-existing findings with no additions. Reviewed desktop long text and both phone choices plus long text screenshots. CSS budget records the exact 1797-byte owner delta and one reduced-motion owner.
