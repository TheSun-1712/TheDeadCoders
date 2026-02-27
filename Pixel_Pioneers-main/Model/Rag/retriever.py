from .embeddings import load_embedding_model
import numpy as np

class Retriever:
    def __init__(self, documents, vector_store):
        self.documents = documents
        self.vector_store = vector_store
        self.model = load_embedding_model()

    def retrieve(self, query, k=3):
        query_embedding = self.model.encode([query])
        indices = self.vector_store.search(query_embedding, k)
        return [self.documents[i] for i in indices]
