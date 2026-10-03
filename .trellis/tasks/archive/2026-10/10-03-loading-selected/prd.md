# Selected loading illustration

Implement the user's selected third displayed concept (`docs/design-samples/loading-page/review/concept-3.png`) in the existing standalone desktop and phone samples. Preserve the approved original character pixels, 1600ms blink loop, two hand-drawn cloud frames at 4fps, circular connections outside the sprite, rotated bulb-axis fill and separated crown marks, and 2000ms completed still hold. Reuse the project's faint paper grid and create matching individual cloud/circle/Tip brush raster assets.

New explicit requirement: changing Tip line count must only grow the Tip downward. Scene, character, cloud, connector and bulb document positions must remain identical before and after any short/long Tip at a fixed viewport. Avoid vertically centering the scene together with dynamic copy. Do not truncate long tips; allow vertical scrolling on compact screens.

Use a representative source-backed Go board image inside the cloud for the visual demo; retain local image selection. Compare the rendered 390×844 page to the selected image and verify desktop, compact mobile, progress states, completion reset, reduced motion and short/long Tip bounds. Update system design, sample docs, QA evidence and previews. Production preload integration remains outside this sample task.
