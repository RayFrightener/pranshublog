"use client"

import "../styles/globals.css";
import styles from "./layout.module.css";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { Analytics } from "@vercel/analytics/react"
import { IoMail } from "react-icons/io5";



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Pranshu's Blog</title>
        <meta name="description" content="Technology blog" />
      </head>
      <body className={styles.layoutBody}>
        <header className={styles.layoutHeader}>
          <a href="/" className={styles.logo}>Pranshu</a>
          <a href="/about" className={styles.about}>About</a>
        </header>
        <div className={styles.content}>
          {children}
        </div>
        <footer className={styles.footer}>
          <div className={styles.socialLinks}>
            <a href="https://www.linkedin.com/in/pranshu-chawla-/" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </a>
            <a href="https://github.com/RayFrightener" target="_blank" rel="noopener noreferrer">
              <FaGithub />
            </a>
            <a
            href="https://mail.google.com/mail/?view=cm&to=pranshuchawla19@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Email me via Gmail"
          >
            <IoMail />
          </a>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}