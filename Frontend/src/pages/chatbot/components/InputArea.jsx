import styles from './InputArea.module.css';
import { AiOutlineSend } from "react-icons/ai";
import { useEffect,useRef } from 'react';

function InputArea(  {inputValue, setInputValue, onClickHandler, isLoading, onKeyPress} ) {

    const textAreaRef = useRef(null);

    useEffect(() => {
        if(textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    return (
        <div className={styles.chatArea}>
                <textarea ref={textAreaRef} key={`prompt`} className={styles.inputField} placeholder="Ask Sunday AI..." value={inputValue} disabled={isLoading} onChange={(e) => setInputValue(e.target.value)} onKeyDown={onKeyPress}></textarea>
                <button className={styles.enterButton}><AiOutlineSend className={styles.submitIcon} onClick={() => onClickHandler(inputValue, setInputValue)}></AiOutlineSend></button>
        </div>
    );
};

export default InputArea;