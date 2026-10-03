# Loading Page Visual Assessment

## Scope and evidence

This is an assessment of the independent loading-page sample, not the production preload flow. The requested character, thinking cloud, circular connecting bubbles, bulb-shaped progress indicator, completion expression, Tip below the desk, and two-second completed hold remain the intended design.

Current sample evidence:

- [Desktop waiting at partial progress](01-waiting-desktop.png), 1440 × 900.
- [Mobile waiting at partial progress](02-waiting-mobile.png), 390 × 844.
- Mobile completion: **DOM-checked; screenshot unavailable**. The browser screenshot request timed out. No older completion image is substituted as current evidence.

[Campus reference](reference-campus.png) and [dialogue reference](reference-dialogue.png) are existing **design samples**, not screenshots of the running production interface. They provide illustration and composition references. The actual Bright School theme is also supported by [DESIGN.md](../../../../DESIGN.md) and [paper-root.css](../../../../src/styles/themes/bright-school/base/paper-root.css): warm paper, a subtle 20 px grid, dark brown ink, and restrained stationery accents. The visual distinction between these sources matters; the proposed direction should use the established theme without assuming every sample is implemented.

## Three-step health check

| Step | Current health | Assessment |
| --- | --- | --- |
| Desktop waiting | Functional composition; weak visual hierarchy | Character, thought connections, partial bulb fill, and Tip are visible. The large empty cloud takes priority over the character and has no Go content to explain the scene. |
| Mobile waiting | Fits the captured viewport; visually top-heavy | The page keeps the same story, but the empty cloud occupies a large part of the upper half. The character becomes secondary, and the Tip ends with an isolated short second line. |
| Completion | DOM-checked; screenshot unavailable | The inspected DOM reached 100%, selected `character-complete.png`, paused both cloud CSS animations, and reached completion state `ready`. The script holds the completed state for 2,000 ms. The intended smiling expression and full bulb support realization, but their final visual presentation was not verified in a new screenshot. Production navigation and real loading events were not tested. |

The concept is coherent. The main weakness is how the assets are composed and styled together, rather than the choice of character or loading metaphor.

## Findings

### 1. The blank thought cloud dominates the scene

**Priority: high.** Both waiting screenshots present the cloud as the largest simple, high-contrast shape. On mobile it receives substantial screen space while saying nothing about Go. This makes the page feel unfinished and biases any assessment of its proportions.

**Recommendation:** put a representative life-and-death diagram into the sample before judging the cloud size. Keep enough usable space for the puzzle, then tighten the cloud-to-character spacing. Avoid shrinking the puzzle simply to enlarge the character. The missing content and the surrounding composition should be assessed together.

### 2. The illustration does not yet feel like part of Bright School

**Priority: high.** The waiting screenshots use a largely plain background with a broad white radial wash. The campus and dialogue design samples establish warm paper, illustrated stationery, and deliberate framing. Production theme source likewise specifies paper and a quiet grid. The current page shares the warm base color but little of that material language.

**Recommendation:** use the established faint notebook grid and a restrained paper treatment. Let the existing character and desk remain the central illustration. A large new card, full wooden frame, or extra decorative objects would add weight without solving the hierarchy problem.

### 3. Outlines and animation frames look like separate asset systems

**Priority: medium.** The main cloud has a stronger contour than the thin, geometrically perfect connecting circles. The bulb has a different line texture. The two cloud assets also differ in contour color and thickness; the sample swaps them every 250 ms. Their broad soft edge treatment contrasts with the project's crisp ink vocabulary.

**Recommendation:** align the cloud frames, use one warm dark-ink color and consistent visible stroke weight, and remove broad edge haze. Keep the user-requested frame animation, but limit it to slight line variation around a stable silhouette. Keep the puzzle still. Circular connecting bubbles should remain circular while carrying a compatible hand-drawn outline.

### 4. The objects read as vertically stacked parts rather than one scene

**Priority: medium.** In both waiting screenshots the cloud, character, bulb, and Tip occupy distinct bands. The bulb sits beside the character but the large empty area above it does not contribute to the scene. The connecting bubbles establish meaning, yet their placement alone cannot create a balanced composition.

**Recommendation:** organize cloud, face, and bulb as one compact triangular group: thought above and slightly left, character as the focal point below, and a smaller bulb beside the head. Keep the connecting circles outside the painted character, the bulb rays separated from its crown, and the Tip below the desk. Give mobile its own spacing rather than matching desktop distances.

### 5. The Tip has an awkward mobile text rhythm

**Priority: medium.** The captured mobile Tip leaves only a short ending on its second line. Its full sentence uses the same hand-lettered face as accent text, making it visually decorative when it should be easy to read.

**Recommendation:** retain the exact copy. Use the project's UI font for the sentence and reserve the hand-lettered treatment for a small Tip label. Balance line wrapping and keep a deliberate gap below the desk. A heavy Tip panel is unnecessary.

## Recommended direction

Treat the scene as **a thinking illustration on a Go-club notebook page**. Start with a representative puzzle in the existing cloud, adopt the faint theme grid, unify the doodle outlines, and compact the three main objects. Preserve the approved character assets and all requested metaphors. Review the result at both desktop and portrait phone sizes before tuning the frame animation further.

## Accessibility risks and limits

- The source supplies a named progressbar with a numeric ARIA value, hides decorative connections from assistive technology, and uses a static character and cloud under `prefers-reduced-motion`. These are positive code-level provisions, not a screen-reader test result.
- The cloud frame changes can produce visible contour flicker. No quantitative flash measurement or photosensitive-user evaluation was performed. Unifying frame luminance and geometry would reduce needless visual disturbance.
- A completed face and yellow bulb should be accompanied by a clear accessible completion state when integrated. The current custom event and DOM dataset do not by themselves demonstrate that completion will be announced.
- The Tip is a polite live region and rotates while waiting. Announcement frequency and interruption behavior require testing with assistive technology.
- The supplied captures do not cover every viewport, text enlargement, high-contrast mode, or puzzle image. The completion state was checked in the DOM, but its screenshot could not be captured. No formal API loading, failed loading, retry flow, production transition, keyboard journey, or screen-reader behavior was tested in this visual assessment.

The next pass is a visual refinement of the sample. It should not be treated as approval to replace the production loading flow or change its behavior.

## Concept limits

The generated direction images explore composition, notebook paper, and the relationship between the cloud, character, and bulb. They are static concepts, not implemented pages or production assets. Visual review found the character and desk present, a board illustration inside the cloud, circular connections outside the character, a bulb beside the head, and a Tip below the desk, without obvious clipping or major copy errors.

Non-blocking differences remain: generated character details can vary from the approved sprite; the long Tip is still hand-lettered; top spacing, cloud emphasis, and grid visibility differ between concepts; and some images introduce tape, arrows, spare-stone sketches, marker strokes, or a separate paper note. Implementation should use the original character PNG and approved animation assets, preserve the official Tip text, and remove incidental extra decorations. Set final typography and responsive spacing in code instead of reproducing generated lettering or margins literally. The pictured stone arrangements illustrate the Go theme only; they are not validated life-and-death problems. None of these static images proves bulb-fill behavior, frame timing, blink frequency, the two-second completion hold, or accessibility behavior.
