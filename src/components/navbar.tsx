"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BsTwitterX } from "react-icons/bs";
import { FaFacebookF, FaInstagram, FaTelegramPlane } from "react-icons/fa";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { IoMdSearch } from "react-icons/io";
import Image from "next/image";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // State untuk hamburger menu
  const [searchTerm, setSearchTerm] = useState("");
  const [dateTime, setDateTime] = useState(
    new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
  const router = useRouter();
  const [latestNews, setLatestNews] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    }, 86400000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp/v2/posts?per_page=1&orderby=date&order=desc`
        );
        const data = await res.json();

        if (data && data.length > 0) {
          setLatestNews(data[0].title.rendered); // Ambil judul berita terbaru
        }
      } catch (error) {
        console.error("Error fetching latest news:", error);
        setLatestNews("Failed to fetch news"); // Untuk fallback jika terjadi error
      }
    };

    fetchLatestNews();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      router.push(`/results?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    alert("Anda telah logout.");
    router.push("/");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="text-white mb-14">
      {/* Header Top */}
      <div className="flex bg-black items-center justify-between text-lg font-medium px-5 md:px-20 py-2">
        <div>{dateTime}</div>

        <div className="flex items-center space-x-3">
          <Link href="/">
            <FaInstagram />
          </Link>
          <Link href="/">
            <BsTwitterX />
          </Link>
          <Link href="/">
            <FaFacebookF />
          </Link>
          <Link href="/">
            <FaTelegramPlane />
          </Link>

          <div className="ml-7 space-x-3">
            {isLoggedIn && (
              <Link
                href="/admin"
                className="bg-blue-600 p-2 text-sm rounded-xl font-semibold hover:bg-blue-700 transition duration-200"
              >
                Admin
              </Link>
            )}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-blue-600 p-2 text-sm rounded-xl font-semibold hover:bg-blue-700 transition duration-200"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 p-2 text-sm rounded-xl font-semibold hover:bg-blue-700 transition duration-200"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="flex flex-col md:flex-row items-center justify-between py-5 px-5 md:px-20 bg-white text-black rounded-tl-2xl rounded-tr-2xl">
        {/* Logo and Hamburger */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Image
            src="/img/bullnium.png"
            className="h-8 w-8"
            alt=""
            width={10}
            height={10}
            priority
          />
          <div className="text-xl font-bold">Bullnium News</div>
          <button
            className="text-2xl md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <AiOutlineClose /> : <AiOutlineMenu />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav
          className={`mt-4 md:mt-0 w-full md:w-auto ${
            menuOpen ? "block" : "hidden md:block"
          }`}
        >
          <ul className="flex flex-col md:flex-row md:space-x-7 space-y-3 md:space-y-0">
            <li>
              <Link href="/" className="font-medium py-5">
                Home
              </Link>
            </li>
            <li>
              <Link href="/categories/bitcoin" className="font-medium py-5">
                Bitcoin
              </Link>
            </li>
            <li>
              <Link href="/categories/altcoin" className="font-medium py-5">
                Altcoin
              </Link>
            </li>
            <li>
              <Link href="/categories/metaverse" className="font-medium py-5">
                Metaverse
              </Link>
            </li>
            <li>
              <Link href="/categories/regulation" className="font-medium py-5">
                Regulation
              </Link>
            </li>
            <li>
              <Link href="/categories/scam" className="font-medium py-5">
                Scam
              </Link>
            </li>
          </ul>
        </nav>

        {/* Search Bar (Responsive) */}
        <form
          onSubmit={handleSearch}
          className={`mt-4 md:mt-0 w-full md:w-auto ${
            menuOpen ? "block" : "hidden md:block"
          }`}
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-auto p-2 rounded-md bg-gray-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="mt-2 md:mt-0 ml-0 md:ml-2 w-full md:w-auto p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <IoMdSearch />
          </button>
        </form>
      </div>

      <div className="overflow-hidden whitespace-nowrap bg-blue-600 shadow-lg p-2">
        <div className="inline-block animate-marquee min-h-full w-full"> {/* Tambahkan w-full */}
          <span className="text-lg font-semibold">
            Latest: {latestNews || "Loading..."}
          </span>
        </div>
      </div>
    </div>
  );
}
