from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).parent / "concepts" / "v5-soft-dream-bubble"
NAMES = (
    "a-off-center-pearl-bubble",
    "b-soft-merged-bubbles",
    "c-rounded-refraction-bubble",
)
CANVAS_SIZE = (1125, 240)
ART_BOX = (56, 12, 1069, 228)
SAFE_LEFT = 300
SAFE_RIGHT = 938
USERNAME = "Moming"


def alpha_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    mask = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise RuntimeError("No visible subject after chroma key removal")
    return (
        max(0, bbox[0] - 3),
        max(0, bbox[1] - 3),
        min(image.width, bbox[2] + 3),
        min(image.height, bbox[3] + 3),
    )


def prepare_candidate(keyed: Image.Image) -> Image.Image:
    subject = keyed.crop(alpha_bbox(keyed))
    max_width = ART_BOX[2] - ART_BOX[0]
    max_height = ART_BOX[3] - ART_BOX[1]
    scale = min(max_width / subject.width, max_height / subject.height)
    target_size = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    subject = subject.resize(target_size, Image.Resampling.LANCZOS)

    # Preserve the generated proportions. Keep the identity bubble on the
    # declared left inset and vertically center the complete painted silhouette.
    x = ART_BOX[0]
    y = ART_BOX[1] + (max_height - target_size[1]) // 2
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(subject, (x, y))
    return canvas


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in (
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
    ):
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def add_username(candidate: Image.Image) -> Image.Image:
    preview = candidate.copy()
    draw = ImageDraw.Draw(preview)
    font = load_font(96)
    bbox = draw.textbbox((0, 0), USERNAME, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    x = SAFE_LEFT + ((SAFE_RIGHT - SAFE_LEFT) - width) / 2 - bbox[0]
    y = (CANVAS_SIZE[1] - height) / 2 - bbox[1]

    draw.text(
        (x + 7, y + 8),
        USERNAME,
        font=font,
        fill=(41, 22, 86, 190),
        stroke_width=2,
        stroke_fill=(41, 22, 86, 170),
    )
    draw.text(
        (x, y),
        USERNAME,
        font=font,
        fill=(255, 250, 255, 255),
        stroke_width=2,
        stroke_fill=(111, 69, 170, 225),
    )
    return preview


def main() -> None:
    for directory in ("candidates", "runtime", "previews"):
        (ROOT / directory).mkdir(parents=True, exist_ok=True)

    for name in NAMES:
        keyed = Image.open(ROOT / "key-removed" / f"{name}.png").convert("RGBA")
        candidate = prepare_candidate(keyed)
        candidate.save(ROOT / "candidates" / f"{name}-1125x240.png")
        candidate.resize((150, 32), Image.Resampling.LANCZOS).save(
            ROOT / "runtime" / f"{name}-150x32.png"
        )

        preview = add_username(candidate)
        preview.save(ROOT / "previews" / f"{name}-username-1125x240.png")
        preview.resize((150, 32), Image.Resampling.LANCZOS).save(
            ROOT / "runtime" / f"{name}-username-150x32.png"
        )


if __name__ == "__main__":
    main()
