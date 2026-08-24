# Scene Shift

[Open the live demo](https://scene-shift.vercel.app)

Scene Shift is a frontend prototype for generating and reviewing controlled robot-video variations, from robot appearance and work surfaces to scenery, objects, and task changes. The goal is to explore whether plausible synthetic variants of real-world robot data can help scale model pretraining, with human review before any stronger use claim.

This demo starts with one real 12-second dual-arm manipulation clip, shows X2 generations made through Reactor beside their source, and keeps VLM results, recorded observations, and user-entered reviews distinct.

![Scene Shift prototype comparison view](public/screenshot.png)

*Prototype comparison view showing the real source beside controlled visual variations.*

## What the demo shows

- One source clip grouped with multiple generated outputs
- Arm appearance, background wall, and table surface variations
- Dedicated comparison pages with the original and generated clips side by side
- Shared play, pause, and seek controls for visual comparison
- One offline `gpt-5.6-luna` VLM review for every displayed output
- 48 paired source-output timestamps for 12-second clips and 12 for 3-second clips, each shown as full-frame, robot-gripper, and block-work-surface views
- Timestamped observations, exact prompts, input hashes, and raw JSON artifacts
- No model confidence scores
- Browser-local human `ACCEPTED` or `DISCARD` decisions kept separate from VLM results
- Human decisions and comments stored in the browser
- An optional in-app Reactor X2 generation flow

## Evidence boundaries

All generated results are RGB video candidates. `PLAUSIBLE` and `ACCEPTED` mean visually plausible relative to the source and requested variation. They do not establish physics correctness, telemetry alignment, executable robot actions, or training readiness.

This public repository contains the demo frontend, browser-ready showcase media, catalog observations, complete VLM review artifacts, and a minimal server-side token route for optional live generation. The fixed multi-view VLM review agreed with 5 of 9 existing manual labels in this small showcase set, so its verdict remains advisory. This is not a calibrated benchmark or model confidence score. The exact review protocol is stored in [`public/review-artifacts/vlm/protocol.json`](public/review-artifacts/vlm/protocol.json).

The repository excludes API credentials, private experiment archives, raw generation archives, and robot-data validation backends.

## Included review set and initial decisions

- Source: `original.mp4`
- Visual keeps: blue safety-panel walls and brushed-steel table
- Pending review: orange opacity repair and dark safety-mesh walls
- Discards: original orange, cobalt blue, signal yellow, graphite, light-gray lab walls, navy table, and walnut table

The discard reasons include transparent arm shells, incomplete recoloring, block or object drift, table artifacts, motion drift, and multiplied blocks.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server. The included showcase and review flow work without API credentials.

To enable the optional `Generate variations` flow, set a Reactor API key on the server:

```bash
REACTOR_API_KEY=your_key npm run dev
```

The key remains server-side. The token route exchanges it for a single-session JWT, and the browser receives the generated stream over WebRTC.

## Validate

```bash
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## Re-run the VLM review

The stored reviews were produced by [`scripts/review_showcase_vlm.py`](scripts/review_showcase_vlm.py). It requires `ffmpeg`, an authenticated Codex CLI, and the Python packages in `requirements-vlm.txt`.

```bash
python3 -m pip install -r requirements-vlm.txt
python3 scripts/review_showcase_vlm.py
```

The script uses the fixed public prompt and schema, rebuilds three paired views at each timestamp, stores one structured review per output, and rewrites the public artifacts. Running it makes 11 VLM calls.

## Data and model attribution

- Source robot clip: [XDOF ABC-130K](https://huggingface.co/datasets/XDOF/ABC-130k)
- Video generation: [X2 through Reactor](https://www.reactor.inc/models/x2/api)
- Visual review: `gpt-5.6-luna` over paired source-output frame sheets

## Status

Scene Shift is a hackathon prototype, not a deployed service. No open-source license is included, so public access to this repository does not grant reuse rights beyond applicable law or separately licensed source assets.
