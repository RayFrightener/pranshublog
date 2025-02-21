import { getAllPostIds, getPostData } from '@/lib/posts';
import styles from './page.module.css';

export async function generateStaticParams() {
  const paths = getAllPostIds();
  return paths.map((path) => path.params);
}

export default async function Post({ params }) {
    const resolvedParams = await params;
    const postData = await getPostData(resolvedParams.id);

  return (
    <div className={styles.post}>
      <h1>{postData.title}</h1>
      <p>{postData.date}</p>
      <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </div>
  );
}