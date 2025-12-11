import styles from './InitialPage.module.css';
import { SiGoogledocs } from "react-icons/si";
import { FaRegCompass } from "react-icons/fa";
import { GiPathDistance } from "react-icons/gi";
import { TbHelpSquare } from "react-icons/tb";
import { HiOutlineSparkles } from "react-icons/hi2";

function InitialPage() {
    return (
        <div className={styles.pageContainer}>
            <SiGoogledocs className={styles.chatbotIcon}/>
            <p className={styles.meetAI}>Meet Sunday AI</p>
            <div className={styles.paragraph}>
                <p>Your intelligent travel companion. Ask anything: From creating a custom itinerary to finding the best local coffee shop. Let's start planning your next adventure.
                </p>
            </div>
            <div className={styles.cardsContainer}>
                <div className={styles.card}>
                    <FaRegCompass className={styles.cardIcon}/>
                    <p className={styles.cardTitle}>Personalized Ideas</p>
                    <p className={styles.cardDescription}>Get recommendations tailored to your travel styles and interests.</p>
                </div>
                <div className={styles.card}>
                    <GiPathDistance className={styles.cardIcon}/>
                    <p className={styles.cardTitle}>Itinerary Builder</p>
                    <p className={styles.cardDescription}>Effortlessly craft detailed day-by-day plans for your trips.</p>
                </div>
                <div className={styles.card}>
                    <TbHelpSquare className={styles.cardIcon}/>
                    <p className={styles.cardTitle}>Quick Answers</p>
                    <p className={styles.cardDescription}>Ask practical questions and get instant, helpful travel advice.</p>
                </div>
            </div>
            <div className={styles.aiContainer}>
                    <HiOutlineSparkles className={styles.sparkleIcon}/>
                    <div className={styles.introText}>
                        <p className={styles.introTextStart}>Hi! I'm Sunday AI, your AI travel planner.</p>
                        <p className={styles.introTextDescribe}>
                        How can i help you plan your next unforgettable journey? You can ask me something like: "Create a 3-day itinerary for Rome focusing on history and cuisine in upcoming winters."</p>
                    </div>
            </div>
        </div>
    );
}

export default InitialPage;