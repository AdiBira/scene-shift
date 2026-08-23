export type VlmReview = {
  verdict: 'plausible' | 'discard';
  confidence: number;
  summary: string;
  reasons: string[];
};

export const vlmReviews: Record<string, VlmReview> = {
  'real-source': {
    verdict: 'plausible',
    confidence: 0.99,
    summary: 'The reference clip remains visually coherent across the sampled sequence.',
    reasons: [
      'Both robot arms remain recognizable throughout the clip.',
      'The blocks and workcell stay visually consistent across sampled frames.',
      'This verdict describes visible continuity only, not task or telemetry validity.',
    ],
  },
  'orange-opacity-repair': {
    verdict: 'plausible',
    confidence: 0.84,
    summary: 'Dense sampled-frame review found the orange shells continuous through extension.',
    reasons: [
      'The review covered 144 frames sampled at 12 fps across the complete 12-second output.',
      'Both orange arm shells remain visibly solid through the extended poses in those samples.',
      'Full-speed human playback is still required because sampled frames can miss transient failures.',
    ],
  },
  'safety-orange': {
    verdict: 'discard',
    confidence: 0.96,
    summary: 'The extending right-arm shell becomes transparent during playback.',
    reasons: [
      'The right-arm housing loses opacity as the arm extends.',
      'The failure changes robot appearance beyond the requested recolor.',
      'The output is not a visually consistent variation of the source.',
    ],
  },
  'cobalt-blue': {
    verdict: 'plausible',
    confidence: 0.94,
    summary: 'The blue treatment is consistently visible on both arm housings.',
    reasons: [
      'Both arms receive the requested cobalt-blue appearance across sampled frames.',
      'The grippers, blocks, and workcell remain recognizable.',
      'No obvious arm-shape collapse or added object appears in the sampled sequence.',
    ],
  },
  'signal-yellow': {
    verdict: 'discard',
    confidence: 0.98,
    summary: 'The requested recolor is incomplete on the right arm.',
    reasons: [
      'A large right-arm housing remains white across multiple sampled frames.',
      'The left arm and parts of the right arm are yellow, making the mismatch conspicuous.',
      'The output does not consistently apply the requested appearance change.',
    ],
  },
  'graphite-black': {
    verdict: 'plausible',
    confidence: 0.9,
    summary: 'The graphite treatment is consistently visible on both arms.',
    reasons: [
      'Both arm housings remain dark across sampled frames.',
      'The blocks and workcell remain recognizable through the sequence.',
      'Dark parts lose some edge contrast, but no clear visual failure is exposed.',
    ],
  },
  'static-estop': {
    verdict: 'plausible',
    confidence: 0.99,
    summary: 'The added safety button stays fixed while the source sequence continues.',
    reasons: [
      'The red button remains in the same upper-left location across sampled frames.',
      'Its size and appearance stay visually stable.',
      'This evaluates the compiled visual result, not whether the object is physically present.',
    ],
  },
  'clean-lab-b': {
    verdict: 'plausible',
    confidence: 0.88,
    summary: 'The automated visual review found the clean-lab transformation plausible.',
    reasons: [
      'The requested scene change is visible in the generated sequence.',
      'Robot geometry and block identity passed the sampled-frame review.',
      'No obvious artifact was flagged, though a human reviewer may catch temporal drift.',
    ],
  },
  'navy-esd-table-b': {
    verdict: 'plausible',
    confidence: 0.87,
    summary: 'The automated visual review found the navy-surface transformation plausible.',
    reasons: [
      'The requested surface change is visible in the generated sequence.',
      'Robot geometry and block identity passed the sampled-frame review.',
      'No obvious artifact was flagged, though a human reviewer may catch temporal drift.',
    ],
  },
  'purple-failure': {
    verdict: 'discard',
    confidence: 0.99,
    summary: 'Large duplicate purple objects appear outside the work surface.',
    reasons: [
      'Oversized purple geometry appears on the back and side walls in multiple frames.',
      'The duplicated objects float without a plausible support surface.',
      'Their sudden appearance and disappearance break scene and object continuity.',
    ],
  },
};
