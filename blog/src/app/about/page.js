import styles from "./page.module.css";

export default function About() {
    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <h1>Hi, love!</h1>
                <p>Here you will find information about what I do and my values.</p>
                <p>I am skilled in developing web applications. I know how to 
                    manage databases, query them, write APIs for software
                    components to exchange data and design and create user interfaces, just like this one *soft blink*.
                </p>
                {/* <p className={styles.smallText}>If you want a better understanding of what these terms mean click <a href="posts/basicTerminology">here</a>.</p> */}
                <p>Below are the <b>projects</b> I've created!</p>
                <ul className={styles.projectList}>
                    <li><a href="https://dailytasklogger.vercel.app/" target="_blank" rel="noopener noreferrer">The Daily Task Logger</a></li> 
                    <li><a href="https://yoga-shlokas.vercel.app/" target="_blank" rel="noopener noreferrer">Yoga Verses</a></li>
                    <li><a href="" target="_blank" rel="noopener noreferrer">My Personal Website</a></li>
                </ul>
                 {/**
                  * target="_blank" this value specifies that the linked document be opened in a new tab or new window
                  * rel="nopener" prevents the new page from being able to access the window.opener property, helps
                  * to protect against certain types of phishing attacks where the new page could potentially
                  * manipulate the original page
                  * rel="noreferrer" prevents the browser from sending the Referrer header to the new page. 
                  * This can help to protect privacy by not revealing the URL of the original page.
                  */}
                {/* <p className={styles.smallText}>These links are safe to click and visit!</p> */}
            </main>
        </div>
    )
}