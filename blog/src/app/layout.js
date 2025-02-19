"use client"

import "../styles/globals.css";
import styles from "./layout.module.css";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("light");

  // useEffect(() => {
  //   const savedTheme = localStorage.getItem("theme");
  //   if (savedTheme) {
  //     setTheme(savedTheme);
  //     document.documentElement.setAttribute("data-theme", savedTheme);
  //   }
  // }, []);

  // const toggleTheme = () => {
  //   const newTheme = theme === "light" ? "dark" : "light";
  //   setTheme(newTheme);
  //   document.documentElement.setAttribute("data-theme", newTheme);
  //   localStorage.setItem("theme", newTheme);
  // }; 

  return (
    <html lang="en">
      <head>
        <title>Pranshu's Blog</title>
        <meta name="description" content="Technology blog" />
      </head>
      <body>
        <header className={styles.layoutHeader}>
          <a href="/" className={styles.logo}>Pranshu</a>
          {/* <div className={styles.headerRight}> */}
            {/* <button onClick={toggleTheme} className={styles.themeToggle}>
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </button> */}
            <a href="/about" className={styles.about}>About</a>
          {/* </div> */}
        </header>
        {children}
      </body>
    </html>
  );
}
