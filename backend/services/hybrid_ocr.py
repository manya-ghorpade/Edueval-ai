import cv2
import torch
from PIL import Image
from langdetect import detect

import easyocr
from transformers import TrOCRProcessor, VisionEncoderDecoderModel


# -----------------------------
# Setup
# -----------------------------

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

trocr_processor = TrOCRProcessor.from_pretrained("microsoft/trocr-large-handwritten")
trocr_model = VisionEncoderDecoderModel.from_pretrained(
    "microsoft/trocr-large-handwritten"
).to(DEVICE)

# EasyOCR (multilingual detector)
easy_reader = easyocr.Reader(["en"], gpu=torch.cuda.is_available())


# -----------------------------
# Preprocess crop
# -----------------------------

def preprocess_crop(crop):
    if crop is None or crop.size == 0:
        return None

    # if crop height or width too small
    if crop.shape[0] < 10 or crop.shape[1] < 20:
        return None

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    gray = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return thresh



# -----------------------------
# Detect text boxes using EasyOCR
# -----------------------------

def detect_boxes_easyocr(image_path: str):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Image not found")

    results = easy_reader.readtext(image_path)

    boxes = []
    for (bbox, text, conf) in results:
        xs = [p[0] for p in bbox]
        ys = [p[1] for p in bbox]
        x1, x2 = int(min(xs)), int(max(xs))
        y1, y2 = int(min(ys)), int(max(ys))

        if (x2 - x1) < 30 or (y2 - y1) < 15:
            continue

        boxes.append((x1, y1, x2, y2))

    boxes.sort(key=lambda b: b[1])  # top-to-bottom
    return boxes



def sort_boxes_reading_order(boxes, y_threshold=25):
    """
    Sort boxes into proper reading order:
    - group into lines by y
    - inside each line sort by x
    """
    if not boxes:
        return []

    # Sort by top y first
    boxes = sorted(boxes, key=lambda b: b[1])

    lines = []
    current_line = [boxes[0]]

    for b in boxes[1:]:
        prev = current_line[-1]

        # if y difference small => same line
        if abs(b[1] - prev[1]) < y_threshold:
            current_line.append(b)
        else:
            lines.append(current_line)
            current_line = [b]

    lines.append(current_line)

    # Sort each line left to right
    sorted_boxes = []
    for line in lines:
        line_sorted = sorted(line, key=lambda b: b[0])
        sorted_boxes.extend(line_sorted)

    return sorted_boxes

# -----------------------------
# TrOCR line OCR using detected boxes
# -----------------------------

def run_trocr_lines(image_path: str) -> str:
    img = cv2.imread(image_path)
    if img is None:
        return ""

    h, w = img.shape[:2]
    boxes = detect_boxes_easyocr(image_path)
    boxes = sort_boxes_reading_order(boxes)


    if not boxes:
        return ""

    final_lines = []

    for (x1, y1, x2, y2) in boxes:

        # clamp to image size
        x1 = max(0, min(w - 1, x1))
        x2 = max(0, min(w - 1, x2))
        y1 = max(0, min(h - 1, y1))
        y2 = max(0, min(h - 1, y2))

        if x2 <= x1 or y2 <= y1:
            continue

        crop = img[y1:y2, x1:x2]

        if crop is None or crop.size == 0:
            continue

        processed = preprocess_crop(crop)
        if processed is None:
            continue
        pil_img = Image.fromarray(processed).convert("RGB")

        pixel_values = trocr_processor(images=pil_img, return_tensors="pt").pixel_values.to(DEVICE)

        generated_ids = trocr_model.generate(pixel_values, max_new_tokens=128)
        text = trocr_processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()

        if text:
            final_lines.append(text)

    return "\n".join(final_lines)


# -----------------------------
# Final function used by backend
# -----------------------------

def hybrid_ocr(image_path: str):
    text = run_trocr_lines(image_path)

    try:
        lang = detect(text) if text else "unknown"
    except:
        lang = "unknown"

    return text, "trocr-large-lines", lang
