"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useSession, signOut } from "~/lib/auth-client";
import { APP_CONFIG } from "~/lib/constants";
import { NAV_ITEMS, USER_MENU_ITEMS, GUEST_MENU_ITEMS } from "~/lib/navigation";
import { useTheme } from "~/hooks/use-theme";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const { data: session, isPending } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const userDataFetched = useRef<string>(''); // Track which user ID we've fetched for

  // Determine which authentication system is active
  const isAuthenticated = user || session;
  const userName = displayName || (user ? 
    (user.fullName || user.emailAddresses[0]?.emailAddress) : 
    session?.user?.name);

  // Fetch user's data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id && userDataFetched.current !== user.id) {
        try {
          const response = await fetch(`/api/profile/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.profile?.name) {
              setDisplayName(data.profile.name);
            }
            if (data.profile?.image) {
              setProfileImage(data.profile.image);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          userDataFetched.current = user.id;
        }
      }
    };

    if (isLoaded && user) {
      fetchUserData();
    }
  }, [user?.id, isLoaded]);

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
      className="z-50 transition-all duration-300 fixed top-4 left-4 right-4 bg-[#6d28d9]/80 backdrop-blur-md border border-purple-300/30 rounded-xl"
    >
      <div className="flex justify-between items-center h-16 px-6 sm:px-8 md:px-10">
        {/* Left side - Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-xl font-bold text-white/90 light:text-gray-300 hover:text-white transition-colors">
            {APP_CONFIG.name}
          </Link>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Button */}
            <Link
              href="/advanced-search"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 light:text-gray-400 light:hover:text-gray-200"
              title="Advanced Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 light:text-gray-400 light:hover:text-gray-200"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            
            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 light:text-gray-400 light:hover:text-gray-200"
                aria-expanded={isMenuOpen}
                aria-label="Toggle main menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center items-center">
                  <span
                    className={`bg-current block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                      isMenuOpen
                        ? "rotate-45 translate-y-1"
                        : "-translate-y-0.5"
                    }`}
                  ></span>
                  <span
                    className={`bg-current block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm my-0.5 ${
                      isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  ></span>
                  <span
                    className={`bg-current block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                      isMenuOpen
                        ? "-rotate-45 -translate-y-1"
                        : "translate-y-0.5"
                    }`}
                  ></span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl py-2 z-50 border border-gray-200/50">
                  {/* Mobile Navigation Links */}
                  <div className="md:hidden">
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 transition-colors rounded-lg mx-2"
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <hr className="my-2 border-gray-200/60 mx-2" />
                  </div>

                  {/* Loading State */}
                  {(!isLoaded || isPending) ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Loading...
                    </div>
                  ) : isAuthenticated ? (
                    <>
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200/60 mx-2 rounded-lg bg-gray-50/50">
                        <div className="flex items-center space-x-3">
                          {(profileImage || user?.imageUrl) ? (
                            <img
                              src={profileImage || user?.imageUrl}
                              alt={userName || 'User'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {(displayName || userName || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {userName}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* User Menu Items */}
                      {USER_MENU_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 transition-colors rounded-lg mx-2"
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      ))}
                      
                      {/* Sign Out Button */}
                      <div className="border-t border-gray-200/60 mt-2 pt-2 mx-2">
                        {user ? (
                          <SignOutButton>
                            <button
                              onClick={closeMenu}
                              className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg"
                            >
                              Sign Out
                            </button>
                          </SignOutButton>
                        ) : (
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
                            className="block w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg"
                          >
                            Sign Out
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest Menu Items */}
                      {GUEST_MENU_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-4 py-3 text-sm font-medium transition-colors rounded-lg mx-2 ${
                            item.label === "Sign Up" 
                              ? "text-blue-600 hover:bg-blue-50 hover:text-blue-700" 
                              : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
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

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-200"
          onClick={closeMenu}
          aria-hidden="true"
        ></div>
      )}
    </nav>
  );
}