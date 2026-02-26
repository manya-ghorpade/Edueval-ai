import re
from typing import Dict, List

from sentence_transformers import SentenceTransformer, util

# Use same SBERT model
embedder = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")


def _clean_text(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def split_sentences(text: str) -> List[str]:
    text = _clean_text(text)
    if not text:
        return []

    parts = re.split(r"(?<=[.!?])\s+|\n+", text)

    sentences = []
    for s in parts:
        s = s.strip()
        if len(s) >= 12:
            sentences.append(s)

    return sentences


def explain_answer(student_text: str, model_text: str) -> Dict:
    student_text = (student_text or "").strip()
    model_text = (model_text or "").strip()

    if not student_text or not model_text:
        return {
            "similarity": 0.0,
            "length_ratio": 0.0,
            "matched": [],
            "missing": [],
            "explanation": "No text detected in the student answer."
        }

    # overall similarity
    emb1 = embedder.encode(student_text, convert_to_tensor=True)
    emb2 = embedder.encode(model_text, convert_to_tensor=True)
    sim = util.cos_sim(emb1, emb2).item()
    sim = max(0.0, min(sim, 1.0))

    # length ratio
    length_ratio = min(len(student_text) / max(len(model_text), 1), 1.0)

    # sentence matching
    student_sents = split_sentences(student_text)
    model_sents = split_sentences(model_text)

    if not student_sents or not model_sents:
        return {
            "similarity": round(sim, 3),
            "length_ratio": round(length_ratio, 3),
            "matched": [],
            "missing": model_sents[:6],
            "explanation": "Not enough sentence content to compare."
        }

    stu_emb = embedder.encode(student_sents, convert_to_tensor=True)
    mod_emb = embedder.encode(model_sents, convert_to_tensor=True)

    matched = []
    matched_model_idx = set()

    SENT_MATCH_THRESHOLD = 0.35

    for i, stu_sent in enumerate(student_sents):
        sims = util.cos_sim(stu_emb[i], mod_emb)[0]
        best_j = int(sims.argmax())
        best_sim = float(sims[best_j].item())

        if best_sim >= SENT_MATCH_THRESHOLD:
            matched.append({
                "student_sentence": stu_sent,
                "model_sentence": model_sents[best_j],
                "similarity": round(best_sim, 3)
            })
            matched_model_idx.add(best_j)

    missing = []
    for j, mod_sent in enumerate(model_sents):
        if j not in matched_model_idx:
            missing.append(mod_sent)

    matched = sorted(matched, key=lambda x: x["similarity"], reverse=True)
    matched = matched[:5]
    missing = missing[:5]

    # explanation generation
    if sim >= 0.75:
        sim_text = "Your answer is highly related to the model answer."
    elif sim >= 0.55:
        sim_text = "Your answer is moderately related to the model answer."
    elif sim >= 0.35:
        sim_text = "Your answer is weakly related to the model answer."
    else:
        sim_text = "Your answer is mostly not related to the model answer."

    if length_ratio >= 0.85:
        len_text = "Your answer length is close to the model answer."
    elif length_ratio >= 0.55:
        len_text = "Your answer is shorter than the model answer."
    else:
        len_text = "Your answer is very short compared to the model answer."

    missing_text = ""
    if missing:
        missing_text = "Missing important points: " + "; ".join(missing[:3]) + "."

    matched_text = ""
    if matched:
        matched_text = "Matched points: " + "; ".join(
            [m["model_sentence"] for m in matched[:2]]
        ) + "."

    explanation = f"{sim_text} {len_text} {matched_text} {missing_text}".strip()

    return {
        "similarity": round(sim, 3),
        "length_ratio": round(length_ratio, 3),
        "matched": matched,
        "missing": missing,
        "explanation": explanation
    }
