from sentence_transformers import SentenceTransformer

_model = None

def load_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def create_embeddings(documents):
    model = load_embedding_model()

    return model.encode(documents)
