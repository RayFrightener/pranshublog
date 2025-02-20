import { getAllPostIds, getPostData } from '@/lib/posts';

export async function generateStaticParams() {
  const paths = getAllPostIds();
  return paths.map((path) => path.params);
}

export default async function Post({ params }) {
  const postData = await getPostData(params.id);

  return (
    <div>
      <h1>{postData.title}</h1>
      <p>{postData.date}</p>
      <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </div>
  );
}