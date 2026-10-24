#!/usr/bin/env python3
"""Make web-sized WebP copies of the images, without touching the originals.

Usage:
    python3 scripts/optimize_images.py [SRC_DIR] [OUT_DIR] [--max 1600] [--quality 82]

Defaults: SRC_DIR=images/art, OUT_DIR=optimized/<SRC_DIR name>.
Needs Pillow (pip install pillow). Review the results, then copy the ones you
want into images/ and update the src attributes in index.html.
Keep the full-size originals somewhere outside the repo.
"""
import argparse
from pathlib import Path

from PIL import Image, ImageOps

EXTENSIONS = {".png", ".jpg", ".jpeg"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("src", nargs="?", default="images/art")
    parser.add_argument("out", nargs="?")
    parser.add_argument("--max", type=int, default=1600, help="longest side in pixels (default 1600)")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality 1-100 (default 82)")
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out) if args.out else Path("optimized") / src.name
    out.mkdir(parents=True, exist_ok=True)

    total_before = total_after = 0
    for path in sorted(p for p in src.rglob("*") if p.suffix.lower() in EXTENSIONS):
        with Image.open(path) as img:
            img = ImageOps.exif_transpose(img)  # respect phone-photo rotation
            img.thumbnail((args.max, args.max), Image.LANCZOS)  # only ever shrinks
            target = out / path.relative_to(src).with_suffix(".webp")
            target.parent.mkdir(parents=True, exist_ok=True)
            img.save(target, "WEBP", quality=args.quality, method=6)
        before, after = path.stat().st_size, target.stat().st_size
        total_before += before
        total_after += after
        print(f"{before / 1e6:6.2f} MB -> {after / 1e6:5.2f} MB  {path.name}")

    if total_before:
        print(f"\nTotal: {total_before / 1e6:.1f} MB -> {total_after / 1e6:.1f} MB "
              f"({100 - 100 * total_after / total_before:.0f}% smaller)")


if __name__ == "__main__":
    main()
