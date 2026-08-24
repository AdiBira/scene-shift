import argparse
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = ROOT if (ROOT / "app").exists() else ROOT / "prototype"
PUBLIC_ROOT = APP_ROOT / "public"
SOURCE = PUBLIC_ROOT / "media/showcase/original.mp4"
OUTPUT_ROOT = ROOT / ".context/vlm-reviews-v3"
SCHEMA = ROOT / "scripts/vlm-review-schema.json"
MODEL = "gpt-5.6-luna"

RUNS = [
    ("orange-opacity-repair", "orange-opaque-repair.mp4", "Make both robot-arm shells opaque safety orange."),
    ("safety-orange", "orange.mp4", "Change both robot-arm shells to safety orange."),
    ("cobalt-blue", "blue.mp4", "Change both robot-arm shells to cobalt blue."),
    ("signal-yellow", "yellow.mp4", "Change both robot-arm shells to signal yellow."),
    ("graphite-black", "graphite.mp4", "Change both robot-arm shells to graphite black."),
    ("blue-safety-panels", "walls-blue-panels-3s.mp4", "Change the enclosure walls to blue safety panels."),
    ("safety-mesh-walls", "walls-safety-mesh-3s.mp4", "Change the enclosure walls to dark safety mesh."),
    ("clean-lab-b", "clean-lab-b.mp4", "Change the background to light-gray lab walls."),
    ("brushed-steel-table", "table-brushed-steel-3s.mp4", "Change the table surface to brushed steel."),
    ("navy-esd-table-b", "navy-esd-table-b.mp4", "Change the table surface to navy-blue ESD material."),
    ("walnut-table", "table-walnut-failure-3s.mp4", "Change the table surface to walnut."),
]

MANUAL_LABELS = {
    "safety-orange": "discard",
    "cobalt-blue": "discard",
    "signal-yellow": "discard",
    "graphite-black": "discard",
    "blue-safety-panels": "plausible",
    "clean-lab-b": "discard",
    "brushed-steel-table": "plausible",
    "navy-esd-table-b": "discard",
    "walnut-table": "discard",
}

PROMPT = """You are a strict visual reviewer of a generated robot-manipulation video against its real source.

The attached images contain source and generated frames paired at identical timestamps. They are grouped into FULL FRAME, ROBOT + GRIPPERS, and BLOCKS + WORK SURFACE views. Read every panel in every view before assessing each dimension.

Requested variation:
{variation}

Success on the requested edit is necessary but not sufficient. Assess all nine dimensions independently:
1. requested_variation: the requested visual change is visible and temporally consistent without unrelated scene changes.
2. arm_opacity_geometry: both robot arms stay opaque, solid, correctly connected, and geometrically coherent.
3. gripper_integrity: both end effectors remain present, rigid, recognizable, and attached to their arms.
4. block_realism_count: blocks remain solid and distinct, without melting, multiplication, disappearance, or implausible shape changes.
5. gripper_block_interaction: visible block motion remains spatially associated with a gripper; fail if a block visibly moves independently, passes through a gripper, or changes attachment implausibly.
6. object_continuity: blocks do not jump, teleport, drift, duplicate, reset, or change identity between sampled moments.
7. temporal_continuity: robot, object, and scene motion progress without visible discontinuities or resets.
8. hallucinated_entities: no new blocks, robot parts, people, or unrelated objects appear.
9. visible_task_preservation: the generated sequence continues to show the same broad manipulation event as the source.

For every dimension return pass, fail, or uncertain with timestamped visible evidence. Mark fail when any sampled frame visibly contains a critical defect, even if most of the video looks good. Mark uncertain only when the supplied views do not visibly resolve the question. Do not infer a defect merely because frames are sampled rather than continuous.

Use only visible RGB evidence. Do not infer physics correctness, contact validity, telemetry alignment, executable actions, or training readiness.

Return one factual summary, the nine dimension assessments, and limitations. The application will deterministically map any fail to DISCARD, otherwise any uncertain to UNCERTAIN, otherwise PLAUSIBLE.

Do not provide a confidence score. Do not use tools or inspect files. Review only the attached images and return the requested JSON."""


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def duration(path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True,
        check=True,
        text=True,
    )
    return float(result.stdout.strip())


def read_frame(capture, time_s):
    capture.set(cv2.CAP_PROP_POS_MSEC, time_s * 1000)
    ok, frame = capture.read()
    assert ok
    return frame


def fit(frame, width, height):
    scale = min(width / frame.shape[1], height / frame.shape[0])
    resized = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    y = (height - resized.shape[0]) // 2
    x = (width - resized.shape[1]) // 2
    canvas[y:y + resized.shape[0], x:x + resized.shape[1]] = resized
    return canvas


