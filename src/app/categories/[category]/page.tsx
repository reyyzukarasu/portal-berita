"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaRegEye } from "react-icons/fa";
import Head from "next/head";

interface Post {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  author: number;
  date: string;
  featured_media: number;
  excerpt: {
    rendered: string;
  };
  categories: number[];
  views: number;
}

interface User {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Sub_Main() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const postsPerPage = 10;

  const categoryName = pathname.split("/").pop();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resCategories = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/categories`
        );
        const categoriesData: Category[] = await resCategories.json();
        setCategories(categoriesData);

        const category = categoriesData.find(
          (cat) => cat.name.toLowerCase() === categoryName?.toLowerCase()
        );
        if (category) setCategoryId(category.id);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [categoryName]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsUrl = `${
          process.env.NEXT_PUBLIC_WORDPRESS_API_URL
        }/wp/v2/posts?per_page=${postsPerPage}&page=${page}${
          categoryId ? `&categories=${categoryId}` : ""
        }`;
        const resPosts = await fetch(postsUrl);
        const totalPages = resPosts.headers.get("X-WP-TotalPages") || "0";
        setTotalPages(Number(totalPages));

        const postsData: Post[] = await resPosts.json();
        setPosts(postsData);

        // Fetch media for posts
        const mediaPromises = postsData.map((post) =>
          fetch(
            `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media/${post.featured_media}`
          ).then((res) => res.json())
        );
        const mediaData = await Promise.all(mediaPromises);
        const mediaMap: Record<number, string> = {};
        mediaData.forEach((media) => {
          mediaMap[media.id] = media.source_url;
        });
        setMediaMap(mediaMap);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId !== null) {
      fetchPosts();
    }
  }, [page, categoryId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const authorIds = Array.from(new Set(posts.map((post) => post.author)));
        const fetchedUsers = await Promise.all(
          authorIds.map(async (id) => {
            const userRes = await fetch(
              `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/users/${id}`
            );
            return userRes.json();
          })
        );
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (posts.length > 0) {
      fetchUsers();
    }
  }, [posts]);

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
    <>
      <Head>
        <title>
          {categoryName ? `${categoryName} Posts` : "Posts"} - Portal Berita
        </title>
        <meta
          name="description"
          content={`List of news for categories ${categoryName}`}
        />
      </Head>
      <div>
        <h1 className="flex w-full justify-center items-center text-black mb-10 text-3xl font-bold capitalize">
          {categoryName} Posts
        </h1>

        <div className="container mx-auto p-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array(6)
                .fill("loading")
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-300 rounded-lg h-48 animate-pulse"
                  ></div>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-20">
              {posts.length > 0 ? (
                posts.map((post) => {
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
                        placeholder="blur"
                        blurDataURL="/img/placeholder.png"
                      />

                      <div className="p-4">
                        <h3 className="text-lg mb-2 font-semibold group-hover:text-blue-500 transition">
                          {post.title.rendered}
                        </h3>

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
                            <FaRegEye className="mr-1" /> {post.views || 0}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p>There is no news for this category.</p>
              )}
            </div>
          )}
        </div>

        {posts.length > 0 && !loading && (
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
        )}
      </div>
    </>
  );
}
