"""Extrait les fiches pédagogiques par livre depuis le PDF source Éditions du Sucrier."""

from __future__ import annotations

import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "pedagogical"

# pages 0-indexed — voir includes/pedagogical-sheets.php
SHEETS = {
    "nikou-formes": [0],
    "le-cahier-de-nikou": [0],
    "les-couleurs-de-nikou": [1],
    "compte-avec-nikou": [1, 2],
    "le-carnaval-de-nikou": [2],
    "lettres-ou-betes": [3],
    "exocette": [4],
}


def find_source_pdf() -> Path:
    downloads = Path.home() / "Downloads"
    candidates = sorted(downloads.glob("*publications*"), key=lambda p: p.stat().st_mtime, reverse=True)
    for path in candidates:
        if path.suffix.lower() == ".pdf" and path.is_file():
            return path
    local = ROOT / "data" / "pedagogical" / "source-publications-ecole.pdf"
    if local.is_file():
        return local
    raise FileNotFoundError("PDF source introuvable (Downloads ou data/pedagogical/source-publications-ecole.pdf)")


def main() -> int:
    source = find_source_pdf()
    reader = PdfReader(str(source))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for book_id, pages in SHEETS.items():
        writer = PdfWriter()
        for page_index in pages:
            if page_index < 0 or page_index >= len(reader.pages):
                print(f"skip {book_id}: page {page_index} hors limites", file=sys.stderr)
                continue
            writer.add_page(reader.pages[page_index])
        target = OUT_DIR / f"{book_id}.pdf"
        with target.open("wb") as handle:
            writer.write(handle)
        print(f"wrote {target.name} ({len(pages)} page(s))")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
