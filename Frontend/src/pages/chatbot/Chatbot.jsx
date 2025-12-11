import NavBar from "./components/NavBar.jsx";  
import InputArea from "./components/InputArea.jsx";
import InitialPage from "./components/InitialPage.jsx";
import styles from './Chatbot.module.css'; // Make sure this file exists
import { useState } from "react";
import ChatInterface from "./components/ChatInterface.jsx";

async function getApiResponse(prompt) {
    const apiUrl = "http://localhost:8000/api/chatbot/";
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {accept: "application/json", "Content-Type": "application/json"},
        body: JSON.stringify({prompt: prompt}),
    })
    const data = await response.json();
    return data;
}

function Chatbot() {
    const user = ""  //Get user from the backend for avatar display
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const onClickHandler = async (inputValue, setInputValue) => {
        const prompt = inputValue;
        const userMessage = { id: Date.now(), text: prompt, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);
        try {
            const response = await getApiResponse(prompt);
            // Added safety check for response structure
            const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Error: No response";
            const aiMessage = { id: Date.now() + 1, text: text, sender: "ai" };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("API Error:", error);
            setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Sorry, something went wrong.", sender: "ai" }]);
        }
        setIsLoading(false);
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading && !e.shiftKey) {
            e.preventDefault();
            onClickHandler(inputValue, setInputValue);
        }
    }

    return (
        <div className={styles.mainContainer}>
            <NavBar user={user}></NavBar>

            <div className={styles.scrollArea}>
                {messages.length === 0 ? (
                    <InitialPage/>
                ) : (
                    <ChatInterface messages={messages} isLoading={isLoading} />
                )}
            </div>

            <div className={styles.inputContainer}>
                <InputArea 
                    inputValue={inputValue} 
                    setInputValue={setInputValue} 
                    onClickHandler={onClickHandler} 
                    isLoading={isLoading} 
                    onKeyPress={handleKeyPress}
                ></InputArea>
            </div>
        </div>
    );
};

export default Chatbot;