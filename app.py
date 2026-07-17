import streamlit as st
from query import ask
from quiz import generate_quiz, save_result, get_weak_topics

# 1. PAGE CONFIGURATION
st.set_page_config(
    page_title="EduMentor AI", 
    page_icon="🎓", 
    layout="centered",
    initial_sidebar_state="expanded"
)

# 2. SIDEBAR - Global Controls
with st.sidebar:
    st.title("🎓 EduMentor AI")
    st.caption("Agentic RAG Tutoring Assistant")
    st.divider()
    
    if st.button("🗑️ Clear Chat History", use_container_width=True):
        st.session_state.messages = []
        st.rerun()
        
    st.markdown("---")
    st.markdown("Built with LangChain, FAISS & Streamlit 🚀")

# 3. INITIALIZE SESSION STATE
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hello! I am EduMentor AI. What are we studying today?"}
    ]

# 4. MAIN UI HEADER
st.title("🎓 EduMentor AI")
st.caption("Your personalized AI study assistant")

# Create stylish tabs
tab1, tab2, tab3 = st.tabs(["💬 Chat & Learn", "📝 Take a Quiz", "📊 My Weak Topics"])

# ==========================================
# TAB 1: CHAT & LEARN (Replaces simple input)
# ==========================================
with tab1:
    st.markdown("#### Ask questions about your course material")
    
    # Render chat history
    for msg in st.session_state.messages:
        avatar = "🤖" if msg["role"] == "assistant" else "👤"
        with st.chat_message(msg["role"], avatar=avatar):
            st.markdown(msg["content"])

    # Chat input area
    if prompt := st.chat_input("Ask a question here..."):
        # Display user message instantly
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user", avatar="👤"):
            st.markdown(prompt)

        # Generate and display assistant response
        with st.chat_message("assistant", avatar="🤖"):
            with st.status("🧠 Searching knowledge base...", expanded=True) as status:
                st.write("Retrieving context from course materials...")
                # Call your backend logic
                answer, sources = ask(prompt)
                status.update(label="Response generated!", state="complete", expanded=False)
            
            st.markdown(answer)
            
            # Show sources if they exist in a clean dropdown
            if sources:
                with st.expander("📚 View Retrieved Sources"):
                    st.write(sources)
            
            # Save to memory
            st.session_state.messages.append({"role": "assistant", "content": answer})


# ==========================================
# TAB 2: TAKE A QUIZ
# ==========================================
with tab2:
    st.markdown("#### Test your knowledge")
    
    # Place input and button in columns for a cleaner look
    col1, col2 = st.columns([3, 1])
    with col1:
        topic = st.text_input("Enter a topic to quiz yourself on:", placeholder="e.g., Data Warehousing")
    with col2:
        st.write("") # Spacing alignment
        st.write("")
        generate_btn = st.button("Generate Quiz", type="primary", use_container_width=True)

    if generate_btn and topic:
        with st.spinner(f"Generating questions for '{topic}'..."):
            st.session_state.quiz = generate_quiz(topic)
            st.session_state.quiz_topic = topic
            st.session_state.quiz_submitted = False # Reset state for new quiz

    if "quiz" in st.session_state and st.session_state.quiz:
        st.divider()
        st.subheader(f"Quiz: {st.session_state.quiz_topic}")
        
        # Use st.form to prevent the app from rerunning every time a user clicks a radio button
        with st.form("quiz_form"):
            answers = {}
            for i, q in enumerate(st.session_state.quiz):
                st.markdown(f"**{i+1}. {q['question']}**")
                
                # Render options safely
                answers[i] = st.radio(
                    "Choose your answer:", 
                    list(q["options"].keys()),
                    format_func=lambda k, q=q: f"{k}: {q['options'][k]}",
                    key=f"q_{i}",
                    label_visibility="collapsed"
                )
                st.write("") # Spacing between questions
                
            submit_btn = st.form_submit_button("Submit Quiz")
            
            if submit_btn:
                correct = sum(1 for i, q in enumerate(st.session_state.quiz) if answers[i] == q["answer"])
                score = round(100 * correct / len(st.session_state.quiz))
                
                # Visual feedback based on score
                if score >= 80:
                    st.balloons()
                    st.success(f"🎉 Outstanding! You scored {score}%")
                elif score >= 50:
                    st.warning(f"👍 Good effort! You scored {score}%. Keep reviewing.")
                else:
                    st.error(f"Score: {score}%. Let's spend some more time reviewing this topic.")
                
                # Save the result to your backend
                save_result(st.session_state.quiz_topic, score)


# ==========================================
# TAB 3: PERFORMANCE ANALYTICS
# ==========================================
with tab3:
    st.markdown("#### 📈 Performance Analytics")
    
    # Fetch weak topics from your backend
    weak = get_weak_topics()
    
    if weak:
        st.warning("⚠️ **Topics that need more review:**")
        for w in weak:
            st.markdown(f"- {w}")
        
        st.divider()
        st.info("💡 **Study Tip:** Go back to the 'Chat & Learn' tab and ask me to explain these topics using simpler terms or real-world examples!")
    else:
        st.success("🌟 You don't have any weak topics right now! Take a quiz in the previous tab to start tracking your progress.")