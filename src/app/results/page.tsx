"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaRegEye } from "react-icons/fa";

interface Post {
  id: number;
  title: { rendered: string };
  author: number;
  date: string;
  featured_media: number;
  views: number;
}

interface User {
  id: number;
  name: string;
}

export default function Results() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || ""; // Ambil query parameter dari URL
  const [posts, setPosts] = useState<Post[]>([]); // State untuk hasil pencarian
  const [loading, setLoading] = useState(false); // State untuk loading
  const [error, setError] = useState<string | null>(null); // State untuk error handling

  const [totalPages, setTotalPages] = useState(0);
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const page = parseInt(searchParams.get("page") || "1");

  const postsPerPage = 10;

  // Fetch data postingan
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ambil data postingan dari WordPress API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=${postsPerPage}&page=${page}`
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil data.");
        }

        const totalPagesFromResponse =
          response.headers.get("X-WP-TotalPages") || "1";
        const data: Post[] = await response.json();

        // Filter data berdasarkan judul
        const filteredPosts = data.filter((post) =>
          post.title.rendered.toLowerCase().includes(search.toLowerCase())
        );

        // Update totalPages berdasarkan jumlah filteredPosts
        setPosts(filteredPosts);
        setTotalPages(Math.ceil(filteredPosts.length / postsPerPage)); // Menghitung total halaman berdasarkan jumlah postingan yang difilter

        // Fetch media untuk featured image
        const mediaPromises = filteredPosts.map((post) =>
          fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media/${post.featured_media}`
          ).then((res) => (res.ok ? res.json() : null))
        );

        const mediaData = await Promise.all(mediaPromises);
        const mediaMap: Record<number, string> = {};
        mediaData.forEach((media) => {
          if (media) {
            mediaMap[media.id] = media.source_url;
          }
        });
        setMediaMap(mediaMap);

        // Fetch user data untuk author
        const authorIds = Array.from(
          new Set(filteredPosts.map((post) => post.author))
        );
        const userPromises = authorIds.map((id) =>
          fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/users/${id}`
          ).then((res) => res.json())
        );

        const userData = await Promise.all(userPromises);
        setUsers(userData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, search]);

  // Peta userMap untuk author
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user.name;
    return acc;
  }, {} as Record<number, string>);

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

  return (
    <div className="p-10">
      {search ? (
        <p>
          Search results for: <strong>{decodeURIComponent(search)}</strong>
        </p>
      ) : (
        <p className="mt-4">Please enter keywords to search.</p>
      )}

      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {!loading && posts && posts.length === 0 && (
        <p className="mt-4">No results found for "{search}".</p>
      )}

      {!loading && posts && posts.length > 0 && (
        <div className="container mx-auto p-4 mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map((post) => {
              const imageUrl =
                mediaMap[post.featured_media] || "/img/error.png";
              return (
                <Link
                  key={post.id}
                  href={`/detail/${post.id}`}
                  prefetch={false}
                  className="block bg-white rounded-lg shadow-md overflow-hidden group"
                >
                  <Image
                    className="w-full h-48 object-cover"
                    src={imageUrl}
                    alt={post.title.rendered}
                    width={500}
                    height={200}
                    priority
                  />
                  <div className="p-4">
                    <h5 className="text-lg mb-2 font-semibold group-hover:text-blue-500 transition">
                      {post.title.rendered}
                    </h5>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-500">
                        {userMap[post.author]} -{" "}
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
            })}
          </div>
        </div>
      )}

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
