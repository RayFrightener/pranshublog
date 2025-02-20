import styles from "./page.module.css";
import { getSortedPostsData } from "@/lib/posts";

export default function Home() {
  const allPostsData = getSortedPostsData();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ul>
          {allPostsData.map(({ id, date, title }) => (
            <li key={id}>
              <a href={`/posts/${id}`}>{title}</a>
              <br />
              <small>{date}</small>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}