import streamlit as st
from query import ask
from quiz import generate_quiz, save_result, get_weak_topics

st.set_page_config(page_title="EduMentor AI", page_icon="🎓")
st.title("🎓 EduMentor AI")
st.caption("Your personalized AI study assistant")

tab1, tab2, tab3 = st.tabs(["Ask a Question", "Take a Quiz", "My Weak Topics"])

with tab1:
    question = st.text_input("Ask something about your course material:")
    if st.button("Ask") and question:
        with st.spinner("Thinking..."):
            answer, sources = ask(question)
        st.write(answer)

with tab2:
    topic = st.text_input("Enter a topic to quiz yourself on:")
    if st.button("Generate Quiz") and topic:
        with st.spinner("Generating quiz..."):
            st.session_state.quiz = generate_quiz(topic)
            st.session_state.quiz_topic = topic

    if "quiz" in st.session_state:
        answers = {}
        for i, q in enumerate(st.session_state.quiz):
            st.write(f"**{i+1}. {q['question']}**")
            answers[i] = st.radio(
                "Choose:", list(q["options"].keys()),
                format_func=lambda k, q=q: f"{k}: {q['options'][k]}",
                key=f"q{i}"
            )
        if st.button("Submit Quiz"):
            correct = sum(1 for i, q in enumerate(st.session_state.quiz) if answers[i] == q["answer"])
            score = round(100 * correct / len(st.session_state.quiz))
            st.success(f"Score: {score}%")
            save_result(st.session_state.quiz_topic, score)

with tab3:
    weak = get_weak_topics()
    if weak:
        st.warning("Topics to review: " + ", ".join(weak))
    else:
        st.info("No weak topics yet — take a quiz first!")
        