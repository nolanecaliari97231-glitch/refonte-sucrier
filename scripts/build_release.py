#!/usr/bin/env python3
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist_release"

FILES = [
    "index.html",
    "catalogue.html",
    "livre.html",
    "a-propos.html",
    "actualites.html",
    "auteur.html",
    "contact.html",
    "compte.html",
    "favoris.html",
    "panier.html",
    "checkout-success.html",
    "checkout-cancel.html",
    "app.js",
    "style.css",
    "google-auth-config.js",
    "vercel.json",
    "README.md",
]

DIRS = [
    "images",
    "locales",
    "api",
]


def copy_file(rel_path: str) -> None:
    src = ROOT / rel_path
    dst = OUT / rel_path
    if not src.exists():
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def copy_dir(rel_path: str) -> None:
    src = ROOT / rel_path
    dst = OUT / rel_path
    if not src.exists():
        return
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    for rel in FILES:
        copy_file(rel)
    for rel in DIRS:
        copy_dir(rel)

    print(f"Release build ready: {OUT}")


if __name__ == "__main__":
    main()
