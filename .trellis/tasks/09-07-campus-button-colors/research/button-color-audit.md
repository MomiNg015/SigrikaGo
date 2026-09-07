# Button color audit

| Surface | Finding | Decision |
| --- | --- | --- |
| Home header and phone menu | Most controls inherit the same paper/pink hover; content and system actions have little color distinction. | Blue content entries, paper system controls, muted red logout; existing artwork untouched. |
| Settings, friends, ranking, achievements and announcement tabs | Selected and hovered controls share primary pink. | Blue selected tabs and light blue hover, with existing pressed depth retained. |
| Ordinary modal actions | Shared primary/secondary/danger classes already encode action meaning. | Reuse these classes: pink confirm, paper secondary, rose danger. |
| Mailbox | Claim/delete already have dedicated classes. | Mint claim, rose delete; leave attachment tiles and readers unchanged. |
| Gameplay and replay | Pass/count/draw/resign are separate actions; skills have their own active/spent effects. | Paper pass, blue count/replay, mint draw, rose resign. Exclude skill and tutorial choices. |
| Handbook | User preferred original layout and flag. | Only ordinary close/secondary controls participate; card, flag and selected state stay intact. |
| Profile dossier | Existing achievement/personalization/replay actions already use deliberate pink/blue/mint roles. | Preserve owner colors and geometry. |
| Shops/recruitment/IRIS | Image buttons and feature-specific purchase/selected colors have deliberate asset or theme ownership. | Preserve these owners. |
| Admin | Dedicated blue primary/secondary and red danger controls already exist in admin/polish/forms-actions.css. | Preserve admin colors; player palette is isolated. |
| Corruption and special duel | Separate scenes have their own control language. | Explicit root/room/confirm exclusions. |

Implementation uses two focused color-only owners at the end of the existing QA theme entry. Rendering checks compare geometry, button copy and shape before/after using actual components. Special-control comparisons remove only these new rules in the preview and check that computed appearance is unchanged.
