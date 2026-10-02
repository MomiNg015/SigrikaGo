from __future__ import annotations

from pathlib import Path
from PIL import Image


CANVAS_SIZE = 1024
CONTENT_SIZE = 900
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "assets" / "costumes"

COSTUME_ASSETS = {
    "sigrika-01": Path(r"C:\Users\Moming\Pictures\q版\シグリ立ち絵2.png"),
    "denia-01": Path(r"C:\Users\Moming\Pictures\q版\ダーニャ.png"),
    "denia-02": Path(r"C:\Users\Moming\Pictures\q版\ダーニャ１.png"),
    "nabomo-01": Path(r"C:\Users\Moming\Pictures\q版\組織長1.png"),
    "nabomo-02": Path(r"C:\Users\Moming\Pictures\q版\組織長3.png"),
}

MASCOT_ASSETS = {
    "nivora-greeting": Path(r"C:\Users\Moming\Pictures\q版\ニヴォラあいさつ.png"),
    "nivora-thanks": Path(r"C:\Users\Moming\Pictures\q版\nivora谢谢惠顾.png"),
    "nivora-empty": Path(r"C:\Users\Moming\Pictures\q版\nivora空或刷新.png"),
}


def alpha_crop(source_path: Path) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    alpha_bounds = source.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError(f"{source_path} contains no visible pixels")
    return source.crop(alpha_bounds)


def normalized_costume(source_path: Path) -> Image.Image:
    cropped = alpha_crop(source_path)
    scale = CONTENT_SIZE / max(cropped.width, cropped.height)
    return cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )


def normalized_mascot_canvas(source_path: Path) -> Image.Image:
    cropped = alpha_crop(source_path)
    scale = min(CONTENT_SIZE / cropped.width, CONTENT_SIZE / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    x = (CANVAS_SIZE - resized.width) // 2
    y = (CANVAS_SIZE - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, source_path in COSTUME_ASSETS.items():
        image = normalized_costume(source_path)
        webp_path = OUTPUT_DIR / f"{name}.webp"
        image.save(webp_path, format="WEBP", lossless=True, method=6, exact=True)
        print(f"{name}: {image.size[0]}x{image.size[1]} -> {webp_path.relative_to(ROOT)}")
    for name, source_path in MASCOT_ASSETS.items():
        image = normalized_mascot_canvas(source_path)
        webp_path = OUTPUT_DIR / f"{name}.webp"
        image.save(webp_path, format="WEBP", lossless=True, method=6, exact=True)
        print(f"{name}: {image.size[0]}x{image.size[1]} -> {webp_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
