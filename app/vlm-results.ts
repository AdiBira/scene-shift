export type VlmResult = {
  model: string;
  verdict: 'plausible' | 'discard' | 'uncertain';
  summary: string;
  sampleCount: number;
  artifactUrl: string;
};

export const vlmResults: Record<string, VlmResult> = {
  "orange-opacity-repair": {
    "model": "gpt-5.6-luna",
    "verdict": "plausible",
    "summary": "Both generated robot-arm shells appear opaque safety orange throughout the sampled sequence. The robots, grippers, blocks, work surface, and broad manipulation sequence remain visibly consistent with the source.",
    "sampleCount": 48,
    "artifactUrl": "/review-artifacts/vlm/orange-opacity-repair.json"
  },
  "safety-orange": {
    "model": "gpt-5.6-luna",
    "verdict": "discard",
    "summary": "The manipulation scene and robot motion are preserved, but the requested edit fails: generated frames show one safety-orange arm shell and one white shell rather than both shells being safety orange.",
    "sampleCount": 48,
    "artifactUrl": "/review-artifacts/vlm/safety-orange.json"
  },
  "cobalt-blue": {
    "model": "gpt-5.6-luna",
    "verdict": "discard",
    "summary": "The generated sequence preserves the two-arm tabletop manipulation scene and keeps the robot geometry, grippers, blocks, and work surface visually coherent. However, only one robot-arm shell is visibly cobalt blue; the other remains white across the sampled generated frames.",
    "sampleCount": 48,
    "artifactUrl": "/review-artifacts/vlm/cobalt-blue.json"
  },
  "signal-yellow": {
    "model": "gpt-5.6-luna",
    "verdict": "discard",
    "summary": "The generated sequence preserves the scene, robots, grippers, blocks, and sampled motion, but the requested recolor is incomplete: the two arm shells appear color-swapped rather than both signal yellow.",
    "sampleCount": 48,
    "artifactUrl": "/review-artifacts/vlm/signal-yellow.json"
  },
  "graphite-black": {
    "model": "gpt-5.6-luna",
    "verdict": "uncertain",
    "summary": "Both robot-arm shells are visibly graphite black across the sampled generated frames. The scene, robots, grippers, blocks, and broad manipulation event remain preserved. Exact gripper-block contact is not fully resolved in the supplied views.",
    "sampleCount": 48,
    "artifactUrl": "/review-artifacts/vlm/graphite-black.json"
  },
  "blue-safety-panels": {
    "model": "gpt-5.6-luna",
    "verdict": "uncertain",
    "summary": "The generated sequence visibly changes the enclosure walls to blue safety panels while preserving the robot, grippers, blocks, work surface, and broad manipulation scene. No critical sampled-frame defects are visible; gripper-block contact is not clearly resolved.",
    "sampleCount": 12,
    "artifactUrl": "/review-artifacts/vlm/blue-safety-panels.json"
  },
  "safety-mesh-walls": {
    "model": "gpt-5.6-luna",
    "verdict": "plausible",
    "summary": "The generated sequence consistently changes the enclosure walls to dark safety mesh while preserving the visible two-arm robot manipulation scene. No sampled frame shows a critical visual defect.",
    "sampleCount": 12,
    "artifactUrl": "/review-artifacts/vlm/safety-mesh-walls.json"
  },
  "clean-lab-b": {
    "model": "gpt-5.6-luna",
    "verdict": "discard",
    "summary": "The generated sequence consistently changes the walls to light gray and preserves the two-arm manipulation scene, but it also changes the work surface from the source surface to blue, which is an unrelated scene change under the requested edit.",
    "sampleCount": 48,
    "artifactUrl": "/review-artifacts/vlm/clean-lab-b.json"
  },
  "brushed-steel-table": {
    "model": "gpt-5.6-luna",
    "verdict": "discard",
    "summary": "The robot, grippers, blocks, and manipulation scene remain visually coherent, but the generated tabletop does not show a clearly visible brushed-steel material change.",
    "sampleCount": 12,
    "artifactUrl": "/review-artifacts/vlm/brushed-steel-table.json"
  },
  "navy-esd-table-b": {
    "model": "gpt-5.6-luna",
    "verdict": "plausible",
    "summary": "The generated sequence consistently changes the work surface from white to navy blue while preserving the robot setup, blocks, grippers, and broad manipulation event. No critical visible defects are present in the sampled RGB frames.",
    "sampleCount": 48,
    "artifactUrl": "/review-artifacts/vlm/navy-esd-table-b.json"
  },
  "walnut-table": {
    "model": "gpt-5.6-luna",
    "verdict": "discard",
    "summary": "The walnut tabletop edit is visible and temporally stable, but the generated frames introduce extra or altered blocks relative to the source. Overall result: DISCARD.",
    "sampleCount": 12,
    "artifactUrl": "/review-artifacts/vlm/walnut-table.json"
  }
};
