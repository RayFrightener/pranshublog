import styles from "./page.module.css";
import { IoDocument } from "react-icons/io5";

export default function About() {
    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <h1 className={styles.header}>
                <span>Hey, I'm Pranshu 👋</span>
                <a
                    href="/softwareEngineerPranshuChawlaResume2025.docx.pdf"
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
                I’m a full-stack software engineer who loves building clean, purposeful web apps — the kind that don’t just work, but feel right.
                </p>
                <p>
                My sweet spot? Designing solid database schemas, crafting smooth APIs, and building snappy UIs with tools like Next.js, Node.js, and PostgreSQL. I’m big on simplicity, scalability, and keeping things human-friendly.
                </p>
                <p>
                Whether it's solving real-world problems or just writing elegant code that gets out of the user's way, I’m here for it. I care about the why as much as the how.
                </p>
                <p>
                Right now, I’m looking for a full-time role as a Full-Stack or Backend Software Engineer — somewhere I can contribute meaningfully, grow fast, and build things that matter.
                </p>
                <p>
                Check out some of my <b>projects</b> — they're built with care, clarity, and a strong desire to make tech a little better for everyone.
                </p>
                <ul className={styles.projectList}>
                    <li><a href="https://iamtruth.me" target="_blank" rel="noopener noreferrer">Unbound</a></li>
                    <li><a href="https://dailytasklogger.vercel.app/" target="_blank" rel="noopener noreferrer">The Daily Task Logger</a></li> 
                    <li><a href="https://yoga-shlokas.vercel.app/" target="_blank" rel="noopener noreferrer">Yoga Verses</a></li>
                    <li><a href="https://pranshublog-rho.vercel.app/" target="_blank" rel="noopener noreferrer">My Personal Website</a></li>
                </ul>
                <hr style={{ margin: "2rem 0" }} />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <a
                    href="https://calendly.com/pranshuchawla19/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.scheduleBtn}
                >
                    Schedule a Meeting
                </a>
            </div>
            </main>
        </div>
    )
}