"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaRegEye } from "react-icons/fa";

// Interface untuk data Post dan User
interface Post {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  author: number;
  date: string;
  featured_media: number;
  views: number;
}

interface Media {
  id: number;
  source_url: string;
}

interface User {
  id: number;
  name: string;
}

export default function NewsPortal() {
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});
  const [userMap, setUserMap] = useState<Record<number, string>>({});
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const postsPerPage = 6;

  // Fetch semua data (posts, media, users)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch postingan populer
        const popularRes = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=10`
        );
        const popularData: Post[] = await popularRes.json();

        // Fetch postingan terbaru (dengan pagination)
        const recentRes = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=${postsPerPage}&page=${page}`
        );
        const totalPages = recentRes.headers.get("X-WP-TotalPages") || "0";
        setTotalPages(Number(totalPages));

        const recentData: Post[] = await recentRes.json();

        // Ambil media untuk semua postingan
        const allPosts = [...popularData, ...recentData];
        const mediaIds = Array.from(
          new Set(allPosts.map((post) => post.featured_media))
        );
        const mediaPromises = mediaIds.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media/${id}`
          ).then((res) => res.json())
        );
        const mediaData: Media[] = await Promise.all(mediaPromises);
        const mediaMap: Record<number, string> = {};
        mediaData.forEach((media) => {
          mediaMap[media.id] = media.source_url;
        });

        // Ambil data author untuk semua postingan
        const authorIds = Array.from(
          new Set(allPosts.map((post) => post.author))
        );
        const userPromises = authorIds.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/users/${id}`
          ).then((res) => res.json())
        );
        const userData: User[] = await Promise.all(userPromises);
        const userMap: Record<number, string> = {};
        userData.forEach((user) => {
          userMap[user.id] = user.name;
        });

        // Update state
        setPopularPosts(
          popularData.sort((a, b) => b.views - a.views).slice(0, 3)
        );
        setRecentPosts(recentData);
        setMediaMap(mediaMap);
        setUserMap(userMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const handleNavigation = (direction: "prev" | "next") => {
    const newPage =
      direction === "prev"
        ? Math.max(1, page - 1)
        : Math.min(totalPages, page + 1);

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderPageButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Tampilkan halaman pertama
        i === totalPages || // Tampilkan halaman terakhir
        (i >= page - 1 && i <= page + 1) // Tampilkan 2 halaman sebelum/sesudah halaman aktif
      ) {
        buttons.push(
          <button
            key={i}
            className={`p-2 w-8 h-8 rounded-md flex justify-center items-center text-center ${
              i === page
                ? "bg-blue-500 text-white"
                : "bg-white text-black hover:bg-gray-100 transition"
            }`}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", i.toString());
              router.push(`${pathname}?${params.toString()}`);
            }}
            aria-label={`Halaman ${i}`} // Tambahkan aksesibilitas
          >
            {i}
          </button>
        );
      } else if (i === page - 2 || i === page + 2) {
        // Tampilkan "..." untuk halaman yang dilewati
        buttons.push(
          <span key={`ellipsis-${i}`} className="px-2">
            ...
          </span>
        );
      }
    }
    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Postingan Populer */}
      {page === 1 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-10 text-center">Popular🔥</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                mediaMap={mediaMap}
                userMap={userMap}
              />
            ))}
          </div>
        </section>
      )}

      {/* Postingan Terbaru */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold mb-10 text-center">Latest</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              mediaMap={mediaMap}
              userMap={userMap}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap w-full gap-4 justify-center items-center">
        <button
          className={`bg-white py-2 px-4 text-black rounded-md flex justify-center items-center text-center ${
            page === 1
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-gray-100 transition"
          }`}
          onClick={() => handleNavigation("prev")}
          disabled={page === 1} // Nonaktifkan jika di halaman pertama
        >
          <FiChevronLeft /> Prev
        </button>

        {renderPageButtons()}

        <button
          className={`bg-white py-2 px-4 text-black rounded-md flex justify-center items-center text-center ${
            page === totalPages
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-gray-100 transition"
          }`}
          onClick={() => handleNavigation("next")}
          disabled={page === totalPages} // Nonaktifkan jika di halaman terakhir
        >
          Next <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

// Komponen PostCard
function PostCard({
  post,
  mediaMap,
  userMap,
}: {
  post: Post;
  mediaMap: Record<number, string>;
  userMap: Record<number, string>;
}) {
  const imageUrl = mediaMap[post.featured_media] || "/img/error.png";
  const author = userMap[post.author] || "Unknown";

  return (
    <Link
      href={`/detail/${post.id}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden group"
    >
      <Image
        src={imageUrl}
        alt={post.title.rendered}
        width={500}
        height={300}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg mb-2 font-semibold group-hover:text-blue-700 transition duration-200">
          {post.title.rendered}
        </h3>
        <div className="flex justify-between">
          <p className="text-sm text-gray-500">
            {author} -{" "}
            {new Date(post.date).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="flex items-center">
            <FaRegEye className="mr-1" /> {post.views}
          </p>
        </div>
      </div>
    </Link>
  );
}
