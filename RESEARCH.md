# Research & Development Log

## 1. The Core Challenge: Grounding the AI
During the development of EduMentor AI, a primary technical hurdle was ensuring the AI tutor did not "hallucinate" information outside of the provided course materials. For an educational tool, accuracy and strict adherence to the syllabus are critical.

## 2. The Architectural Solution: RAG Pipeline
To solve this, I engineered a Retrieval-Augmented Generation (RAG) architecture utilizing LangChain and FAISS (Facebook AI Similarity Search).
*   **Document Chunking:** I built a pipeline to parse complex PDF textbooks and break them down into semantically meaningful chunks, preserving context boundaries.
*   **Vectorization:** These chunks are converted into high-dimensional mathematical embeddings using Google Gemini (`gemini-embedding-001`) and indexed locally in FAISS for rapid similarity search.
*   **Context Injection:** Upon receiving a user query, the backend executes a semantic search against the FAISS index. The top-k most relevant chunks are retrieved and injected directly into the LLM's context window, forcing the model to generate answers grounded strictly in the source material.

## 3. Future Architectural Optimizations
*   **Chunking Strategy:** Experimenting with dynamic chunk overlap sizes to improve context retention across textbook page breaks.
*   **Database Persistence:** Migrating from a local, ephemeral FAISS index to a persistent vector database (such as Supabase pgvector or Pinecone) to allow for scalable, long-term knowledge retention across server restarts.
