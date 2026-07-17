import time
from query import ask

def is_grounded(answer, expected_keywords):
    no_info_phrases = ["don't have enough information", "do not have enough information", "not enough information"]
    if any(phrase in answer.lower() for phrase in no_info_phrases):
        return False
    return any(kw.lower() in answer.lower() for kw in expected_keywords)

test_questions = [
    {"question": "What is asymptotic notation used for?", "expected_keywords": ["running time", "growth", "bound", "algorithm"]},
    {"question": "What is Big-O notation?", "expected_keywords": ["upper bound", "worst case", "O("]},
    {"question": "What is the master method used for?", "expected_keywords": ["recurrence", "master"]},
    {"question": "How does merge sort work?", "expected_keywords": ["divide", "merge", "sub-problem"]},
    {"question": "How does quicksort work?", "expected_keywords": ["partition", "pivot"]},
    {"question": "What is a heap data structure?", "expected_keywords": ["heap", "array", "tree"]},
    {"question": "How does counting sort work?", "expected_keywords": ["counting", "array"]},
    {"question": "What is radix sort?", "expected_keywords": ["digit", "radix"]},
    {"question": "What is hashing used for?", "expected_keywords": ["hash", "key"]},
    
    
]

def run_eval():
    results = []
    for item in test_questions:
        start = time.time()
        answer, docs = ask(item["question"])
        elapsed = time.time() - start
        grounded = is_grounded(answer, item["expected_keywords"])
        results.append({"question": item["question"], "grounded": grounded, "latency_sec": round(elapsed, 2)})
        print(f"Q: {item['question']}\n  Answer: {answer[:200]}\n  Grounded: {grounded} | Time: {elapsed:.2f}s\n")

    grounded_count = sum(1 for r in results if r["grounded"])
    avg_latency = sum(r["latency_sec"] for r in results) / len(results)
    print(f"\nSUMMARY: {grounded_count}/{len(results)} grounded answers, avg latency {avg_latency:.2f}s")
    return results

if __name__ == "__main__":
    run_eval()