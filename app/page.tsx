'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GeneratedVariation, LiveGenerator } from './live-generator';
import { vlmReviews } from './vlm-reviews';

type HumanVerdict = 'plausible' | 'discard';
type ReviewStatus = HumanVerdict | 'pending';

type HumanReview = {
  verdict: HumanVerdict | null;
  comment: string;
};

type RecordedReview = {
  source: string;
  status: ReviewStatus;
  summary: string;
  qualification?: string;
};

type LiveWorld = {
  id: string;
  title: string;
  url: string;
  status: 'pending';
  recordedReview: RecordedReview;
};

const appearanceWorlds = [
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
    } satisfies RecordedReview,
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
    } satisfies RecordedReview,
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
      qualification: 'The earlier sparse VLM keep is retained below as a false negative.',
    } satisfies RecordedReview,
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
    } satisfies RecordedReview,
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
      qualification: 'The earlier sparse VLM keep is retained below as a false negative.',
    } satisfies RecordedReview,
  },
];

const backgroundWorlds = [
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
    } satisfies RecordedReview,
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
    } satisfies RecordedReview,
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
    } satisfies RecordedReview,
  },
];

const tableWorlds = [
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
    } satisfies RecordedReview,
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
    } satisfies RecordedReview,
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
    } satisfies RecordedReview,
  },
];

function RecordedReviewPanel({ review, verdict }: { review: RecordedReview; verdict?: HumanVerdict }) {
  const status = verdict ?? review.status;
  const label = status === 'plausible' ? 'ACCEPTED' : status === 'discard' ? 'DISCARD' : 'PENDING';

  return (
    <section className={`recorded-review recorded-${status}`}>
      <header><span>{verdict ? 'Final human verdict' : review.source}</span><strong>{label}</strong></header>
      {!verdict && <p>{review.summary}</p>}
      {!verdict && review.qualification && <small>{review.qualification}</small>}
    </section>
  );
}

function VlmReview({ expanded = false, onVerdict, worldId }: {
  expanded?: boolean;
  onVerdict: (worldId: string, verdict: HumanVerdict) => void;
  worldId: string;
}) {
  const review = vlmReviews[worldId];
  const storageKey = `scene-shift-human-review-${worldId}`;
  const [human, setHuman] = useState<HumanReview>({ verdict: null, comment: '' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const restore = window.setTimeout(() => {
      if (saved) {
        const restored = JSON.parse(saved) as HumanReview;
        setHuman(restored);
        if (restored.verdict) onVerdict(worldId, restored.verdict);
      }
      setLoaded(true);
    });
    return () => window.clearTimeout(restore);
  }, [onVerdict, storageKey, worldId]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(human));
  }, [human, loaded, storageKey]);

  if (!review) return null;

  const agrees = human.verdict === review.verdict;
  const confidence = Math.round(review.confidence * 100);

  function chooseVerdict(verdict: HumanVerdict) {
    setHuman({ ...human, verdict });
    onVerdict(worldId, verdict);
  }

  return (
    <details className={`vlm-review vlm-${review.verdict}`} open={expanded || undefined}>
      <summary>
        <span>Precomputed VLM</span>
        <strong>{review.verdict === 'plausible' ? 'PLAUSIBLE' : 'DISCARD'}</strong>
        <small>{confidence}% confidence</small>
      </summary>
      <div className="vlm-review-body">
        <p>{review.summary}</p>
        <div className="human-review">
          <div>
            <span>Final decision</span>
            {human.verdict && (
              <b className={agrees ? 'human-agree' : 'human-override'}>
                {agrees ? (human.verdict === 'plausible' ? 'Accepted' : 'Discarded') : 'Overrides VLM'}
              </b>
            )}
          </div>
          <div className="human-verdicts" role="group" aria-label="Final human decision">
            <button
              className={human.verdict === 'plausible' ? 'selected plausible' : ''}
              onClick={() => chooseVerdict('plausible')}
              type="button"
            >
              Accept
            </button>
            <button
              className={human.verdict === 'discard' ? 'selected discard' : ''}
              onClick={() => chooseVerdict('discard')}
              type="button"
            >
              Discard
            </button>
          </div>
          <textarea
            aria-label="Review note"
            onChange={(event) => setHuman({ ...human, comment: event.target.value })}
            placeholder="Optional note"
            value={human.comment}
          />
        </div>
      </div>
    </details>
  );
}

