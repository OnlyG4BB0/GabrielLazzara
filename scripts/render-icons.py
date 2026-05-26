"""Render crystal favicon PNGs with transparent background (no Cairo required)."""
from pathlib import Path

from PIL import Image, ImageDraw

BASE_POLYGONS = [
    ([(25, 15), (40, 40), (10, 45)], "#d8b4fe"),
    ([(75, 15), (60, 40), (90, 45)], "#a855f7"),
    ([(10, 45), (40, 40), (50, 85)], "#9333ea"),
    ([(90, 45), (60, 40), (50, 85)], "#4f46e5"),
    ([(40, 40), (60, 40), (50, 48)], "#f0abfc"),
    ([(40, 40), (50, 48), (50, 85)], "#c084fc"),
    ([(60, 40), (50, 48), (50, 85)], "#6366f1"),
    ([(46, 77), (54, 77), (50, 85)], "#ffffff"),
]

# Slightly larger crystal — less empty corner area in the favicon square
CRYSTAL_SCALE = 1.14
CRYSTAL_CENTER = (50, 50)


def scaled_polygons():
    cx, cy = CRYSTAL_CENTER
    scaled = []
    for points, fill in BASE_POLYGONS:
        pts = [
            (cx + (x - cx) * CRYSTAL_SCALE, cy + (y - cy) * CRYSTAL_SCALE)
            for x, y in points
        ]
        scaled.append((pts, fill))
    return scaled


POLYGONS = scaled_polygons()

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def hex_rgba(color: str) -> tuple[int, int, int, int]:
    color = color.lstrip("#")
    r, g, b = (int(color[i : i + 2], 16) for i in (0, 2, 4))
    return r, g, b, 255


def render(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    scale = size / 100.0
    for points, fill in POLYGONS:
        flat = [coord for x, y in points for coord in (x * scale, y * scale)]
        draw.polygon(flat, fill=hex_rgba(fill))
    return img


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    outputs = {
        ASSETS / "icon-48.png": 48,
        ASSETS / "icon-192.png": 192,
        ASSETS / "icon-512.png": 512,
        ROOT / "favicon-48.png": 48,
        ROOT / "apple-touch-icon.png": 180,
    }
    for path, size in outputs.items():
        render(size).save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({size}px)")

    ico_sizes = [16, 32, 48]
    ico_images = [render(size) for size in ico_sizes]
    ico_path = ROOT / "favicon.ico"
    # Largest frame first — required for multi-size ICO
    ico_images[-1].save(
        ico_path,
        format="ICO",
        sizes=[(size, size) for size in ico_sizes],
        append_images=ico_images[:-1],
    )
    print(f"wrote {ico_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
