"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HouseLine,
  BookOpen,
  Robot,
  ChatCircle,
  UserCircle,
} from "@phosphor-icons/react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide in game simulation room, course learning room, or course intro (they have their own focused bottom action bar)
  if (
    (pathname?.startsWith("/game/") && pathname !== "/game") ||
    pathname?.includes("/learn") ||
    pathname?.includes("/intro")
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Trang chủ",
      href: "/",
      icon: HouseLine,
      isActive: pathname === "/",
    },
    {
      label: "Học tập",
      href: "/courses",
      icon: BookOpen,
      isActive: pathname?.startsWith("/courses"),
    },
    {
      label: "Giải trí",
      href: "/game",
      icon: Robot,
      isActive: pathname?.startsWith("/game"),
      badge: "AI",
    },
    {
      label: "Hỏi đáp",
      href: "/forum",
      icon: ChatCircle,
      isActive: pathname?.startsWith("/forum"),
    },
    {
      label: user ? "Hồ sơ" : "Tài khoản",
      href: user ? "/profile" : "/login",
      icon: UserCircle,
      isActive:
        pathname === "/profile" ||
        pathname === "/login" ||
        pathname === "/register",
    },
  ];

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="grid grid-cols-5 h-14 items-center px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center h-full py-1 text-center transition-all ${
                item.isActive
                  ? "text-primary font-bold"
                  : "text-on-surface-variant/70 hover:text-on-surface"
              }`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  weight={item.isActive ? "fill" : "duotone"}
                  className={`transition-transform duration-200 ${
                    item.isActive ? "scale-110 text-primary" : ""
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-primary text-white text-[8px] font-black leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  item.isActive ? "font-extrabold text-primary" : "font-medium"
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Pip */}
              {item.isActive && (
                <span className="absolute bottom-1 w-1.5 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
