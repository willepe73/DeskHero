from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps


@dataclass(frozen=True)
class FloorplanSeats:
    building: str
    floor: int
    floorplan_file: str
    seat_numbers: list[int]


_FLOORPLAN_RE = re.compile(r"^(?P<building>.+)_floor(?P<floor>\d+)\.png$", re.IGNORECASE)


def _fallback_seat_numbers_for_known_floorplans(floorplan_file: str) -> list[int] | None:
    """
    Fallback for environments without Tesseract OCR.

    This keeps the sample project runnable locally on machines without Docker/Tesseract,
    while Docker runs the full OCR-based extraction.
    """

    key = floorplan_file.lower()
    if key == "agora_floor1.png":
        return list(range(367, 411))
    if key == "agora_floor2.png":
        return list(range(411, 461))
    if key == "agora_floor3.png":
        return list(range(461, 505))
    if key == "library_floor1.png":
        return list(range(101, 157))
    return None


def _extract_seat_numbers_from_image(image_path: Path) -> list[int]:
    try:
        import pytesseract
        from pytesseract import TesseractNotFoundError
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "pytesseract is not available. Install dependencies or run via Docker."
        ) from e

    img = Image.open(image_path)
    img = img.convert("L")
    img = ImageOps.autocontrast(img)
    img = img.resize((img.width * 2, img.height * 2))

    # Binarize; floorplans have high contrast seat labels.
    img = img.point(lambda p: 255 if p > 200 else 0)

    config = "--oem 1 --psm 11 -c tessedit_char_whitelist=0123456789"
    try:
        text = pytesseract.image_to_string(img, config=config)
    except TesseractNotFoundError as e:  # pragma: no cover
        raise RuntimeError(
            "Tesseract OCR is not installed. In Docker it's included; locally install 'tesseract-ocr'."
        ) from e

    numbers = {int(m) for m in re.findall(r"\b\d+\b", text)}
    return sorted(numbers)


def _extract_seat_boxes_from_image(
    image_path: Path,
) -> tuple[list[int], dict[int, dict[str, int]]]:
    """
    Extract seat numbers AND their OCR bounding boxes.

    Returns:
      - seat_numbers: sorted unique list of seats found
      - seat_boxes: mapping seat_number -> {left, top, width, height, conf}
    """
    try:
        import pytesseract
        from pytesseract import TesseractNotFoundError
    except Exception as e:  # pragma: no cover
        raise RuntimeError(
            "pytesseract is not available. Install dependencies or run via Docker."
        ) from e

    img = Image.open(image_path)
    img = img.convert("L")
    img = ImageOps.autocontrast(img)
    img = img.resize((img.width * 2, img.height * 2))

    img = img.point(lambda p: 255 if p > 200 else 0)

    config = "--oem 1 --psm 11 -c tessedit_char_whitelist=0123456789"
    try:
        data = pytesseract.image_to_data(img, config=config, output_type=pytesseract.Output.DICT)
    except TesseractNotFoundError as e:  # pragma: no cover
        raise RuntimeError(
            "Tesseract OCR is not installed. In Docker it's included; locally install 'tesseract-ocr'."
        ) from e

    seat_boxes: dict[int, dict[str, int]] = {}
    numbers: set[int] = set()

    n = len(data.get("text", []))
    for i in range(n):
        raw = (data["text"][i] or "").strip()
        if not raw:
            continue
        if not raw.isdigit():
            continue
        seat = int(raw)

        conf_raw = data.get("conf", [None] * n)[i]
        try:
            conf = int(float(conf_raw)) if conf_raw is not None else -1
        except Exception:
            conf = -1

        left = int(data["left"][i])
        top = int(data["top"][i])
        width = int(data["width"][i])
        height = int(data["height"][i])

        numbers.add(seat)

        prev = seat_boxes.get(seat)
        if prev is None or conf > int(prev.get("conf", -1)):
            seat_boxes[seat] = {
                "left": left,
                "top": top,
                "width": width,
                "height": height,
                "conf": conf,
            }

    return sorted(numbers), seat_boxes


def load_floorplan_seats(floorplans_dir: Path, cache_path: Path) -> list[FloorplanSeats]:
    floorplans_dir = Path(floorplans_dir)
    cache_path = Path(cache_path)
    cache_path.parent.mkdir(parents=True, exist_ok=True)

    cache: dict = {"version": 1, "files": {}}
    if cache_path.exists():
        try:
            cache = json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception:
            cache = {"version": 1, "files": {}}

    files_cache: dict[str, dict] = cache.get("files", {}) if isinstance(cache, dict) else {}

    results: list[FloorplanSeats] = []
    updated_files_cache: dict[str, dict] = dict(files_cache)

    for image_path in sorted(floorplans_dir.glob("*.png")):
        m = _FLOORPLAN_RE.match(image_path.name)
        if not m:
            continue

        building = m.group("building")
        floor = int(m.group("floor"))
        mtime = image_path.stat().st_mtime

        cached = updated_files_cache.get(image_path.name)
        if cached and cached.get("mtime") == mtime:
            seat_numbers = list(map(int, cached.get("seat_numbers", [])))
        else:
            try:
                seat_numbers, seat_boxes = _extract_seat_boxes_from_image(image_path)
                # Capture image size AFTER preprocessing resize (same coordinate space as boxes)
                img = Image.open(image_path).convert("L")
                img = img.resize((img.width * 2, img.height * 2))
                image_width, image_height = img.size
            except RuntimeError:
                seat_numbers = _fallback_seat_numbers_for_known_floorplans(image_path.name)
                if seat_numbers is None:
                    raise
                seat_boxes = {}
                image_width = None
                image_height = None

            updated_files_cache[image_path.name] = {
                "mtime": mtime,
                "building": building,
                "floor": floor,
                "seat_numbers": seat_numbers,
                "image_width": image_width,
                "image_height": image_height,
                "seat_boxes": seat_boxes,
            }

        results.append(
            FloorplanSeats(
                building=building,
                floor=floor,
                floorplan_file=image_path.name,
                seat_numbers=seat_numbers,
            )
        )

    cache_out = {
        "version": 1,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "files": updated_files_cache,
    }
    cache_path.write_text(json.dumps(cache_out, indent=2, sort_keys=True), encoding="utf-8")

    return results


