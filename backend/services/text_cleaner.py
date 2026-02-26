import re

def clean_text(text: str) -> str:
    if not text:
        return ""

    # 1) Normalize spaces
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)

    # 2) Remove dot noise between words: "word . word"
    text = re.sub(r"\s*\.\s*", " ", text)

    # 3) Remove unwanted symbols (keep basic punctuation)
    text = re.sub(r"[^A-Za-z0-9\s,.;:!?()\-]", " ", text)

    # 4) Remove repeated punctuation
    text = re.sub(r"([,.;:!?])\1+", r"\1", text)

    

    # 5) Final normalize
    text = re.sub(r"\s+", " ", text).strip()

    return text
