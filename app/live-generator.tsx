'use client';

import { X2Model } from '@reactor-models/x2';
import { useEffect, useRef, useState } from 'react';

type RunState =
  | { type: 'idle' }
  | { type: 'connecting' }
  | { type: 'generating' }
  | { type: 'recorded' }
  | { type: 'error'; message: string };

type Provenance = {
  capturedAt: string;
  model: 'xmax/x2';
  outputSha256: string;
  prompt: string;
  referenceImage: string | null;
  referenceSha256: string | null;
  sourceFile: string;
  sourceSha256: string;
};

export type GeneratedVariation = {
  output: Blob;
  prompt: string;
};

async function sha256(file: Blob) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function LiveGenerator({ onClose, onGenerated }: { onClose: () => void; onGenerated: (variation: GeneratedVariation) => void }) {
  const [source, setSource] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [reference, setReference] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [run, setRun] = useState<RunState>({ type: 'idle' });
  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const model = useRef<X2Model | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const resultObjectUrl = useRef('');
  const sourceObjectUrl = useRef('');
  const sourceStream = useRef<MediaStream | null>(null);
  const sourceVideo = useRef<HTMLVideoElement>(null);
  const outputVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => () => {
    sourceStream.current?.getTracks().forEach((track) => track.stop());
    if (recorder.current?.state === 'recording') recorder.current.stop();
    void model.current?.disconnect();
    if (sourceObjectUrl.current) URL.revokeObjectURL(sourceObjectUrl.current);
    if (resultObjectUrl.current) URL.revokeObjectURL(resultObjectUrl.current);
  }, []);

  function chooseSource(file: File) {
    if (sourceObjectUrl.current) URL.revokeObjectURL(sourceObjectUrl.current);
    if (resultObjectUrl.current) URL.revokeObjectURL(resultObjectUrl.current);
    const url = URL.createObjectURL(file);
    sourceObjectUrl.current = url;
    resultObjectUrl.current = '';
    setSource(file);
    setSourceUrl(url);
    setResultUrl('');
    setProvenance(null);
    setRun({ type: 'idle' });
  }

  async function finishRecording(chunks: Blob[]) {
    const output = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(output);
    if (resultObjectUrl.current) URL.revokeObjectURL(resultObjectUrl.current);
    resultObjectUrl.current = url;

    if (outputVideo.current) {
      outputVideo.current.srcObject = null;
      outputVideo.current.src = url;
      outputVideo.current.controls = true;
      outputVideo.current.loop = true;
      await outputVideo.current.play();
    }

    setResultUrl(url);
    setProvenance({
      capturedAt: new Date().toISOString(),
      model: 'xmax/x2',
      outputSha256: await sha256(output),
      prompt,
      referenceImage: reference?.name ?? null,
      referenceSha256: reference ? await sha256(reference) : null,
      sourceFile: source!.name,
      sourceSha256: await sha256(source!),
    });
    sourceStream.current?.getTracks().forEach((track) => track.stop());
    await model.current?.disconnect();
    onGenerated({ output, prompt: prompt.trim() });
    setRun({ type: 'recorded' });
  }

  async function generate() {
    if (!source || !prompt.trim() || !sourceVideo.current || !outputVideo.current) return;

    setRun({ type: 'connecting' });
    setProvenance(null);

    try {
      const tokenResponse = await fetch('/api/reactor-token', { method: 'POST' });
      const token = await tokenResponse.json() as { error?: string; jwt?: string };
      if (!tokenResponse.ok || !token.jwt) throw new Error(token.error ?? 'Could not create Reactor session.');

      const x2 = new X2Model();
      model.current = x2;
      x2.onCommandError(() => setRun({ type: 'error', message: 'Reactor rejected the generation command.' }));
      x2.onMainVideo((_track, stream) => {
        if (!outputVideo.current || recorder.current?.state === 'recording') return;

        outputVideo.current.srcObject = stream;
        void outputVideo.current.play();
        const chunks: Blob[] = [];
        const capture = new MediaRecorder(stream);
        recorder.current = capture;
        capture.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        capture.onstop = () => { void finishRecording(chunks); };
        capture.start();
        setRun({ type: 'generating' });

        const duration = Math.min(12, Math.max(3, sourceVideo.current!.duration));
        window.setTimeout(() => {
          if (capture.state === 'recording') capture.stop();
        }, duration * 1000);
      });

      await x2.connect(token.jwt);
      await x2.setKeepBacklog({ keep_backlog: true });

      if (reference) {
        const uploaded = await x2.uploadFile(reference, { name: reference.name });
        await x2.setReferenceImage({ reference_image: uploaded });
      }

      await x2.setPrompt({ prompt: prompt.trim() });
      sourceVideo.current.currentTime = 0;
      sourceVideo.current.loop = true;
      await sourceVideo.current.play();
      const stream = (sourceVideo.current as HTMLVideoElement & { captureStream(): MediaStream }).captureStream();
      sourceStream.current = stream;
      await x2.publishSource(stream.getVideoTracks()[0]);
    } catch (error) {
      await model.current?.disconnect();
      setRun({ type: 'error', message: error instanceof Error ? error.message : 'Generation failed.' });
    }
  }

  function downloadProvenance() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(provenance, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene-shift-provenance.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  const busy = run.type === 'connecting' || run.type === 'generating';
  const status = run.type === 'idle' ? 'READY' : run.type === 'connecting' ? 'CONNECTING' : run.type === 'generating' ? 'LIVE' : run.type === 'recorded' ? 'CAPTURED' : 'ERROR';

  return (
    <div className="generator-modal" role="presentation">
      <section aria-label="Generate variations" aria-modal="true" className="generator-dialog" role="dialog">
        <header className="generator-header">
          <button className="generator-back" onClick={onClose} type="button">&larr; BACK TO RESULTS</button>
          <div><span>REACTOR X2</span><h2>Generate variations</h2></div>
          <b className={`generator-status state-${run.type}`}>{status}</b>
        </header>

        <div className="generator-body">
          <div className="generator-controls">
            <label>
              <span>1. SOURCE VIDEO</span>
              <input accept="video/*" disabled={busy} onChange={(event) => event.target.files?.[0] && chooseSource(event.target.files[0])} type="file" />
            </label>
            <label>
              <span>2. VARIATION PROMPT</span>
              <textarea disabled={busy} maxLength={1000} onChange={(event) => setPrompt(event.target.value)} placeholder="Make both robot arm shells safety orange. Preserve the motion, grippers, blocks, and workcell." value={prompt} />
            </label>
            <label>
              <span>3. REFERENCE IMAGE <small>OPTIONAL</small></span>
              <input accept="image/*" disabled={busy} onChange={(event) => setReference(event.target.files?.[0] ?? null)} type="file" />
            </label>
            <button className="generate-button" disabled={!source || !prompt.trim() || busy} onClick={() => void generate()} type="button">
              {busy ? status : 'GENERATE LIVE'}
            </button>
            {run.type === 'generating' && <button className="stop-button" onClick={() => recorder.current?.stop()} type="button">STOP AND CAPTURE</button>}
            {run.type === 'error' && <p className="generator-error">{run.message}</p>}
            <p className="generator-boundary">Live X2 pixels are a visual candidate. Capture does not certify physics, telemetry alignment, or training readiness.</p>
          </div>

          <div className="generator-preview-grid">
            <article>
              <header><span>ORIGINAL</span><b>YOUR SOURCE</b></header>
              {sourceUrl ? <video controls muted playsInline ref={sourceVideo} src={sourceUrl} /> : <div className="generator-empty">Upload a source clip</div>}
            </article>
            <article>
              <header><span>OUTPUT</span><b>{run.type === 'generating' ? 'LIVE STREAM' : run.type === 'recorded' ? 'RECORDED RESULT' : 'WAITING'}</b></header>
              <video muted playsInline ref={outputVideo} />
              {run.type !== 'generating' && run.type !== 'recorded' && <div className="generator-empty output-empty">Reactor output appears here</div>}
            </article>
          </div>

          {provenance && (
            <div className="generator-result">
              <div><span>SOURCE + PROMPT + OUTPUT LINKED</span><p>Hashes and the exact variation prompt are saved with this capture.</p></div>
              <a download="scene-shift-output.webm" href={resultUrl}>DOWNLOAD VIDEO</a>
              <button onClick={downloadProvenance} type="button">DOWNLOAD PROVENANCE</button>
              <b>READY FOR VLM REVIEW</b>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