export default function Home() {
  const [liveWorlds, setLiveWorlds] = useState<LiveWorld[]>([]);
  const [humanVerdicts, setHumanVerdicts] = useState<Record<string, HumanVerdict>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const liveUrls = useRef<string[]>([]);
  const worlds = [...appearanceWorlds, ...backgroundWorlds, ...tableWorlds, ...liveWorlds];
  const selected = worlds.find((world) => world.id === selectedId);

  const updateHumanVerdict = useCallback((worldId: string, verdict: HumanVerdict) => {
    setHumanVerdicts((current) => ({ ...current, [worldId]: verdict }));
  }, []);

  function statusFor(world: { id: string; status: ReviewStatus }) {
    return humanVerdicts[world.id] ?? world.status;
  }

  function addGeneratedVariation({ output, prompt }: GeneratedVariation) {
    const url = URL.createObjectURL(output);
    liveUrls.current.push(url);
    setLiveWorlds((current) => [...current, {
      id: `live-${Date.now()}`,
      title: `Generated variation ${current.length + 1}`,
      url,
      status: 'pending',
      recordedReview: {
        source: 'Live Reactor capture',
        status: 'pending',
        summary: 'The output was captured and attached to Experiment 01. Visual and trajectory reviews are pending.',
        qualification: `Prompt: ${prompt}`,
      },
    }]);
  }

  useEffect(() => () => {
    liveUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const restored: Record<string, HumanVerdict> = {};
      [...appearanceWorlds, ...backgroundWorlds, ...tableWorlds].forEach((world) => {
        const saved = localStorage.getItem(`scene-shift-human-review-${world.id}`);
        if (!saved) return;
        const review = JSON.parse(saved) as HumanReview;
        if (review.verdict) restored[world.id] = review.verdict;
      });
      setHumanVerdicts(restored);
    });
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedId(null);
        setShowGenerator(false);
      }
    }
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedId || showGenerator ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedId, showGenerator]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">S</span>
          <span>SCENE SHIFT</span>
        </a>
        <div className="status-row"><span className="status-dot" />VISUAL EVIDENCE ONLY</div>
      </header>

      <section className="showcase-intro" id="top">
        <div>
          <p className="eyebrow">ROBOT VIDEO VARIATIONS</p>
          <h1>Change the scene.<br />Keep the motion.</h1>
        </div>
        <div className="showcase-intro-copy">
          <p>
            Start with one real robot clip, change one visual factor, then check whether anything
            else broke. Compare robot appearance, background walls, and the table surface separately.
          </p>
          <button className="new-variation" onClick={() => setShowGenerator(true)} type="button">GENERATE VARIATIONS</button>
        </div>
      </section>

      <section className="experiment-shell">
        <header className="experiment-header">
          <div><span>EXPERIMENT 01</span><h2>One source, multiple controlled variations</h2></div>
          <strong>1 ORIGINAL / {appearanceWorlds.length + backgroundWorlds.length + tableWorlds.length + liveWorlds.length} OUTPUTS</strong>
        </header>

      <section className="showcase-stage" aria-label="Original and robot appearance variations">
        <article className="showcase-source">
          <header><span>Original recording</span><b>REAL</b></header>
          <video
            className="showcase-video"
            src="/media/showcase/original.mp4"
            poster="/media/worlds/source-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <footer><strong>Dual-arm block placement</strong><span>ABC-130K / 12 seconds</span></footer>
        </article>

        <div className="showcase-factor">
          <header className="showcase-section-title">
            <div><span>ROBOT APPEARANCE</span><h2>Same event, different arm shells</h2></div>
            <small>CLICK A CLIP TO REVIEW</small>
          </header>
          <div className="showcase-color-grid">
            {appearanceWorlds.map((world) => {
              const status = statusFor(world);
              return <button
                aria-label={`${world.title}, ${status === 'plausible' ? 'accepted' : status}`}
                className={`showcase-tile showcase-card-button status-${status}`}
                key={world.id}
                onClick={() => setSelectedId(world.id)}
                type="button"
              >
                <div>
                  <video
                    className="showcase-video"
                    src={world.url}
                    poster={world.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
                <footer><strong>{world.title}</strong></footer>
              </button>;
            })}
          </div>
        </div>
      </section>

      {liveWorlds.length > 0 && (
        <section className="showcase-section" aria-label="Newly generated variations">
          <header className="showcase-section-title">
            <div><span>NEW OUTPUTS</span><h2>Generated from Experiment 01</h2></div>
            <small>PENDING AUTOMATIC REVIEW</small>
          </header>
          <div className="showcase-environment-grid columns-3">
            {liveWorlds.map((world) => (
              <button
                aria-label={`${world.title}, pending review`}
                className="showcase-tile showcase-card-button status-pending"
                key={world.id}
                onClick={() => setSelectedId(world.id)}
                type="button"
              >
                <div><video className="showcase-video" src={world.url} autoPlay muted loop playsInline preload="metadata" /></div>
                <footer><strong>{world.title}</strong></footer>
              </button>
            ))}
          </div>
        </section>
      )}
      </section>

      <section className="showcase-section" aria-label="Background wall variations">
        <header className="showcase-section-title">
          <div><span>WHAT CHANGED: BACKGROUND WALLS</span><h2>Different walls, same robot event</h2></div>
          <small>3-SECOND REVIEW CLIPS</small>
        </header>
        <div className="showcase-environment-grid columns-3">
          {backgroundWorlds.map((world) => {
            const status = statusFor(world);
            return <button
              aria-label={`${world.title}, ${status === 'plausible' ? 'accepted' : status}`}
              className={`showcase-tile showcase-card-button status-${status}`}
              key={world.id}
              onClick={() => setSelectedId(world.id)}
              type="button"
            >
              <div>
                <video className="showcase-video" src={world.url} autoPlay muted loop playsInline preload="metadata" />
              </div>
              <footer><strong>{world.title}</strong></footer>
            </button>;
          })}
        </div>
      </section>

      <section className="showcase-section" aria-label="Table surface variations">
        <header className="showcase-section-title">
          <div><span>WHAT CHANGED: TABLE SURFACE</span><h2>Different surface, same objects and motion</h2></div>
          <small>GREEN KEEPS / RED DISCARDS</small>
        </header>
        <div className="showcase-environment-grid columns-4">
          {tableWorlds.map((world) => {
            const status = statusFor(world);
            return <button
              aria-label={`${world.title}, ${status === 'plausible' ? 'accepted' : status}`}
              className={`showcase-tile showcase-card-button status-${status}`}
              key={world.id}
              onClick={() => setSelectedId(world.id)}
              type="button"
            >
              <div><video className="showcase-video" src={world.url} autoPlay muted loop playsInline preload="metadata" /></div>
              <footer><strong>{world.title}</strong></footer>
            </button>;
          })}
        </div>
      </section>

      {selected && (
        <div className="review-modal" onClick={() => setSelectedId(null)} role="presentation">
          <section
            aria-label={`Review ${selected.title}`}
            aria-modal="true"
            className="review-dialog"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <div><span>GENERATED OUTPUT</span><h2>{selected.title}</h2></div>
              <button aria-label="Close review" onClick={() => setSelectedId(null)} type="button">CLOSE</button>
            </header>
            <video
              className="review-video"
              src={selected.url}
              poster={'poster' in selected ? selected.poster : undefined}
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="review-panel">
              {'recordedReview' in selected && (
                <RecordedReviewPanel review={selected.recordedReview} verdict={humanVerdicts[selected.id]} />
              )}
              <VlmReview expanded onVerdict={updateHumanVerdict} worldId={selected.id} />
              <p className="review-boundary">
                Visual judgment only. This does not certify physics, telemetry alignment, or training readiness.
              </p>
            </div>
          </section>
        </div>
      )}
      {showGenerator && <LiveGenerator onClose={() => setShowGenerator(false)} onGenerated={addGeneratedVariation} />}
    </main>
  );
}
