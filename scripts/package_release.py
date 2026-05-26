#!/usr/bin/env python3
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist_release"
ARCHIVE_BASE = ROOT / "dist_release"


def main() -> None:
    subprocess.run(["python3", str(ROOT / "scripts" / "build_release.py")], check=True)

    zip_path = ROOT / "dist_release.zip"
    if zip_path.exists():
        zip_path.unlink()

    shutil.make_archive(str(ARCHIVE_BASE), "zip", root_dir=str(ROOT), base_dir="dist_release")
    print(f"Packaged release archive: {zip_path}")


if __name__ == "__main__":
    main()
