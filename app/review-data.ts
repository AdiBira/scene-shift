export type HumanVerdict = 'plausible' | 'discard';
export type ReviewStatus = HumanVerdict | 'pending';

export type ReviewObservation = {
  source: string;
  summary: string;
  artifactUrl: string;
  qualification?: string;
};

export type ReviewWorld = {
  id: string;
  title: string;
  url: string;
  poster?: string;
  status: ReviewStatus;
  observation: ReviewObservation;
};

export const appearanceWorlds: ReviewWorld[] = [
  {
    id: 'orange-opacity-repair',
    title: 'Orange arms - repair',
    url: '/media/showcase/orange-opaque-repair.mp4',
    poster: '/media/worlds/orange-poster.jpg',
    status: 'pending',
    observation: {
      source: 'Final selection catalog',
      summary: 'Promising, but still awaiting final full-playback review.',
      artifactUrl: '/review-artifacts/selection-catalog.json',
      qualification: 'The raw output has a detected source-order reset.',
    },
  },
  {
    id: 'safety-orange',
    title: 'Safety orange arms',
    url: '/media/showcase/orange.mp4',
    poster: '/media/worlds/orange-poster.jpg',
    status: 'discard',
    observation: {
      source: 'Manual playback observation',
      summary: 'The extending right-arm shell becomes transparent during playback.',
      artifactUrl: '/review-artifacts/manual-playback-observations.json',
    },
  },
  {
    id: 'cobalt-blue',
    title: 'Cobalt blue arms',
    url: '/media/showcase/blue.mp4',
    poster: '/media/worlds/cobalt-blue-poster.jpg',
    status: 'discard',
    observation: {
      source: 'Manual playback observation',
      summary: 'The extending right-arm shell becomes transparent or disappears during playback.',
      artifactUrl: '/review-artifacts/manual-playback-observations.json',
    },
  },
  {
    id: 'signal-yellow',
    title: 'Signal yellow arms',
    url: '/media/showcase/yellow.mp4',
    poster: '/media/worlds/signal-yellow-poster.jpg',
    status: 'discard',
    observation: {
      source: 'Focused frame review',
      summary: 'The recolor is incomplete on the right arm.',
      artifactUrl: '/review-artifacts/signal-yellow.json',
    },
  },
  {
    id: 'graphite-black',
    title: 'Graphite black arms',
    url: '/media/showcase/graphite.mp4',
    poster: '/media/worlds/graphite-black-poster.jpg',
    status: 'discard',
    observation: {
      source: 'Manual playback observation',
      summary: 'The extending right-arm shell becomes transparent or disappears during playback.',
      artifactUrl: '/review-artifacts/manual-playback-observations.json',
    },
  },
];

export const backgroundWorlds: ReviewWorld[] = [
  {
    id: 'blue-safety-panels',
    title: 'Blue safety-panel walls',
    url: '/media/showcase/walls-blue-panels-3s.mp4',
    status: 'plausible',
    observation: {
      source: 'Recorded human review',
      summary: 'The blue polycarbonate background is visually acceptable.',
      artifactUrl: '/review-artifacts/blue-panels-human-review.json',
      qualification: 'The source raw has a detected source-order reset and is not eligible as a training candidate.',
    },
  },
  {
    id: 'safety-mesh-walls',
    title: 'Dark safety-mesh walls',
    url: '/media/showcase/walls-safety-mesh-3s.mp4',
    status: 'pending',
    observation: {
      source: 'Final selection catalog',
      summary: 'Review required.',
      artifactUrl: '/review-artifacts/selection-catalog.json',
      qualification: 'The source raw has a detected source-order reset.',
    },
  },
  {
    id: 'clean-lab-b',
    title: 'Light-gray lab walls',
    url: '/media/showcase/clean-lab-b.mp4',
    status: 'discard',
    observation: {
      source: 'Manual playback observation',
      summary: 'Block drift and table artifacts are visible during playback.',
      artifactUrl: '/review-artifacts/manual-playback-observations.json',
    },
  },
];

export const tableWorlds: ReviewWorld[] = [
  {
    id: 'brushed-steel-table',
    title: 'Brushed-steel table',
    url: '/media/showcase/table-brushed-steel-3s.mp4',
    status: 'plausible',
    observation: {
      source: 'Recorded human review',
      summary: 'The table is visually acceptable but similar to an existing table variant.',
      artifactUrl: '/review-artifacts/brushed-steel-human-review.json',
      qualification: 'The stored review marks it ineligible as a training candidate.',
    },
  },
  {
    id: 'navy-esd-table-b',
    title: 'Navy-blue table',
    url: '/media/showcase/navy-esd-table-b.mp4',
    status: 'discard',
    observation: {
      source: 'Manual playback observation',
      summary: 'Motion and object-state drift are visible during playback.',
      artifactUrl: '/review-artifacts/manual-playback-observations.json',
    },
  },
  {
    id: 'walnut-table',
    title: 'Walnut table',
    url: '/media/showcase/table-walnut-failure-3s.mp4',
    status: 'discard',
    observation: {
      source: 'Catalog status',
      summary: 'Discarded after visual review.',
      artifactUrl: '/review-artifacts/walnut-review.json',
    },
  },
];

export const reviewWorlds = [...appearanceWorlds, ...backgroundWorlds, ...tableWorlds];
