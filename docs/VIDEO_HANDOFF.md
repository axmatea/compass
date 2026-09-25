# Acquisition video handoff

Priority: actual product walkthrough, not a new generated promo. The old film
depicts a different concept and is not evidence of this release's capabilities.

Deliver a 1920x1080, approximately 180-second H.264 MP4 recorded from the new
public guided tour. Keep synthetic and accelerated-time labels visible. Do not
imply this local fixture recording demonstrates live integrations or a server
restart. The separate stage script is ACQUISITION_PITCH.md.

The recording is a silent visual walkthrough intended for the two presenters'
live narration. No music, third-party footage, generated presenter or synthetic
voice is required; there are no audio licensing claims. Original UI/SVG assets
and local SIL-OFL Manrope are the only visuals.

The capture/render script must record actual browser interaction, retain its raw
recording, export with FFmpeg and verify duration, dimensions and successful
decoding. Store large outputs in ignored delivery/, not Git. Screenshots and a
JSON check report belong there too. Do not claim a rendered video until it exists.

No Higgsfield generation or DaVinci editing is necessary for this workflow; do
not claim either MCP was used. No spending or publishing is authorized here.

## First cut rendered

On 2026-09-25, `scripts/acquisition-record.mjs` produced
`delivery/COMPASS_Acquisition_Walkthrough_180s_1080p.mp4`: H.264, 1920x1080,
30 fps, exactly 180 seconds, silent. FFmpeg decoded the complete output without
errors. The source recording and metadata remain in ignored `delivery/`.
This is a local fixture walkthrough, not verified live sponsor footage.
