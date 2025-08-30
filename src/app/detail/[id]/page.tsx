"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaRegEye } from "react-icons/fa";

// Interface
interface Post {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  featured_media: number;
  author: number;
  categories: number[];
  _embedded: {
    "wp:featuredmedia"?: { source_url: string }[];
  };
  views: number;
}

interface User {
  id: number;
  name: string;
}

export default function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasIncremented, setHasIncremented] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Post Details
        const postRes = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts/${postId}?_embed`
        );
        if (!postRes.ok) throw new Error("Post not found");
        const postData: Post = await postRes.json();
        setPost(postData);

        // Increment Views (hanya sekali)
        if (!hasIncremented) {
          await incrementViews(postData.id);
          setHasIncremented(true);
        }

        // Fetch Author
        if (postData.author) {
          const authorRes = await fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/users/${postData.author}`
          );
          if (authorRes.ok) {
            const authorData: User = await authorRes.json();
            setAuthorName(authorData.name);
          }
        }

        // Fetch Related Posts
        if (postData.categories.length > 0) {
          const relatedRes = await fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=4&categories=${postData.categories[0]}&_embed`
          );
          if (relatedRes.ok) {
            const relatedData: Post[] = await relatedRes.json();
            setRelatedPosts(
              relatedData.filter((relatedPost) => relatedPost.id !== Number(postId))
            );
          }
        }

        // Fetch Recent Posts
        const recentRes = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=4&_embed`
        );
        if (recentRes.ok) {
          const recentData: Post[] = await recentRes.json();
          setRecentPosts(recentData);
        }
      } catch (error) {
        console.error("Error fetching post details:", error);
        router.push("/404");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, router, hasIncremented]);

  const incrementViews = async (postId: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-postviews/v1/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: postId }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => (prev ? { ...prev, views: data.views } : prev));
      }
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (!post) {
    return <div className="text-center text-lg">Post not found.</div>;
  }

  const imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

  return (
    <div className="mx-5">
      {/* Header Section */}
      <Link href={"/"} className="flex mb-5 w-20 justify-between bg-blue-600 text-white p-2 rounded-xl font-semibold hover:bg-blue-700 transition duration-200"><FaArrowLeft className="text-2xl"/>Back</Link>
      <section className="mb-10">
        <h5 className="mb-2 text-3xl font-bold">{post.title.rendered}</h5>
        <p className="mb-3 text-slate-500">
          {authorName} -{" "}
          {new Date(post.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="flex items-center text-sm text-gray-500">
          <FaRegEye className="mr-1" /> {post.views} Views
        </p>
      </section>

      {/* Main Content & Sidebar */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main Content */}
        <div className="lg:w-8/12">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={post.title.rendered}
              width={1200}
              height={600}
              className="rounded-lg mb-10 object-cover"
            />
          )}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
          ></div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-4/12">
          <Sidebar title="Latest" posts={recentPosts} />
        </div>
      </div>

      {/* Related Posts */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-6">Related</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {relatedPosts.map((relatedPost) => (
            <PostCard key={relatedPost.id} post={relatedPost} />
          ))}
        </div>
      </section>
    </div>
  );
}

// Komponen Sidebar
function Sidebar({ title, posts }: { title: string; posts: Post[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} compact />
        ))}
      </div>
    </div>
  );
}

// Komponen PostCard
function PostCard({ post, compact }: { post: Post; compact?: boolean }) {
  const imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "/img/error.png";

  return (
    <Link
      href={`/detail/${post.id}`}
      className={`block bg-white rounded-lg shadow-md overflow-hidden group ${
        compact ? "flex gap-4" : ""
      }`}
    >
      <Image
        src={imageUrl}
        alt={post.title.rendered}
        width={compact ? 120 : 500}
        height={compact ? 120 : 300}
        className={`${compact ? "w-28 h-28" : "w-full h-48"} object-cover`}
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold group-hover:text-blue-500">
          {post.title.rendered}
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          {new Date(post.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
