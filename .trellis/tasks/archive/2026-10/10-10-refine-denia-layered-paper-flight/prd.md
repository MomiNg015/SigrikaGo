# Refine Denia layered paper flight

The user rejected the tiled, wall-like occlusion. Replace it with independently drifting, staggered papers at three depths: smaller muted distant pieces, a medium flowing body, and fewer large foreground pieces with visible folding/tumbling. Use curved trajectories and different speeds; keep negative space during entry/exit and converge only briefly around the existing 1750 ms portrait swap. Keep the approved persistence, 1000 ms entry, 2500 ms end, performance limits and reduced-motion branch. Review actual motion early, not only peak screenshots. No repeated full-screen texture or moving rectangular strips.

Validation: production desktop/mobile preview at several timestamps and live playback, frame-cost measurement, targeted particle/lifecycle tests, lint/build and updated system-design documentation. Preserve unrelated WIP.

Implementation: independent far/middle/near particles, cached depth sprites, curved trajectories and continuous perspective folding; no repeated textures. At 1440x900, 1552 particles with offscreen culling; measured CPU submission P95 3.4 ms and swap-frame coverage 83%. Four timestamps visually inspected. Existing persistence, timing, reduced-motion and cancellation behavior retained.
