import styles from "./page.module.css";

export default function About() {
    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <h1>About Me</h1>
                <p>This is the about page</p>
            </main>
        </div>
    )
}