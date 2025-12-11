import styles from './ChatInterface.module.css';
import ReactMarkdown from 'react-markdown';
import { useRef, useEffect } from 'react';

function ChatInterface( {messages, isLoading} ) {

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behaviour: 'smooth'});
    }, [messages, isLoading]);

    return (
        <div className={styles.chatHistoryContainer}>
            {messages.map((message) => (
                <div key={message.id} className={`${styles.messageBubble} ${message.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
            ))}
            {isLoading && (
                <div className={styles.loadingBubble}>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                </div>
            )}
        <div ref={bottomRef}></div>
        </div>
    );
};

export default ChatInterface;