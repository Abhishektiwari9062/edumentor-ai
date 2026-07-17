---
title: EduMentor AI
emoji: 🎓
colorFrom: blue
colorTo: purple
sdk: streamlit
sdk_version: "1.38.0"
app_file: app.py
pinned: false
---

# EduMentor AI 🎓🤖

EduMentor AI is an intelligent, AI-powered platform designed to enhance the learning experience. It acts as a virtual mentor, providing personalized guidance, answering academic queries, and supporting students in their educational journey.

***Agentic RAG tutoring system with 90% grounded- answer rate across a 10 question eval set; live demo deployed on streamlit.app***
link to app -- "https://edumentor-ai-s9bb3f5wwwqdszjfpy79fg.streamlit.app/"


# EduMentor AI 🎓🤖 - 9/9 grounded cases with average latency of 2.34sec

**EduMentor AI** is an Agentic RAG-based personalized tutoring assistant designed to provide intelligent, context-aware educational support. 

🔴 **[Live Demo](https://edumentor-ai-s9bb3f5wwwqdszjfpy79fg.streamlit.app/)**

## 🛠️ Tech Stack

This project is strictly built using the following technologies:
*   **Python:** Core programming language.
*   **Streamlit:** For building the interactive web user interface.
*   **LangChain:** Framework for developing the Agentic RAG (Retrieval-Augmented Generation) pipeline.
*   **Google Gemini API:** The underlying Large Language Model powering the conversational agent.
*   **FAISS (Facebook AI Similarity Search):** For efficient vector storage and similarity search of educational documents/context.

## 🌟 Key Features

*   **Agentic RAG System:** Intelligently retrieves relevant educational context before generating responses, ensuring accurate and grounded answers.
*   **Personalized Tutoring:** Adapts to user queries to act as a dedicated virtual tutor.
*   **Interactive Chat UI:** Clean and responsive chat interface built entirely in Python using Streamlit.
*   **High-Performance Search:** Utilizes FAISS vector database for lightning-fast document retrieval.

## 🚀 Getting Started

### Prerequisites
Make sure you have Python installed (Python 3.8+ recommended) and Git.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Abhishektiwari9062/edumentor-ai.git](https://github.com/Abhishektiwari9062/edumentor-ai.git)
    cd edumentor-ai
    ```

2.  **Create a Virtual Environment (Recommended):**
    ```bash
    python -m venv venv
    
    # Activate on Windows:
    venv\Scripts\activate
    # Activate on macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment Variables:**
    Create a `.env` file in the root directory (or use Streamlit secrets) and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_google_gemini_api_key_here
    ```

5.  **Run the Streamlit application:**
    ```bash
    streamlit run app.py 
    ```
    *(Note: Replace `app.py` with the name of your main Streamlit file if it's named differently).*

## 📬 Contact

**Abhishek Tiwari** - [GitHub Profile](https://github.com/Abhishektiwari9062)