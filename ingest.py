import os
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS

load_dotenv()

DATA_DIR = "data"
INDEX_DIR = "faiss_index"

def load_documents():
    docs = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith(".pdf"):
            path = os.path.join(DATA_DIR, filename)
            loader = PyPDFLoader(path)
            docs.extend(loader.load())
    return docs

def main():
    print("Loading PDFs...")
    docs = load_documents()
    print(f"Loaded {len(docs)} pages.")

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    print(f"Split into {len(chunks)} chunks.")

    print("Embedding chunks (may take a minute)...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(chunks, embeddings)

    vectorstore.save_local(INDEX_DIR)
    print(f"Index saved to {INDEX_DIR}/")

if __name__ == "__main__":
    main()