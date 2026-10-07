# Character selection student ID

Source: public/assets/home/student-id-hanging.webp
Output: public/assets/home/character-selection-id.png
Method: built-in image_gen edit, transparent background. Original remains unchanged.

Prompt: Carefully edit the supplied original hand-painted student ID. Remove the entire upper hanging hook, ring, clasp and metal clip. Preserve gouache paper texture, thin uneven ink outlines, corner metal rivets and geometric ornament. Produce one front-facing vertical frame with a transparent portrait opening, blank lower name area and blank upper-left faction badge. No character, text or invented logos. Convert accent ornament pigments to neutral gray for live character palette tinting. Outside the card remains transparent.

Runtime: MatchCharacterCardContent overlays actual bust, actual name and original faction emblem. A masked CSS color blend tints only the frame using character.palette. No character art is regenerated.

## Revised composition (v2, active)

Output: public/assets/home/character-selection-id-v2.png
Method: built-in image_gen edit of the first frame, transparent background.

Prompt: Carefully improve the specific hand-painted student-ID frame. Preserve its original watercolor/gouache paper texture, warm ivory paper, thin uneven brown contour and small metal corner rivets. Remove the oversized ornamental side column and oversized circular ornament. Make the transparent portrait opening large and centered, roughly 80% of card width, beneath a narrow header with one small blank upper-left faction badge. Place a generous blank centered name footer below the portrait, without an outlined input-style box. Keep side/corner geometry restrained and gray for character palette tinting. No text, character, invented logo, hook, ring, clasp or clip. Front-facing 3:4 card, tightly fitted canvas with minimal empty margins.

Runtime refinement: the live portrait sits behind the frame with an explicitly filled crop; frame tint strength is reduced to 0.35; actual faction emblem alpha is calibrated in an SVG filter without changing the source logo; the name is centered in a roomy 20px footer.
