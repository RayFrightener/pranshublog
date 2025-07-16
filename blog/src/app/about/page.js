import styles from "./page.module.css";
import { IoDocument } from "react-icons/io5";

export default function About() {
    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <h1 className={styles.header}>
                    <span>Hello! My name is Pranshu</span>
                    <a
                        href="/softwareEngineerPranshuChawlaResume2025.docx                        feature(about): add downloadable resume link with icon.pdf"
                        className={styles.resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                    >
                        <IoDocument style={{ marginRight: "0.4em" }} />
                        Resume
                    </a>
                </h1>
                <p>
                    I’m a software engineer focused on building clean, full-stack web applications that are scalable, reliable, and user-friendly.
                </p>
                <p>
                    I specialize in database design, backend API development, and intuitive front-end interfaces using technologies like Next.js, Node.js, and PostgreSQL.
                    I enjoy working on real-world problems and writing code that serves a purpose.
                </p>
                <p>
                    My goal is to join a team where I can contribute meaningfully from day one, grow as a developer, and build software that matters.
                </p>
                <p>
                    Below are some of the <b>projects</b> I’ve built — each one reflects what I care about: clarity, simplicity, and making an impact through software.
                </p>
                <ul className={styles.projectList}>
                    <li><a href="https://iamtruth.me" target="_blank" rel="noopener noreferrer">Unbound</a></li>
                    <li><a href="https://dailytasklogger.vercel.app/" target="_blank" rel="noopener noreferrer">The Daily Task Logger</a></li> 
                    <li><a href="https://yoga-shlokas.vercel.app/" target="_blank" rel="noopener noreferrer">Yoga Verses</a></li>
                    <li><a href="https://pranshublog-rho.vercel.app/" target="_blank" rel="noopener noreferrer">My Personal Website</a></li>
                </ul>
            </main>
        </div>
    )
}