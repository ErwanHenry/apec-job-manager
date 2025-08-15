"""
Version allégée du système RAG pour Vercel (sans scikit-learn)
Utilise une recherche textuelle simple au lieu de TF-IDF
"""
import os
import glob
from typing import List, Dict

class SimpleBM25Retriever:
    def __init__(self, base_dir="rag"):
        self.base = base_dir
        self.docs: Dict[str, List[str]] = {}
        self._load_all()

    def _load_texts(self, agent: str) -> List[str]:
        path = os.path.join(self.base, agent)
        texts = []
        if not os.path.exists(path):
            return [""]
        
        for fp in glob.glob(os.path.join(path, "**", "*.md"), recursive=True):
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    content = f.read()
                    # Split into smaller chunks for better retrieval
                    chunks = content.split('\n\n')
                    texts.extend([chunk.strip() for chunk in chunks if chunk.strip()])
            except Exception:
                pass
        return texts or [""]

    def _load_all(self):
        agents = ["product_builder", "blablakas_ops", "kascomodation_ops", "social_manager"]
        for agent in agents:
            self.docs[agent] = self._load_texts(agent)

    def _simple_score(self, query: str, document: str) -> float:
        """Simple scoring based on keyword overlap"""
        query_words = set(query.lower().split())
        doc_words = set(document.lower().split())
        
        if not query_words:
            return 0.0
            
        # Count overlapping words
        overlap = len(query_words.intersection(doc_words))
        return overlap / len(query_words) if query_words else 0.0

    def retrieve(self, agent: str, query: str, k: int = 3) -> List[str]:
        docs = self.docs.get(agent, [])
        if not docs or not query.strip():
            return []
        
        # Score all documents
        scored_docs = []
        for doc in docs:
            score = self._simple_score(query, doc)
            if score > 0:
                scored_docs.append((score, doc))
        
        # Sort by score and return top k
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored_docs[:k]]

# Global instance
RETRIEVER = SimpleBM25Retriever()