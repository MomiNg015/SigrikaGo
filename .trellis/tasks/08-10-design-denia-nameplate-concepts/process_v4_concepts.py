from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont


ROOT = Path(__file__).parent / "concepts" / "v4-irregular-void-bubble"
NAMES = (
    "a-off-center-membrane",
    "b-merged-bubbles",
    "c-ruptured-membrane",
)
CANVAS_SIZE = (1125, 240)
ART_BOX = (56, 12, 1069, 228)
SAFE_LEFT = 300
SAFE_RIGHT = 938
USERNAME = "Moming"


def chroma_key(image: Image.Image) -> Image.Image:
    red, green, blue = image.convert("RGB").split()
    max_rb = ImageChops.lighter(red, blue)

    # The generated sources use a flat #00ff00 key. Green dominance separates
    # the key from Danya's blue-violet subject while retaining soft painted edges.
    green_excess = ImageChops.subtract(green, max_rb)
    alpha_lut = []
    for value in range(256):
        # Image generation introduces small RGB variation across the nominally
        # flat key. Treat strongly green-dominant pixels as fully transparent,
        # then retain a compact antialiased transition at the painted boundary.
        normalized = max(0.0, min(1.0, (180.0 - value) / 160.0))
        alpha = int(round((normalized ** 0.88) * 255.0))
        alpha_lut.append(0 if alpha < 8 else alpha)
    alpha = green_excess.point(alpha_lut)

    # Suppress residual key spill only where green exceeds the red/blue subject.
    max_rb_plus_five = max_rb.point([min(255, value + 5) for value in range(256)])
    clean_green = ImageChops.darker(green, max_rb_plus_five)
    return Image.merge("RGBA", (red, clean_green, blue, alpha))


def alpha_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    mask = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise RuntimeError("No visible subject after chroma key removal")
    left = max(0, bbox[0] - 3)
    top = max(0, bbox[1] - 3)
    right = min(image.width, bbox[2] + 3)
    bottom = min(image.height, bbox[3] + 3)
    return left, top, right, bottom


def prepare_candidate(keyed: Image.Image) -> Image.Image:
    subject = keyed.crop(alpha_bbox(keyed))
    target_width = ART_BOX[2] - ART_BOX[0]
    target_height = ART_BOX[3] - ART_BOX[1]
    subject = subject.resize((target_width, target_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(subject, (ART_BOX[0], ART_BOX[1]))
    return canvas


def load_font(size: int) -> ImageFont.FreeTypeFont:
    choices = (
        Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
    )
    for path in choices:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def add_username(candidate: Image.Image) -> Image.Image:
    preview = candidate.copy()
    draw = ImageDraw.Draw(preview)
    font = load_font(96)
    bbox = draw.textbbox((0, 0), USERNAME, font=font, stroke_width=0)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    x = SAFE_LEFT + ((SAFE_RIGHT - SAFE_LEFT) - width) / 2 - bbox[0]
    y = (CANVAS_SIZE[1] - height) / 2 - bbox[1]

    draw.text(
        (x + 7, y + 8),
        USERNAME,
        font=font,
        fill=(20, 5, 48, 190),
        stroke_width=2,
        stroke_fill=(20, 5, 48, 170),
    )
    draw.text(
        (x, y),
        USERNAME,
        font=font,
        fill=(255, 246, 255, 255),
        stroke_width=2,
        stroke_fill=(96, 35, 139, 230),
    )
    return preview


def main() -> None:
    for directory in ("key-removed", "candidates", "runtime", "previews"):
        (ROOT / directory).mkdir(parents=True, exist_ok=True)

    for name in NAMES:
        source = Image.open(ROOT / "source" / f"{name}.png")
        keyed = chroma_key(source)
        keyed.save(ROOT / "key-removed" / f"{name}.png")

        candidate = prepare_candidate(keyed)
        candidate.save(ROOT / "candidates" / f"{name}-1125x240.png")

        runtime = candidate.resize((150, 32), Image.Resampling.LANCZOS)
        runtime.save(ROOT / "runtime" / f"{name}-150x32.png")

        preview = add_username(candidate)
        preview.save(ROOT / "previews" / f"{name}-username-1125x240.png")
        preview.resize((150, 32), Image.Resampling.LANCZOS).save(
            ROOT / "runtime" / f"{name}-username-150x32.png"
        )


if __name__ == "__main__":
    main()
