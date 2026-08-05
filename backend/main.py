# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from query import ask
from quiz import generate_quiz
from memory import get_last_topic
import shutil
from fastapi import UploadFile, File, HTTPException
from ingest import add_pdf_to_index
from query import reload_vectorstore

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    question: str
    session_id: str = "default"

@app.post("/api/chat")
def chat(req: ChatRequest):
    answer, docs = ask(req.question, session_id=req.session_id)
    sources = [
        {"source": d.metadata.get("source", "?"), "page": d.metadata.get("page", "?")}
        for d in docs
    ]
    return {"answer": answer, "sources": sources}

@app.post("/api/quiz")
def quiz(topic: str):
    result = generate_quiz(topic)
    return {"quiz": result}

@app.get("/api/greeting")
def greeting(session_id: str = "default"):
    hour = datetime.utcnow().hour
    if hour < 12:
        time_greeting = "Good morning"
    elif hour < 17:
        time_greeting = "Good afternoon"
    else:
        time_greeting = "Good evening"

    last_topic = get_last_topic(session_id)
    if last_topic:
        message = f"{time_greeting}, Boss. Systems online. Last time we were looking at '{last_topic}' — want to pick up where we left off, or start fresh?"
    else:
        message = f"{time_greeting}, Boss. Systems online. What are we working on today?"

    return {"greeting": message}

@app.get("/api/health")
def health():
    return {"status": "ok"}
import sqlite3

@app.get("/api/stats")
def stats(session_id: str = "default"):
    conn = sqlite3.connect("jarvis_memory.db")

    total = conn.execute(
        "SELECT COUNT(*) FROM conversations WHERE session_id = ?", (session_id,)
    ).fetchone()[0]

    by_intent = conn.execute(
        "SELECT intent, COUNT(*) FROM conversations WHERE session_id = ? GROUP BY intent",
        (session_id,)
    ).fetchall()

    recent = conn.execute(
        "SELECT question, intent, timestamp FROM conversations WHERE session_id = ? ORDER BY id DESC LIMIT 10",
        (session_id,)
    ).fetchall()

    conn.close()

    return {
        "total_conversations": total,
        "by_intent": [{"intent": i, "count": c} for i, c in by_intent],
        "recent": [{"question": q, "intent": i, "timestamp": t} for q, i, t in recent],
    }

UPLOAD_DIR = "data"

import threading
import uuid

upload_jobs = {}  # job_id -> {"status": "processing"|"done"|"error", "chunks_added": int, "message": str}

def process_pdf_background(job_id, save_path):
    def on_progress(done, total):
        upload_jobs[job_id] = {
            "status": "processing",
            "chunks_added": done,
            "message": f"Indexing... {done}/{total} chunks embedded.",
        }
    try:
        chunk_count = add_pdf_to_index(save_path, progress_callback=on_progress)
        reload_vectorstore()
        upload_jobs[job_id] = {
            "status": "done",
            "chunks_added": chunk_count,
            "message": f"Indexed successfully — {chunk_count} chunks added to the knowledge base.",
        }
    except Exception as e:
        upload_jobs[job_id] = {"status": "error", "chunks_added": 0, "message": str(e)}

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    job_id = str(uuid.uuid4())
    upload_jobs[job_id] = {"status": "processing", "chunks_added": 0, "message": "Indexing started..."}

    thread = threading.Thread(target=process_pdf_background, args=(job_id, save_path))
    thread.start()

    return {"job_id": job_id, "status": "processing", "message": "Upload received, indexing in the background."}

@app.get("/api/upload-status/{job_id}")
def upload_status(job_id: str):
    job = upload_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job