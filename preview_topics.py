from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

docs = list(vectorstore.docstore._dict.values())
print(f"Total chunks indexed: {len(docs)}\n")

for i, d in enumerate(docs):
    source = d.metadata.get("source", "?")
    page = d.metadata.get("page", "?")
    preview = d.page_content[:120].replace("\n", " ")
    print(f"[{i}] {source} p.{page}: {preview}...")