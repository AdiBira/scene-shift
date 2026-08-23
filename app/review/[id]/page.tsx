'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { type HumanVerdict, reviewWorlds } from '../../review-data';
import { vlmReviews } from '../../vlm-reviews';

type HumanReview = {
  verdict: HumanVerdict | null;
  comment: string;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${remainder}`;
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const world = reviewWorlds.find((candidate) => candidate.id === id);
  const sourceRef = useRef<HTMLVideoElement>(null);
  const outputRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [human, setHuman] = useState<HumanReview>({ verdict: null, comment: '' });
  const [loaded, setLoaded] = useState(false);
  const storageKey = `scene-shift-human-review-${id}`;
  const vlm = vlmReviews[id];

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const saved = localStorage.getItem(storageKey);
      if (saved) setHuman(JSON.parse(saved) as HumanReview);
      setLoaded(true);
    });
    return () => window.clearTimeout(restore);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(human));
  }, [human, loaded, storageKey]);

  if (!world) {
    return (
      <main className="review-page">
        <Link className="back-button" href="/">Back to outputs</Link>
        <h1>Output not found.</h1>
      </main>
    );
  }

  const effectiveStatus = human.verdict ?? world.status;
  const effectiveLabel = effectiveStatus === 'plausible' ? 'ACCEPTED' : effectiveStatus === 'discard' ? 'DISCARD' : 'PENDING';

  function updateDuration() {
    const sourceDuration = sourceRef.current?.duration ?? Infinity;
    const outputDuration = outputRef.current?.duration ?? Infinity;
    const comparisonDuration = Math.min(sourceDuration, outputDuration);
    if (Number.isFinite(comparisonDuration)) setDuration(comparisonDuration);
  }

  function pause() {
    sourceRef.current?.pause();
    outputRef.current?.pause();
    setPlaying(false);
  }

  function seek(time: number) {
    const nextTime = Math.min(time, duration);
    if (sourceRef.current) sourceRef.current.currentTime = nextTime;
    if (outputRef.current) outputRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function togglePlayback() {
    if (playing) {
      pause();
      return;
    }

    if (currentTime >= duration - 0.05) seek(0);
    const source = sourceRef.current;
    const output = outputRef.current;
    if (!source || !output) return;
    void Promise.all([source.play(), output.play()]).then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }

  function trackSource() {
    const source = sourceRef.current;
    const output = outputRef.current;
    if (!source || !output) return;
    const time = Math.min(source.currentTime, duration);
    if (Math.abs(output.currentTime - time) > 0.08) output.currentTime = time;
    setCurrentTime(time);
    if (duration && source.currentTime >= duration) pause();
  }

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>SCENE SHIFT</span>
        </Link>
        <div className="status-row"><span className="status-dot" />VISUAL EVIDENCE ONLY</div>
      </header>

      <section className="review-page">
        <Link className="back-button" href="/">Back to outputs</Link>
        <header className="review-page-heading">
          <div><p className="eyebrow">SOURCE COMPARISON</p><h1>{world.title}</h1></div>
          <strong className={`review-page-status recorded-${effectiveStatus}`}>{effectiveLabel}</strong>
        </header>

        <div className="compare-player-grid">
          <article className="compare-video-card">
            <header><span>ORIGINAL</span><strong>REAL SOURCE</strong></header>
            <video
              ref={sourceRef}
              src="/media/showcase/original.mp4"
              poster="/media/worlds/source-poster.jpg"
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={updateDuration}
              onTimeUpdate={trackSource}
            />
          </article>
          <article className="compare-video-card">
            <header><span>GENERATED</span><strong>{world.title}</strong></header>
            <video
              ref={outputRef}
              src={world.url}
              poster={world.poster}
              muted
              playsInline
              preload="auto"
              onEnded={pause}
              onLoadedMetadata={updateDuration}
            />
          </article>
        </div>

        <div className="compare-controls">
          <button onClick={togglePlayback} type="button">{playing ? 'PAUSE BOTH' : 'PLAY BOTH'}</button>
          <input
            aria-label="Seek both videos"
            max={duration}
            min="0"
            onChange={(event) => seek(Number(event.target.value))}
            step="0.01"
            type="range"
            value={currentTime}
          />
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        <section className="review-interpretation">
          <article className={`recorded-review recorded-${effectiveStatus}`}>
            <header><span>{human.verdict ? 'FINAL HUMAN VERDICT' : world.recordedReview.source}</span><strong>{effectiveLabel}</strong></header>
            {!human.verdict && <p>{world.recordedReview.summary}</p>}
            {!human.verdict && world.recordedReview.qualification && <small>{world.recordedReview.qualification}</small>}
          </article>

          {vlm && (
            <article className={`vlm-review vlm-${vlm.verdict}`}>
              <header className="review-evidence-header">
                <span>PRECOMPUTED VLM</span>
                <strong>{vlm.verdict === 'plausible' ? 'PLAUSIBLE' : 'DISCARD'}</strong>
                <small>{Math.round(vlm.confidence * 100)}% confidence</small>
              </header>
              <p>{vlm.summary}</p>
            </article>
          )}

          <article className="human-review review-decision-card">
            <div><span>FINAL DECISION</span></div>
            <div className="human-verdicts" role="group" aria-label="Final human decision">
              <button
                className={human.verdict === 'plausible' ? 'selected plausible' : ''}
                onClick={() => setHuman({ ...human, verdict: 'plausible' })}
                type="button"
              >
                Accept
              </button>
              <button
                className={human.verdict === 'discard' ? 'selected discard' : ''}
                onClick={() => setHuman({ ...human, verdict: 'discard' })}
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
          </article>
        </section>

        <p className="review-boundary">
          Visual judgment only. This does not certify physics, telemetry alignment, or training readiness.
        </p>
      </section>
    </main>
  );
}
