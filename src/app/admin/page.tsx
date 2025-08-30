"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const AdminPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const [newsList, setNewsList] = useState([]); // Daftar berita untuk pagination
  const [allNews, setAllNews] = useState([]); // Semua berita untuk pencarian
  const [mediaMap, setMediaMap] = useState<Record<number, string>>({});
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]); // Menyimpan daftar kategori
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Kata kunci pencarian
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 9; // Banyak berita per halaman

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pathname = usePathname();

  const [editMode, setEditMode] = useState(false);
  const [editNewsId, setEditNewsId] = useState<number | null>(null);
  const [currentNews, setCurrentNews] = useState<any>(null); // Tambahkan state untuk menyimpan berita yang sedang diedit

  useEffect(() => {
    const token = localStorage.getItem("token");

    const validateToken = async () => {
      if (!token) {
        alert("Anda harus login untuk mengakses halaman admin.");
        router.push("/login"); // Arahkan ke halaman login jika belum login
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_TOKEN}/validate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          alert("Sesi login Anda telah berakhir. Silakan login ulang.");
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (err) {
        console.error("Validasi token gagal:", err);
        alert("Terjadi kesalahan. Silakan login ulang.");
        router.push("/login");
      }
    };

    validateToken();
  }, [router]);

  useEffect(() => {
    fetchNews(); // Ambil berita untuk halaman tertentu
  }, [page]);

  useEffect(() => {
    fetchAllNews(); // Ambil semua berita untuk pencarian
    fetchCategories(); // Ambil daftar kategori dari WordPress
  }, []);

  // Fungsi untuk mengambil kategori dari WordPress API
  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/categories`
      );
      if (!response.ok) {
        throw new Error("Gagal memuat kategori");
      }

      const data = await response.json();
      setCategories(data); // Simpan kategori ke state
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Gagal memuat kategori.");
    }
  };

  // Fungsi untuk memperbarui mediaMap berdasarkan berita yang ditemukan
  const updateMediaMap = async (news: any[]) => {
    const mediaPromises = news.map((post: any) =>
      fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media/${post.featured_media}`
      ).then((res) => res.json())
    );

    const mediaData = await Promise.all(mediaPromises);
    const mediaMap: Record<number, string> = {};
    mediaData.forEach((media: any) => {
      mediaMap[media.id] = media.source_url;
    });

    return mediaMap;
  };

  // Fungsi untuk mengambil berita (pagination)
  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=${postsPerPage}&page=${page}`
      );
      if (!response.ok) {
        throw new Error("Gagal memuat berita");
      }

      const totalPages = response.headers.get("X-WP-TotalPages");
      const data = await response.json();

      const updatedMediaMap = await updateMediaMap(data);
      setMediaMap(updatedMediaMap);

      setNewsList(data);
      setTotalPages(Number(totalPages));
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memuat berita.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil semua berita (pencarian)
  const fetchAllNews = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=100`
      );
      if (!response.ok) {
        throw new Error("Gagal memuat semua berita");
      }

      const data = await response.json();
      setAllNews(data);

      const updatedMediaMap = await updateMediaMap(data);
      setMediaMap(updatedMediaMap);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memuat semua berita.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setImage(null);
    setEditMode(false);
    setEditNewsId(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Kosongkan nilai input file
    }
  };

  // Fungsi untuk menambahkan berita
  const handleAddNews = async () => {
    setLoading(true);
    if (!title || !content || !category) {
      alert("Semua field harus diisi!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.");
      router.push("/login");
      return;
    }

    let mediaId = null;

    if (image) {
      // Upload media (gambar)
      const formData = new FormData();
      formData.append("file", image);
      formData.append("status", "publish");

      try {
        const mediaRes = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!mediaRes.ok) {
          const errorData = await mediaRes.json();
          console.error("Media upload error:", errorData);
          alert(
            `Gagal mengunggah media: ${
              errorData.message || "Terjadi kesalahan pada server."
            }`
          );
          return;
        }

        const mediaData = await mediaRes.json();
        mediaId = mediaData.id;
      } catch (error) {
        console.error("Media upload error:", error);
        alert("Gagal mengunggah media.");
        return;
      }
    }

    // Tambahkan berita dengan media ID (jika ada)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
            categories: [Number(category)], // Kategori berupa array ID
            featured_media: mediaId || null,
            status: "publish",
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error adding news:", errorData);
        alert(
          `Gagal menambahkan berita: ${
            errorData.message || "Terjadi kesalahan pada server."
          }`
        );
        return;
      }

      alert("Berita berhasil ditambahkan.");
      resetForm();
      fetchNews();
      fetchAllNews();
    } catch (error) {
      console.error("Error adding news:", error);
      alert("Gagal menambahkan berita.");
    } finally {
      setLoading(false);
    }
  };

  const filteredNewsList = searchTerm
    ? allNews.filter((news: any) =>
        news.title.rendered.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : newsList;

  // Memperbarui mediaMap saat filteredNewsList berubah
  useEffect(() => {
    const updateMediaMapForFilteredNews = async () => {
      const updatedMediaMap = await updateMediaMap(filteredNewsList);
      setMediaMap(updatedMediaMap);
    };

    updateMediaMapForFilteredNews();
  }, [filteredNewsList]); // Memperbarui mediaMap saat filteredNewsList berubah

  // Fungsi untuk menghapus berita
  const handleDeleteNews = async (id: number) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error deleting news:", errorData);
        alert(
          `Gagal menghapus berita: ${
            errorData.message || "Terjadi kesalahan pada server."
          }`
        );
        return;
      }

      alert("Berita berhasil dihapus.");
      fetchNews(); // Perbarui daftar berita
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("Gagal menghapus berita.");
    }
    setLoading(false);
  };

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

  const handleEditNews = (news: any) => {
    setEditMode(true); // Aktifkan mode edit
    setEditNewsId(news.id); // Simpan ID berita yang sedang diedit
    setTitle(news.title.rendered); // Isi form dengan judul
    setContent(news.content.rendered); // Isi form dengan konten
    setCategory(news.categories[0]); // Isi form dengan kategori (ambil kategori pertama)
    setCurrentNews(news); // Simpan berita yang sedang diedit

    // Set gambar lama jika ada
    if (news.featured_media) {
      fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media/${news.featured_media}`
      )
        .then((res) => res.json())
        .then((media) => {
          setImage(media.source_url); // Isi dengan URL gambar lama
        })
        .catch((error) => {
          console.error("Gagal memuat gambar lama:", error);
          setImage(null); // Tetap set ke null jika gagal
        });
    } else {
      setImage(null); // Tidak ada gambar lama
    }
  };

  const handleUpdateNews = async () => {
    setLoading(true);
    if (!title || !content || !category) {
      alert("Semua field harus diisi!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Token tidak ditemukan. Silakan login ulang.");
      router.push("/login");
      return;
    }

    let mediaId = null;

    if (image && typeof image !== "string") {
      // Cek jika image adalah File
      // Upload media baru jika ada gambar yang dipilih
      const formData = new FormData();
      formData.append("file", image);
      formData.append("status", "publish");

      try {
        const mediaRes = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/media`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!mediaRes.ok) {
          const errorData = await mediaRes.json();
          console.error("Media upload error:", errorData);
          alert(
            `Gagal mengunggah media: ${
              errorData.message || "Terjadi kesalahan pada server."
            }`
          );
          return;
        }

        const mediaData = await mediaRes.json();
        mediaId = mediaData.id; // Simpan ID media baru
      } catch (error) {
        console.error("Media upload error:", error);
        alert("Gagal mengunggah media.");
        return;
      }
    } else if (currentNews) {
      // Jika tidak ada gambar baru, gunakan ID media yang sudah ada
      mediaId = currentNews.featured_media; // Gunakan ID media yang sudah ada
    }

    // Update berita ke WordPress API
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts/${editNewsId}`,
        {
          method: "PATCH", // Metode PATCH/POST untuk memperbarui
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            content,
            categories: [Number(category)], // Kategori berupa array ID
            featured_media: mediaId || null, // Tambahkan media ID baru jika ada
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error updating news:", errorData);
        alert(
          `Gagal memperbarui berita: ${
            errorData.message || "Terjadi kesalahan pada server."
          }`
        );
        return;
      }

      alert("Berita berhasil diperbarui.");
      resetForm(); // Reset form
      setEditMode(false); // Keluar dari mode edit
      fetchNews(); // Refresh daftar berita
      fetchAllNews(); // Refresh semua berita
    } catch (error) {
      console.error("Error updating news:", error);
      alert("Gagal memperbarui berita.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <div className="bg-white p-8 mb-16 rounded-lg shadow-xl max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          Admin Page - News Content
        </h1>

        <div className="space-y-8">
          <div className="space-y-6">
            {/* Upload Image */}
            <div>
              <label
                htmlFor="file"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Upload Image
              </label>
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full p-4 mb-4 border rounded-md border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {image &&
                typeof image === "string" && ( // Tampilkan gambar jika ada
                  <img
                    src={image}
                    alt="Preview"
                    className="w-60 h-60 rounded-md"
                  />
                )}
            </div>

            {/* Title Input */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                News Title
              </label>
              <input
                type="text"
                id="title"
                placeholder="Enter Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 border rounded-md border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Content Textarea */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                News Content
              </label>
              <textarea
                id="content"
                placeholder="Enter Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 border rounded-md border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
              />
            </div>

            {/* Category Selector */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Select Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 border rounded-md border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div>
              <button
                onClick={editMode ? handleUpdateNews : handleAddNews}
                className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition duration-200"
                disabled={loading}
              >
                {loading ? "Loading..." : editMode ? "Update News" : "Add News"}
              </button>
              {editMode && (
                <button
                  onClick={() => {
                    setEditMode(false); // Keluar dari mode edit
                    resetForm(); // Reset form
                  }}
                  className="w-full mt-2 py-4 bg-gray-600 text-white text-lg font-semibold rounded-md hover:bg-gray-700 transition duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h2 className="text-xl font-semibold mb-2">News List</h2>
        <input
          type="text"
          placeholder="Search by title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-4 border rounded-md border-black"
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {filteredNewsList.length === 0 ? (
              <p className="text-red-500">
                No news found with the given title.
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
                {filteredNewsList.map((news: any) => (
                  <li
                    key={news.id}
                    className="flex flex-col md:flex-row relative items-center bg-white border border-gray-400 rounded-lg md:max-w-xl p-4"
                  >
                    <div className="w-full md:w-1/3">
                      <Image
                        className="object-cover rounded-lg h-48 md:h-auto"
                        src={mediaMap[news.featured_media] || "/img/error.png"} // Fallback ke gambar default
                        alt={news.title.rendered || "No image"}
                        width={500}
                        height={500}
                        unoptimized
                        onError={(e) =>
                          (e.currentTarget.src = "/img/error.png")
                        } // Gambar fallback jika gagal
                      />
                    </div>
                    <div className="flex flex-col justify-between p-5 leading-normal w-full md:w-2/3">
                      <h5 className="mb-2 text-sm font-semibold">
                        {news.title.rendered}
                      </h5>
                      <p className="mb-3 text-xs text-slate-500 uppercase">
                        {new Date(news.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleDeleteNews(news.id)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <FaTrashAlt />
                      </button>
                      <button
                        onClick={() => handleEditNews(news)}
                        className="absolute px-4 py-2 bg-blue-600 text-white rounded-lg bottom-3 right-3 hover:bg-blue-700 transition-colors duration-300 ease-in-out shadow-md hover:shadow-lg"
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
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
    </div>
  );
};

export default AdminPage;
