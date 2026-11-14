# Gameplay UI artwork

The gameplay controls use the original user-provided
`/references/Terracotta_Cartoon_Game_UI_Asset_Sheet.png` (1448 × 1086).
The four journal, sound, camera and pause icons are displayed as CSS sprites.
Their source origins are approximately (785, 70), (947.5, 70),
(1097.5, 70) and (1252.5, 70), at 0.4 scale for the desktop buttons.

The objective frame uses an SVG viewBox of `30 18 712 254`.
The compass frame uses `992 818 420 214`. SVG framing displays the original
image region directly and allows the live text to remain accessible.

The layout follows `/references/PlaceholderControls.png`, using the warm
terracotta palette requested by the user. The source references are unchanged;
there are no new generated images, downloads, or UI dependencies.

The pause menu's existing lossless crop is documented in `pause/README.md`.

Controls are available from Pause > Controls. After the introductory tutorial,
a short dismissible reminder appears once; there is no permanent controls bar.
