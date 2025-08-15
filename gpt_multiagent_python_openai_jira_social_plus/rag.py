
import os, glob
from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class Retriever:
    def __init__(self, base_dir="rag"):
        self.base = base_dir
        self.vectorizers: Dict[str, Tuple[TfidfVectorizer, any]] = {}
        self.docs: Dict[str, List[str]] = {}
        self._build_all()

    def _load_texts(self, agent: str) -> List[str]:
        path = os.path.join(self.base, agent)
        texts = []
        for fp in glob.glob(os.path.join(path, "**", "*.md"), recursive=True):
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    texts.append(f.read())
            except Exception:
                pass
        return texts or [""]

    def _build_all(self):
        agents = ["product_builder","blablakas_ops","kascomodation_ops","social_manager"]
        for a in agents:
            texts = self._load_texts(a)
            self.docs[a] = texts
            vec = TfidfVectorizer(max_features=4096, stop_words="english")
            X = vec.fit_transform(texts)
            self.vectorizers[a] = (vec, X)

    def retrieve(self, agent: str, query: str, k: int = 3) -> List[str]:
        pair = self.vectorizers.get(agent)
        if not pair: return []
        vec, X = pair
        q = vec.transform([query])
        sims = cosine_similarity(q, X).ravel()
        idx = sims.argsort()[::-1][:k]
        return [self.docs[agent][i] for i in idx if sims[i] > 0.0]

RETRIEVER = Retriever()
