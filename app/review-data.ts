export type HumanVerdict = 'plausible' | 'discard';
export type ReviewStatus = HumanVerdict | 'pending';

export type RecordedReview = {
  source: string;
  status: ReviewStatus;
  summary: string;
  qualification?: string;
};

export type ReviewWorld = {
  id: string;
  title: string;
  url: string;
  poster?: string;
  status: ReviewStatus;
  recordedReview: RecordedReview;
};

export const appearanceWorlds: ReviewWorld[] = [
  {
    id: 'orange-opacity-repair',
    title: 'Orange arms - repair',
    url: '/media/showcase/orange-opaque-repair.mp4',
    poster: '/media/worlds/orange-poster.jpg',
    status: 'pending',
    recordedReview: {
      source: 'Human review status',
      status: 'pending',
      summary: 'Dense sampled-frame review found no shell dropout, but final full-playback sign-off is still required.',
      qualification: 'The 12-second raw remains source-order-reset flagged and is a visual candidate only.',
    },
  },
  {
    id: 'safety-orange',
    title: 'Safety orange arms',
    url: '/media/showcase/orange.mp4',
    poster: '/media/worlds/orange-poster.jpg',
    status: 'discard',
    recordedReview: {
      source: 'Recorded human review',
      status: 'discard',
      summary: 'The extending right-arm shell becomes transparent during playback.',
    },
  },
  {
    id: 'cobalt-blue',
    title: 'Cobalt blue arms',
    url: '/media/showcase/blue.mp4',
    poster: '/media/worlds/cobalt-blue-poster.jpg',
    status: 'discard',
    recordedReview: {
      source: 'Recorded human review',
      status: 'discard',
      summary: 'The extending right-arm shell becomes transparent or disappears during playback.',
      qualification: 'The earlier sparse VLM keep is retained as a false negative.',
    },
  },
  {
    id: 'signal-yellow',
    title: 'Signal yellow arms',
    url: '/media/showcase/yellow.mp4',
    poster: '/media/worlds/signal-yellow-poster.jpg',
    status: 'discard',
    recordedReview: {
      source: 'Recorded human review',
      status: 'discard',
      summary: 'The shell recolor is incomplete and the extending right arm loses structural consistency.',
    },
  },
  {
    id: 'graphite-black',
    title: 'Graphite black arms',
    url: '/media/showcase/graphite.mp4',
    poster: '/media/worlds/graphite-black-poster.jpg',
    status: 'discard',
    recordedReview: {
      source: 'Recorded human review',
      status: 'discard',
      summary: 'The extending right-arm shell becomes transparent or disappears during playback.',
      qualification: 'The earlier sparse VLM keep is retained as a false negative.',
    },
  },
];

export const backgroundWorlds: ReviewWorld[] = [
  {
    id: 'blue-safety-panels',
    title: 'Blue safety-panel walls',
    url: '/media/showcase/walls-blue-panels-3s.mp4',
    status: 'plausible',
    recordedReview: {
      source: 'Recorded human review',
      status: 'plausible',
      summary: 'The blue polycarbonate background is visually acceptable.',
      qualification: 'This selected 3-second clip comes from a 12-second raw output with a detected source-order reset.',
    },
  },
  {
    id: 'safety-mesh-walls',
    title: 'Dark safety-mesh walls',
    url: '/media/showcase/walls-safety-mesh-3s.mp4',
    status: 'pending',
    recordedReview: {
      source: 'Review status',
      status: 'pending',
      summary: 'The requested wall change is visible, but no completed human or VLM verdict is attached yet.',
      qualification: 'Shown as an unreviewed visual candidate, not an accepted result.',
    },
  },
  {
    id: 'clean-lab-b',
    title: 'Light-gray lab walls',
    url: '/media/showcase/clean-lab-b.mp4',
    status: 'discard',
    recordedReview: {
      source: 'Recorded human review',
      status: 'discard',
      summary: 'The human reviewer found block drift and table artifacts.',
      qualification: 'The precomputed VLM marked it plausible, creating a model-human disagreement.',
    },
  },
];

export const tableWorlds: ReviewWorld[] = [
  {
    id: 'brushed-steel-table',
    title: 'Brushed-steel table',
    url: '/media/showcase/table-brushed-steel-3s.mp4',
    status: 'plausible',
    recordedReview: {
      source: 'Recorded human review',
      status: 'plausible',
      summary: 'The table is visually acceptable, though similar to an existing table variant.',
      qualification: 'This is a visual keep only.',
    },
  },
  {
    id: 'navy-esd-table-b',
    title: 'Navy-blue table',
    url: '/media/showcase/navy-esd-table-b.mp4',
    status: 'discard',
    recordedReview: {
      source: 'Recorded human review',
      status: 'discard',
      summary: 'The human reviewer found motion and object-state drift.',
      qualification: 'The precomputed VLM marked it plausible, creating a model-human disagreement.',
    },
  },
  {
    id: 'walnut-table',
    title: 'Walnut table',
    url: '/media/showcase/table-walnut-failure-3s.mp4',
    status: 'discard',
    recordedReview: {
      source: 'Recorded Codex VLM review',
      status: 'discard',
      summary: 'The walnut transformation is visible, but the output multiplies wooden blocks and changes task state.',
    },
  },
];

export const reviewWorlds = [...appearanceWorlds, ...backgroundWorlds, ...tableWorlds];
