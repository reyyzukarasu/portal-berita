import Image from "next/image";
import Link from "next/link";
import { BsTwitterX } from "react-icons/bs";
import { FaFacebookF, FaInstagram, FaTelegramPlane } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-200">
      <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8 space-y-5">
        <hr className="my-6 border-black sm:mx-auto lg:my-8" />
        <div className="flex-col sm:flex sm:items-center sm:justify-between space-y-5">
          <div className="flex items-center mb-4 sm:mb-0 space-x-3">
            <Image
              src="/img/bullnium-large.png"
              className="h-auto w-auto"
              alt="Logo Bullnium News"
              height={100}
              width={100}
              priority
            />
          </div>
          <div className="flex flex-wrap space-x-3 items-center mb-6 text-sm font-medium text-black sm:mb-0">
            <Link
              href=""
              className="p-2 border border-slate-500 rounded-full hover:bg-black hover:text-pink-500"
            >
              <FaInstagram />
            </Link>

            <Link
              href=""
              className="p-2 border border-slate-500 rounded-full hover:bg-black hover:text-white"
            >
              <BsTwitterX />
            </Link>

            <Link
              href=""
              className="p-2 border border-slate-500 rounded-full hover:bg-black hover:text-sky-500"
            >
              <FaFacebookF />
            </Link>

            <Link
              href=""
              className="p-2 border border-slate-500 rounded-full hover:bg-black hover:text-sky-500"
            >
              <FaTelegramPlane />
            </Link>
          </div>
        </div>
        <span className="block text-sm text-slate-500 sm:text-center">
          © 2024 | PT Bullnium Blockchain Indonesia
        </span>
      </div>
    </footer>
  );
}
