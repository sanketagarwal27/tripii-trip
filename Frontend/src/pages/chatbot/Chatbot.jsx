import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { chatbotLoadHistory, chatbotHandleUserMessage } from "../../redux/chatbotSlice.js";
import InputArea from "./components/InputArea.jsx";
import InitialPage from "./components/InitialPage.jsx";
import ChatInterface from "./components/ChatInterface.jsx";
import styles from "./Chatbot.module.css";

function Chatbot() {
  const dispatch = useDispatch();
  const { messages, isLoading } = useSelector((state) => state.chatbot);
  
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    dispatch(chatbotLoadHistory());
  }, [dispatch]);

  const onClickHandler = async (inputValue, setInputValue) => {
    if (!inputValue.trim()) return;

    // Dispatch the renamed thunk
    dispatch(chatbotHandleUserMessage(inputValue));
    
    setInputValue("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading && !e.shiftKey) {
      e.preventDefault();
      onClickHandler(inputValue, setInputValue);
    }
  };

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
          onClickHandler={() => onClickHandler(inputValue, setInputValue)}
          isLoading={isLoading}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}

export default Chatbot;