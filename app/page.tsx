'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { GeneratedVariation, LiveGenerator } from './live-generator';
import {
  appearanceWorlds,
  backgroundWorlds,
  type HumanVerdict,
  type RecordedReview,
  type ReviewStatus,
  type ReviewWorld,
  tableWorlds,
} from './review-data';

type HumanReview = {
  verdict: HumanVerdict | null;
  comment: string;
};

type LiveWorld = {
  id: string;
  title: string;
  url: string;
  status: 'pending';
  recordedReview: RecordedReview;
};

function WorldTile({ status, world }: { status: ReviewStatus; world: ReviewWorld }) {
  return (
    <Link
      aria-label={`${world.title}, ${status === 'plausible' ? 'accepted' : status}`}
      className={`showcase-tile showcase-card-button status-${status}`}
      href={`/review/${world.id}`}
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
    </Link>
  );
}

export default function Home() {
  const [liveWorlds, setLiveWorlds] = useState<LiveWorld[]>([]);
  const [humanVerdicts, setHumanVerdicts] = useState<Record<string, HumanVerdict>>({});
  const [showGenerator, setShowGenerator] = useState(false);
  const liveUrls = useRef<string[]>([]);

  function statusFor(world: ReviewWorld) {
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
        summary: 'The output was captured and attached to Experiment 01. Visual review is pending.',
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
      if (event.key === 'Escape') setShowGenerator(false);
    }
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showGenerator ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showGenerator]);

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
              controls
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
              <small>OPEN A CLIP TO COMPARE</small>
            </header>
            <div className="showcase-color-grid">
              {appearanceWorlds.map((world) => (
                <WorldTile key={world.id} status={statusFor(world)} world={world} />
              ))}
            </div>
          </div>
        </section>

        {liveWorlds.length > 0 && (
          <section className="showcase-section" aria-label="Newly generated variations">
            <header className="showcase-section-title">
              <div><span>NEW OUTPUTS</span><h2>Generated from Experiment 01</h2></div>
              <small>PENDING VISUAL REVIEW</small>
            </header>
            <div className="showcase-environment-grid columns-3">
              {liveWorlds.map((world) => (
                <article className="showcase-tile showcase-card-button status-pending live-output-tile" key={world.id}>
                  <div><video className="showcase-video" src={world.url} autoPlay controls muted loop playsInline preload="metadata" /></div>
                  <footer><strong>{world.title}</strong></footer>
                </article>
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
          {backgroundWorlds.map((world) => (
            <WorldTile key={world.id} status={statusFor(world)} world={world} />
          ))}
        </div>
      </section>

      <section className="showcase-section" aria-label="Table surface variations">
        <header className="showcase-section-title">
          <div><span>WHAT CHANGED: TABLE SURFACE</span><h2>Different surface, same objects and motion</h2></div>
          <small>GREEN KEEPS / RED DISCARDS</small>
        </header>
        <div className="showcase-environment-grid columns-4">
          {tableWorlds.map((world) => (
            <WorldTile key={world.id} status={statusFor(world)} world={world} />
          ))}
        </div>
      </section>

      {showGenerator && <LiveGenerator onClose={() => setShowGenerator(false)} onGenerated={addGeneratedVariation} />}
    </main>
  );
}
