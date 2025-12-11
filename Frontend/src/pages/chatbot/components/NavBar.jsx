import { useState } from 'react';
import styles from './Navbar.module.css';
import { TbSquares } from "react-icons/tb";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoSearchOutline } from "react-icons/io5";
import { IoMdNotificationsOutline } from "react-icons/io";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>

        <button className={styles.hamburger} onClick={toggleMenu}>
          <RxHamburgerMenu />
        </button>

        <div className={styles.navbarLogo}>
          <TbSquares className={styles.logoIcon} />
          <span className={styles.brandName}>Tripii<span className={styles.brandBold}>Trip</span></span>
        </div>

        <ul className={`${styles.navLinks} ${isMenuOpen ? styles.active : ''}`}>
          <li><a href="#explore">Explore</a></li>
          <li><a href="#sunday-ai" className={styles.activeLink}>Sunday AI</a></li>
          <li><a href="#trips">Trips</a></li>
          <li><a href="#community">Community</a></li>
        </ul>
      </div>

      <div className={styles.navbarRight}>
        <div className={styles.searchContainer}>
          <IoSearchOutline className={styles.searchIcon} />
          <input type="text" placeholder="Search" />
        </div>

        <button className={styles.iconBtn}>
          <IoMdNotificationsOutline />
        </button>

        <div className={styles.profilePic}>
           <img src="#" alt="Profile" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;