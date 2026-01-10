import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  chatbotLoadHistory,
  chatbotHandleUserMessage,
  addUserMessage,
} from "../../redux/chatbotSlice.js";
import InputArea from "./components/InputArea.jsx";
import InitialPage from "./components/InitialPage.jsx";
import ChatInterface from "./components/ChatInterface.jsx";
import styles from "./Chatbot.module.css";

function Chatbot() {
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector((state) => state.chatbot);
  const { user, accessToken } = useSelector((state) => state.auth); // ✅ Get auth state
  const [inputValue, setInputValue] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    // ✅ Only load history if user is authenticated and haven't loaded yet
    if (user && accessToken && !historyLoaded) {
      console.log("🤖 Loading chatbot history...");

      // ✅ Small delay to ensure tokens are in localStorage
      const timer = setTimeout(() => {
        dispatch(chatbotLoadHistory())
          .then(() => {
            console.log("✅ Chatbot history loaded");
            setHistoryLoaded(true);
          })
          .catch((error) => {
            console.error("❌ Failed to load chatbot history:", error);
            setHistoryLoaded(true); // Mark as loaded even on error to prevent retry loops
          });
      }, 100);

      return () => clearTimeout(timer);
    } else if (!user || !accessToken) {
      console.warn("⚠️ User not authenticated, skipping chatbot history load");
    }
  }, [dispatch, user, accessToken, historyLoaded]);

  const sendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    const messageId = Date.now();

    // ✅ 1. Optimistic user message (IMMEDIATE UI)
    dispatch(
      addUserMessage({
        messageId,
        sender: "user",
        text: inputValue,
      })
    );

    // ✅ 2. Clear input instantly
    setInputValue("");

    // ✅ 3. Ask AI (AI message will arrive later)
    dispatch(chatbotHandleUserMessage(inputValue));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ Show loading state while auth is being verified
  if (!user || !accessToken) {
    return (
      <div className={styles.mainContainer}>
        <div className={styles.scrollArea}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #40E0D0",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ color: "#666" }}>Authenticating...</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.scrollArea}>
        {messages.length === 0 ? (
          <InitialPage />
        ) : (
          <ChatInterface messages={messages} isLoading={isLoading} />
        )}
      </div>

      <div className={styles.inputContainer}>
        <InputArea
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={sendMessage}
          isLoading={isLoading}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}

export default Chatbot;
