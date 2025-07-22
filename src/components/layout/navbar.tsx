"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "~/lib/auth-client";
import { APP_CONFIG } from "~/lib/constants";
import { NAV_ITEMS, USER_MENU_ITEMS, GUEST_MENU_ITEMS } from "~/lib/navigation";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav
      className="z-50 transition-all duration-300 fixed top-4 left-4 right-4 bg-[#4f356b]/80 backdrop-blur-md border border-purple-300/30 rounded-xl px-4 sm:px-6 lg:px-8 max-w-none"
    >
      <div className="max-w-7xl mx-auto px-0">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-white/90">
              {APP_CONFIG.name}
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                    isMenuOpen
                      ? "rotate-45 translate-y-1"
                      : "-translate-y-0.5"
                  }`}
                ></span>
                <span
                  className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                    isMenuOpen
                      ? "-rotate-45 -translate-y-1"
                      : "translate-y-0.5"
                  }`}
                ></span>
              </div>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="md:hidden">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <hr className="my-1 border-gray-200" />
                </div>

                {isPending ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Loading...
                  </div>
                ) : session ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-900 font-medium border-b border-gray-100">
                      {session.user.name}
                    </div>
                    {USER_MENU_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={async () => {
                        closeMenu();
                        try {
                          await signOut();
                          window.location.href = "/";
                        } catch (error) {
                          console.error("Sign out error:", error);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    {GUEST_MENU_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2 text-sm hover:bg-gray-100 ${
                          item.label === "Sign Up" 
                            ? "text-blue-600 font-medium" 
                            : "text-gray-700"
                        }`}
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden"
          onClick={closeMenu}
        ></div>
      )}
    </nav>
  );
}