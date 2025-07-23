import styles from "./page.module.css";
import { IoDocument } from "react-icons/io5";
import Image from "next/image";

export default function About() {
    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <h1 className={styles.header}>
                <span>Hey, I'm Pranshu 👋</span>
                <a
                    href="/softwareEngineerPranshuChawlaResume2025MicrosoftSWE.docx.pdf"
                    className={styles.resumeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                >
                    <IoDocument style={{ marginRight: "0.4em" }} />
                    Resume
                </a>
                </h1>
                
                <p><strong>Full-Stack Software Engineer</strong> building clean, human-centered web apps — front to back, idea to deployment.</p>

                <p>I enjoy designing solid database schemas, crafting smooth APIs, and building fast, intuitive UIs. My go-to tools are <strong>Next.js, Node.js, and PostgreSQL</strong>, with TypeScript tying it all together.</p>

                <p>I'm big on clarity, scalability, and building tech that feels good to use. Whether it's solving real-world problems or writing elegant code that gets out of the user’s way — I’m here for it.</p>

                <p><strong>Currently open to full-time roles</strong> as a Full-Stack or Backend Software Engineer — especially where I can contribute meaningfully, grow fast, and help bring thoughtful products to life.</p>

                <p>Take a look at some of my <strong>projects</strong> below — each one is built with care, clarity, and a strong desire to make tech a little better for everyone.</p>

                <p>If you’d like to explore the code behind them, visit my <a href="https://github.com/RayFrightener" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
                
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
                {/* Project Cards */}
                <div className={styles.projectGrid}>
                    {/* First Project */}
                    <div className={styles.projectCard}>
                        <h3><a href="https://iamtruth.me" target="_blank" rel="noopener noreferrer">Unbound</a></h3>
                        <p className={styles.projectSubtitle}>
                            A minimalist platform to share uplifting thoughts and connect through daily reflections.
                        </p>
                        
                        <span className={styles.projectRole}>
                            Built and deployed solo – full-stack, production-grade
                        </span>
                        
                        <div className={styles.projectGiftWrapper}>
                            <Image
                            src="/unboundtry2.gif"
                            alt="Unbound demo"
                            className={`${styles.projectGif} ${styles.unboundGif}`}
                            width={320}
                            height={480}
                            unoptimized
                            />
                        </div>

                        <h4 className={styles.projectSectionTitle}>Key Features</h4>
                        <ul>
                            <li>Share short, mindful posts to inspire and uplift others.</li>
                            <li>Scroll through a clean feed of reflections from other users.</li>
                            <li>Explore users' past thoughts and personal growth over time.</li>
                            <li>Track and manage your own reflections via a personal history log.</li>
                        </ul>

                        <h4 className={styles.projectSectionTitle}>Tech Stack</h4>
                        <p className={styles.techStack}>
                            Next.js (App Router), React, TypeScript, PostgreSQL, Prisma, Tailwind CSS
                        </p>

                        <a
                            className={styles.projectCTA}
                            href="https://iamtruth.me"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit live site →
                        </a>
                        </div>
                    {/* Second Project */}
                    <div className={styles.projectCard}>
                        <h3><a href="https://dailytasklogger.vercel.app/" target="_blank" rel="noopener noreferrer" title="Visit">The Daily Task Logger</a></h3>
                        <p>A focused productivity tracker that helps you log goals, track time, and visualize daily consistency.</p>
                        <span className={styles.projectRole}>
                            Built and deployed solo – full-stack
                        </span>
                        <div className={styles.projectGiftWrapper}>
                        <Image src="/logger2.gif" alt="Unbound demo" className={styles.projectGif} width={1000} height={432} unoptimized />
                        </div>
                        <h4 className={styles.projectSectionTitle}>Key Features</h4>
                        <ul>
                            <li>Set daily goals and log time spent with precision.</li>
                            <li>Instantly see your focus patterns with clean, visual charts.</li>
                            <li>Reflect on progress over time to build better habits.</li>
                        </ul>
                        <h4 className={styles.projectSectionTitle}>Tech Stack</h4>
                        <p className={styles.techStack}>
                            React, Next.js, TypeScript, Supabase, PostgreSQL, MUI, Chart.js
                        </p>

                        <a
                            className={styles.projectCTA}
                            href="https://dailytasklogger.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                           Visit live site →
                        </a>
                    </div>
                    {/* Third Project */}
                    <div className={styles.projectCard}>
                        <h3>
                            <a href="https://github.com/RayFrightener/kindlore" target="_blank" rel="noopener noreferrer">
                                Kindlore – [In Progress]
                            </a>
                        </h3>
                        <p>
                            A personal knowledge platform to organize, reflect on, and enrich Kindle highlights and book notes.
                        </p>
                        <span className={styles.projectRole}>
                            Developing solo – full-stack
                        </span>
                        <div className={styles.projectGiftWrapper}>
                            <Image src="/image.png" alt="Kindlore demo" className={styles.projectGif} width={1000} height={432} unoptimized />
                        </div>

                        <h4 className={styles.projectSectionTitle}>Key Features</h4>
                        <ul>
                            <li>Secure Google-authenticated sign-in with encrypted data storage</li>
                            <li>Upload and manage Kindle clippings with deduplication and reflection support</li>
                            <li>Structured note-taking flow with distraction-free reading UI</li>
                            <li>Mobile-friendly, accessible design using Tailwind CSS and modular components</li>
                        </ul>

                        <h4 className={styles.projectSectionTitle}>Tech Stack</h4>
                        <p className={styles.techStack}>
                            Next.js (App Router), React, TypeScript, PostgreSQL, Prisma, Auth.js, Tailwind CSS
                        </p>

                        {/* Optional live link - disable if not ready */}
                        <a
                            className={styles.projectCTA}
                            href="https://github.com/RayFrightener/kindlore"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit repository →
                        </a>
                    </div>

                    {/* Fourth Project */}
                    <div className={styles.projectCard}>
                        <h3><a href="https://yoga-shlokas.vercel.app/" target="_blank" rel="noopener noreferrer">Yoga Verses</a></h3>
                        <p>A spiritual reading companion for the Bhagavad Gita — simple, serene, and accessible.</p>
                        <span className={styles.projectRole}>
                            Built and deployed solo – full-stack
                        </span>
                        <div className={styles.projectGiftWrapper}>
                        <Image src="/verses2.gif" alt="Unbound demo" className={styles.projectGif} width={1000} height={432} unoptimized />
                        </div>
                        <h4 className={styles.projectSectionTitle}>Key Features</h4>
                        <ul>
                            <li>Read verses from Chapters 3, 4, and 12 in a focused layout.</li>
                            <li>Navigate verses easily with smooth, single-page scroll UX.</li>
                            <li>Designed for peaceful reading on both mobile and desktop.</li>
                        </ul>
                        <h4 className={styles.projectSectionTitle}>Tech Stack</h4>
                        <p className={styles.techStack}>
                            React, Next.js, MongoDB, JavaScript
                        </p>
                        <a
                            className={styles.projectCTA}
                            href="https://yoga-shlokas.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit live site →
                        </a>
                    </div>
                    {/* Fifth Project */}
                    <div className={styles.projectCard}>
                        <h3><a href="https://pranshublog-rho.vercel.app/" target="_blank" rel="noopener noreferrer">My Personal Website</a></h3>
                        <p>A living digital space to explore my projects, thoughts, and inspirations.</p>
                        <h4 className={styles.projectSectionTitle}>Key Features</h4>
                        <ul>
                            <li>Central hub for technical work, writing, and experiments.</li>
                            <li>Blog and resource links that reflect my current interests.</li>
                            <li>Built to grow and evolve as I do.</li>
                        </ul>
                        {/* <a
                            className={styles.projectCTA}
                            href="https://pranshublog-rho.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit →
                        </a> */}
                    </div>
                </div>
                {/* <ul className={styles.projectList}>
                    <li><a href="https://iamtruth.me" target="_blank" rel="noopener noreferrer">Unbound</a></li>
                    <li><a href="https://dailytasklogger.vercel.app/" target="_blank" rel="noopener noreferrer">The Daily Task Logger</a></li> 
                    <li><a href="https://yoga-shlokas.vercel.app/" target="_blank" rel="noopener noreferrer">Yoga Verses</a></li>
                    <li><a href="https://pranshublog-rho.vercel.app/" target="_blank" rel="noopener noreferrer">My Personal Website</a></li>
                </ul> */}
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