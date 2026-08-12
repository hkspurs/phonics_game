#!/usr/bin/env python3
"""Generate review-required Cantonese MP3s for the Chinese Space catalog."""

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "chinese_space_words.json"
PUBLIC = ROOT / "public"


def manifest_entries(catalog, output_dir):
    try:
        asset_dir = output_dir.resolve().relative_to(PUBLIC)
    except ValueError as error:
        raise ValueError("--output-dir must be inside this repository's public directory") from error

    return [
        {
            "id": word["id"],
            "file": (asset_dir / chapter["id"] / f"{word['id']}.mp3").as_posix(),
            "expectedText": word["text"],
            "language": "yue-HK",
            "generatedBy": "gpt-sovits",
            "qaStatus": "review_required",
        }
        for chapter in catalog
        for word in chapter["words"]
    ]


def request_wav(api_url, reference_audio, prompt_text, text, wav_path):
    body = json.dumps({
        "refer_wav_path": str(reference_audio),
        "prompt_text": prompt_text,
        "prompt_language": "yue",
        "text": text,
        "text_language": "yue",
    }).encode("utf-8")
    request = Request(
        f"{api_url.rstrip('/')}/",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request) as response, open(wav_path, "wb") as wav_file:
        wav_file.write(response.read())


def convert_to_mp3(wav_path, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".mp3", dir=output_path.parent, delete=False) as temp_file:
        temp_path = Path(temp_file.name)
    try:
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav_path),
            "-vn", "-ac", "1", "-ar", "24000", "-map_metadata", "-1",
            "-codec:a", "libmp3lame", "-b:a", "96k", str(temp_path),
        ], check=True)
        os.replace(temp_path, output_path)
    finally:
        temp_path.unlink(missing_ok=True)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", required=True)
    parser.add_argument("--reference-audio", required=True, type=Path)
    parser.add_argument("--prompt-text-file", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    return parser.parse_args()


def main():
    args = parse_args()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    prompt_text = args.prompt_text_file.read_text(encoding="utf-8").strip()
    if not prompt_text:
        raise ValueError("--prompt-text-file must contain the human-verified reference text")
    if not args.reference_audio.is_file():
        raise FileNotFoundError(f"Reference audio not found: {args.reference_audio}")

    entries = manifest_entries(catalog, args.output_dir)
    failures = []
    for entry in entries:
        output_path = PUBLIC / entry["file"]
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            wav_path = Path(temp_file.name)
        try:
            request_wav(args.api_url, args.reference_audio, prompt_text, entry["expectedText"], wav_path)
            convert_to_mp3(wav_path, output_path)
            print(f"generated {entry['id']} -> {entry['file']}")
        except Exception as error:  # Continue to identify every failed word.
            failures.append(entry["id"])
            print(f"failed {entry['id']}: {error}", file=sys.stderr)
        finally:
            wav_path.unlink(missing_ok=True)

    if failures:
        print(f"Generation failed for: {', '.join(failures)}", file=sys.stderr)
        return 1

    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} review_required manifest items to {args.manifest}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Audio generation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
