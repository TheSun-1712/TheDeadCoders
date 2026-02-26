import faiss
import numpy as np

class VectorStore:
    def __init__(self, embeddings):
        self.dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(np.array(embeddings))

    def search(self, query_embedding, k=3):
        D, I = self.index.search(np.array(query_embedding), k)

        return I[0]
