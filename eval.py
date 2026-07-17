import time
from query import ask

# Each question can have MULTIPLE acceptable keywords — grounded if ANY appear
test_questions = [
    {"question": "What is the purpose of cache memory?", "expected_keywords": ["speed", "access time", "faster"]},
    {"question": "What is a cache replacement algorithm?", "expected_keywords": ["LRU", "FCFS", "replace"]},
    {"question": "What is direct mapping in cache memory?", "expected_keywords": ["block", "line", "direct"]},
    {"question": "What is set associative mapping?", "expected_keywords": ["set", "associative"]},
    {"question": "What does LRU stand for?", "expected_keywords": ["least recently used"]},
    {"question": "What is dynamic programming?", "expected_keywords": ["optimal substructure", "overlapping subproblem", "memoization"]},
    {"question": "What is Huffman coding used for?", "expected_keywords": ["binary tree", "compression", "encoding"]},
    {"question": "What is average memory access time?", "expected_keywords": ["hit rate", "hit ratio", "access time"]},
    {"question": "What is a tag directory in cache memory?", "expected_keywords": ["tag", "cache line", "cache"]},
]

def run_eval():
    results = []
    for item in test_questions:
        start = time.time()
        answer, docs = ask(item["question"])
        elapsed = time.time() - start
        grounded = any(kw.lower() in answer.lower() for kw in item["expected_keywords"])
        results.append({"question": item["question"], "grounded": grounded, "latency_sec": round(elapsed, 2)})
        print(f"Q: {item['question']}\n  Answer: {answer[:200]}\n  Grounded: {grounded} | Time: {elapsed:.2f}s\n")

    grounded_count = sum(1 for r in results if r["grounded"])
    avg_latency = sum(r["latency_sec"] for r in results) / len(results)
    print(f"\nSUMMARY: {grounded_count}/{len(results)} grounded answers, avg latency {avg_latency:.2f}s")
    return results

if __name__ == "__main__":
    run_eval()