def crop(frame, bounds):
    height, width = frame.shape[:2]
    x1, y1, x2, y2 = bounds
    return frame[int(y1 * height):int(y2 * height), int(x1 * width):int(x2 * width)]


def make_cells(source_capture, candidate_capture, times, bounds, label):
    cells = []
    for time_s in times:
        source_frame = fit(crop(read_frame(source_capture, time_s), bounds), 360, 203)
        candidate_frame = fit(crop(read_frame(candidate_capture, time_s), bounds), 360, 203)
        cell = np.zeros((235, 720, 3), dtype=np.uint8)
        cell[32:] = np.hstack([source_frame, candidate_frame])
        cv2.putText(cell, f"{label}  t={time_s:05.2f}s  SOURCE", (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (225, 235, 242), 1, cv2.LINE_AA)
        cv2.putText(cell, "GENERATED", (600, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (110, 255, 182), 1, cv2.LINE_AA)
        cells.append(cell)
    return cells


def write_sheets(cells, output_dir, prefix):
    sheets = []
    for offset in range(0, len(cells), 12):
        page = cells[offset:offset + 12]
        rows = [np.hstack(page[index:index + 3]) for index in range(0, len(page), 3)]
        sheet = np.vstack(rows)
        path = output_dir / f"{prefix}-{offset // 12 + 1}.jpg"
        assert cv2.imwrite(str(path), sheet, [cv2.IMWRITE_JPEG_QUALITY, 94])
        sheets.append(path)
    return sheets


def make_sheets(candidate, output_dir):
    review_duration = min(duration(SOURCE), duration(candidate))
    sample_count = 48 if review_duration > 4 else 12
    times = np.linspace(0, review_duration - 0.05, sample_count).tolist()
    source_capture = cv2.VideoCapture(str(SOURCE))
    candidate_capture = cv2.VideoCapture(str(candidate))
    views = [
        ("full", (0.0, 0.0, 1.0, 1.0), "FULL FRAME"),
        ("robot", (0.0, 0.22, 1.0, 1.0), "ROBOT + GRIPPERS"),
        ("objects", (0.2, 0.28, 0.8, 0.98), "BLOCKS + WORK SURFACE"),
    ]
    sheets = []
    for prefix, bounds, label in views:
        cells = make_cells(source_capture, candidate_capture, times, bounds, label)
        sheets.extend(write_sheets(cells, output_dir, prefix))
    source_capture.release()
    candidate_capture.release()
    return review_duration, times, sheets


def prepare(run_id, filename, variation):
    candidate = PUBLIC_ROOT / "media/showcase" / filename
    output_dir = OUTPUT_ROOT / run_id
    output_dir.mkdir(parents=True, exist_ok=True)
    review_duration, times, sheets = make_sheets(candidate, output_dir)
    prompt = PROMPT.format(variation=variation)
    manifest = {
        "schema_version": 2,
        "review_id": run_id,
        "model": MODEL,
        "requested_variation": variation,
        "review_duration_s": review_duration,
        "source": {"path": str(SOURCE.relative_to(ROOT)), "sha256": sha256(SOURCE)},
        "candidate": {"path": str(candidate.relative_to(ROOT)), "sha256": sha256(candidate)},
        "sample_times_s": [round(value, 4) for value in times],
        "sheets": [{"path": path.name, "sha256": sha256(path)} for path in sheets],
        "prompt": prompt,
        "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
    }
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return output_dir, sheets, prompt


def review(run_id, filename, variation):
    output_dir, sheets, prompt = prepare(run_id, filename, variation)
    result_path = output_dir / "result.json"
    command = [
        "codex", "exec", "--ephemeral", "--ignore-rules", "--skip-git-repo-check",
        "--sandbox", "read-only", "--model", MODEL,
        "--output-schema", str(SCHEMA), "--output-last-message", str(result_path),
        prompt,
    ]
    for sheet in sheets:
        command.extend(["--image", str(sheet)])
    completed = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    (output_dir / "codex.stdout.log").write_text(completed.stdout)
    (output_dir / "codex.stderr.log").write_text(completed.stderr)
    assert completed.returncode == 0, completed.stderr
    result = json.loads(result_path.read_text())
    dimensions = result["dimensions"]
    statuses = [dimension["status"] for dimension in dimensions.values()]
    verdict = "discard" if "fail" in statuses else "uncertain" if "uncertain" in statuses else "plausible"
    observations = [
        {"time_s": item["time_s"], "category": name, "finding": item["finding"]}
        for name, dimension in dimensions.items()
        for item in dimension["evidence"]
        if dimension["status"] != "pass"
    ]
    if not observations:
        observations = [{"time_s": 0, "category": "overall", "finding": result["summary"]}]
    artifact = {
        "schema_version": 2,
        "review_id": run_id,
        "model": MODEL,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "manifest": "manifest.json",
        "verdict": verdict,
        "summary": result["summary"],
        "dimensions": dimensions,
        "observations": observations,
        "limitations": result["limitations"],
        "confidence": None,
    }
    (output_dir / "artifact.json").write_text(json.dumps(artifact, indent=2) + "\n")
    return artifact


def benchmark():
    rows = []
    for run_id, expected in MANUAL_LABELS.items():
        artifact = json.loads((OUTPUT_ROOT / run_id / "artifact.json").read_text())
        actual = artifact["verdict"]
        rows.append({"id": run_id, "expected": expected, "actual": actual, "match": actual == expected})
    report = {
        "schema_version": 2,
        "model": MODEL,
        "evaluated": len(rows),
        "matches": sum(row["match"] for row in rows),
        "accuracy": sum(row["match"] for row in rows) / len(rows),
        "acceptance_gate": {
            "all_manual_discards_caught": all(row["actual"] == "discard" for row in rows if row["expected"] == "discard"),
            "at_least_7_of_9_agreement": sum(row["match"] for row in rows) >= 7,
            "at_least_one_manual_keep_retained": any(row["actual"] == "plausible" for row in rows if row["expected"] == "plausible"),
        },
        "rows": rows,
        "boundary": "Agreement with this small manually labeled showcase set is not a calibrated model confidence or general benchmark.",
    }
    (OUTPUT_ROOT / "benchmark.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def export():
    report = benchmark()
    public_roots = [PUBLIC_ROOT / "review-artifacts/vlm"]
    results = {}
    for run_id, _, _ in RUNS:
        review_dir = OUTPUT_ROOT / run_id
        artifact = json.loads((review_dir / "artifact.json").read_text())
        manifest = json.loads((review_dir / "manifest.json").read_text())
        result = {
            "schema_version": 2,
            "review_id": run_id,
            "model": artifact["model"],
            "created_at": artifact["created_at"],
            "requested_variation": manifest["requested_variation"],
            "source": manifest["source"],
            "candidate": manifest["candidate"],
            "sample_times_s": manifest["sample_times_s"],
            "sheet_hashes": [sheet["sha256"] for sheet in manifest["sheets"]],
            "prompt": manifest["prompt"],
            "prompt_sha256": manifest["prompt_sha256"],
            "verdict": artifact["verdict"],
            "summary": artifact["summary"],
            "observations": artifact["observations"],
            "dimensions": artifact["dimensions"],
            "limitations": artifact["limitations"],
            "confidence": None,
            "benchmark_agreement": f"{report['matches']}/{report['evaluated']}",
        }
        results[run_id] = {
            "model": artifact["model"],
            "verdict": artifact["verdict"],
            "summary": artifact["summary"],
            "sampleCount": len(manifest["sample_times_s"]),
            "artifactUrl": f"/review-artifacts/vlm/{run_id}.json",
        }
        for public_root in public_roots:
            public_root.mkdir(parents=True, exist_ok=True)
            (public_root / f"{run_id}.json").write_text(json.dumps(result, indent=2) + "\n")

    protocol = {
        "schema_version": 2,
        "model": MODEL,
        "sampling": "48 paired timestamps for 12-second clips; 12 paired timestamps for 3-second clips; full-frame, robot/gripper, and block/work-surface views",
        "prompt_template": PROMPT,
        "output_schema": json.loads(SCHEMA.read_text()),
        "benchmark": report,
    }
    for public_root in public_roots:
        (public_root / "protocol.json").write_text(json.dumps(protocol, indent=2) + "\n")

    typescript = """export type VlmResult = {
  model: string;
  verdict: 'plausible' | 'discard' | 'uncertain';
  summary: string;
  sampleCount: number;
  artifactUrl: string;
};

export const vlmResults: Record<string, VlmResult> = """ + json.dumps(results, indent=2) + ";\n"
    (APP_ROOT / "app/vlm-results.ts").write_text(typescript)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--benchmark-only", action="store_true")
    parser.add_argument("--export-only", action="store_true")
    parser.add_argument("--id")
    args = parser.parse_args()
    if args.benchmark_only:
        report = benchmark()
        print(f"benchmark {report['matches']}/{report['evaluated']}")
        return
    if args.export_only:
        export()
        print("exported VLM artifacts")
        return
    selected = [run for run in RUNS if not args.id or run[0] == args.id]
    assert selected
    for run in selected:
        if args.prepare_only:
            prepare(*run)
            print(f"prepared {run[0]}")
        else:
            result = review(*run)
            print(f"reviewed {run[0]}: {result['verdict']}")
    if not args.prepare_only and not args.id:
        report = benchmark()
        print(f"benchmark {report['matches']}/{report['evaluated']}")


if __name__ == "__main__":
    main()
