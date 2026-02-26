import os
import fitz  # PyMuPDF
from config import UPLOAD_DIR


def pdf_to_images(pdf_path: str) -> list:
    """
    Converts PDF pages into images.
    Returns list of image paths.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    doc = fitz.open(pdf_path)
    paths = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(dpi=200)

        out_path = os.path.join(
            UPLOAD_DIR,
            f"page_{page_num+1}_{os.path.basename(pdf_path)}.png"
        )

        pix.save(out_path)
        paths.append(out_path)

    return paths
