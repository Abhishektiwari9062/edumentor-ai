import streamlit as st
from query import ask
from quiz import generate_quiz, save_result, get_weak_topics

st.set_page_config(
    page_title="EduMentor AI", 
    layout="centered", # Forces a central column like Claude
    initial_sidebar_state="collapsed" # Claude hides the sidebar by default for focus
)
st.markdown("""
<style>
    /* Center and constrain width for readability */
    .block-container {
        max-width: 800px;
        padding-top: 2rem;
        padding-bottom: 5rem;
    }
    
    /* Make chat avatars smaller and more subtle */
    .stChatMessage [data-testid="stChatAvatar"] {
        width: 28px !important;
        height: 28px !important;
        font-size: 16px !important;
        background-color: transparent !important;
    }
    
    /* Clean up the chat input box */
    [data-testid="stChatInput"] {
        border-radius: 12px;
        border: 1px solid #e0e0e0;
        box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.05);
    }
    
    /* Minimalist tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
        border-bottom: 1px solid #f0f0f0;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: transparent;
        color: #555;
    }
    
    /* Hide the default generic Streamlit header */
    header {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

# 3. SIDEBAR (Minimalist history/settings)
with st.sidebar:
    st.markdown("### EduMentor AI")
    st.caption("Agentic RAG Assistant")
    
    if st.button("Start new chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# 4. INITIALIZE SESSION STATE
if "messages" not in st.session_state:
    st.session_state.messages = []

# Create elegant tabs without emojis
tab1, tab2, tab3 = st.tabs(["Chat", "Knowledge Check", "Analytics"])

with tab1:
    # Empty State Welcome Message (like Claude's homepage)
    if not st.session_state.messages:
        st.markdown("<h2 style='text-align: center; margin-top: 10vh; font-weight: 400; color: #333;'>How can I help you learn today?</h2>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #666; margin-bottom: 5vh;'>Ask questions about your uploaded course materials.</p>", unsafe_allow_html=True)
    
    # Render chat history
    for msg in st.session_state.messages:
        # Using subtle text/icon representation instead of heavy graphics
        avatar = "✨" if msg["role"] == "assistant" else "👤"
        with st.chat_message(msg["role"], avatar=avatar):
            st.markdown(msg["content"])

    # Chat input area
    if prompt := st.chat_input("Message EduMentor..."):
        # Display user message instantly
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user", avatar="👤"):
            st.markdown(prompt)

        # Generate and display assistant response
        with st.chat_message("assistant", avatar="✨"):
            with st.spinner("Analyzing context..."):
                answer, sources = ask(prompt)
            
            st.markdown(answer)
            
            # Subtle source display
            if sources:
                with st.expander("View source documents", expanded=False):
                    st.caption(sources)
            
            # Save to memory
            st.session_state.messages.append({"role": "assistant", "content": answer})

with tab2:
    st.markdown("### Test your understanding")
    st.write("Generate a personalized quiz based on your materials.")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        topic = st.text_input("Topic:", placeholder="e.g., Data Warehousing", label_visibility="collapsed")
    with col2:
        generate_btn = st.button("Generate", use_container_width=True)

    if generate_btn and topic:
        with st.spinner("Crafting questions..."):
            st.session_state.quiz = generate_quiz(topic)
            st.session_state.quiz_topic = topic
            st.session_state.quiz_submitted = False 

    if "quiz" in st.session_state and st.session_state.quiz:
        st.markdown("---")
        with st.form("quiz_form"):
            answers = {}
            for i, q in enumerate(st.session_state.quiz):
                st.markdown(f"**{i+1}. {q['question']}**")
                
                answers[i] = st.radio(
                    "Choose:", 
                    list(q["options"].keys()),
                    format_func=lambda k, q=q: f"{q['options'][k]}",
                    key=f"q_{i}",
                    label_visibility="collapsed"
                )
                st.write("")
                
            if st.form_submit_button("Submit Answers"):
                correct = sum(1 for i, q in enumerate(st.session_state.quiz) if answers[i] == q["answer"])
                score = round(100 * correct / len(st.session_state.quiz))
                
                if score >= 80:
                    st.success(f"Excellent work. Score: {score}%")
                elif score >= 50:
                    st.info(f"Good effort. Score: {score}%. Consider reviewing this topic.")
                else:
                    st.warning(f"Score: {score}%. Let's review this together in the chat.")
                
                save_result(st.session_state.quiz_topic, score)

with tab3:
    st.markdown("### Performance Insights")
    
    weak = get_weak_topics()
    
    if weak:
        st.write("Based on recent quizzes, you should review:")
        for w in weak:
            st.markdown(f"• **{w}**")
        
        st.caption("Tip: Ask EduMentor to explain these topics differently in the Chat tab.")
    else:
        st.write("No data available yet. Complete a quiz to see your insights here.")