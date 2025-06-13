import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Cpu,
  History,
  Trophy,
  Settings,
  LogOut,
  Zap,
  AtSign,
} from "lucide-react";

const navItems = [
  {
    icon: <LayoutDashboard size={20} />,
    label: "Overview",
    href: "/overview",
  },
  {
    icon: <ArrowLeftRight size={20} />,
    label: "Transfer",
    href: "/transfer",
  },
  {
    icon: <Cpu size={20} />,
    label: "Mining",
    href: "/mining",
  },
  {
    icon: <Zap size={20} />,
    label: "Quick Transfer",
    href: "/quick-transfer",
    isPremium: true,
  },
  {
    icon: <AtSign size={20} />,
    label: "Custom Address",
    href: "/customaddress",
    isPremium: true,
  },
  {
    icon: <History size={20} />,
    label: "History",
    href: "/history",
  },
  {
    icon: <Trophy size={20} />,
    label: "Leaderboard",
    href: "/leaderboard",
  },
  {
    icon: <Settings size={20} />,
    label: "Settings",
    href: "/wallet/settings",
    state: { tabName: "settings" },
  },
];

const MobileNavbar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  const isActive = (path: string) => {
    if (path === "/overview") {
      return (
        currentPath === "/" ||
        currentPath === "/overview" ||
        currentPath === "/dashboard"
      );
    }
    if (path === "/transfer") {
      return currentPath === "/transfer" || currentPath === "/transfers";
    }
    if (path === "/quick-transfer") {
      return currentPath === "/quick-transfer";
    }
    if (path === "/customaddress") {
      return currentPath === "/customaddress";
    }
    if (path.startsWith("/wallet/")) {
      return currentPath.startsWith(path);
    }
    return currentPath === path;
  };

  const isAuthPage =
    currentPath === "/login" ||
    currentPath === "/signup" ||
    currentPath === "/reset-password" ||
    currentPath === "/dashboardselect";

  // Scroll to active item on mount and when path changes
  useEffect(() => {
    if (activeItemRef.current && scrollRef.current) {
      // Calculate the position to scroll to (center the active item)
      const container = scrollRef.current;
      const activeItem = activeItemRef.current;
      const scrollLeft = activeItem.offsetLeft - (container.clientWidth / 2) + (activeItem.clientWidth / 2);
      
      // Smooth scroll to the active item
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [currentPath]);

  if (isAuthPage) {
    return null;
  }

  const handleLogout = () => {
    sessionStorage.removeItem("auth_state");
    localStorage.removeItem("access_token");

    fetch("/api/logout", {
      method: "GET",
      credentials: "include",
    })
      .then(() => {
        navigate("/login");
      })
      .catch((err) => console.error("Logout error:", err));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-60 md:hidden">
      <div className="bg-[#1A1A1A] border-t border-[#2A2A2A] shadow-lg">
        <div 
          ref={scrollRef} 
          className="flex overflow-x-auto overflow-y-hidden scrollbar-hide py-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex px-2 w-max mx-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <NavItem
                  key={item.href}
                  to={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={active}
                  state={item.state}
                  isPremium={item.isPremium}
                  ref={active ? activeItemRef : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  isActive: boolean;
  isPremium?: boolean;
  state?: { tabName: string };
}

// Using forwardRef to pass refs to the NavItem component
const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ to, icon, label, isActive, isPremium, state }, ref) => {
    return (
      <Link
        ref={ref}
        to={to}
        state={state}
        className={`
          flex flex-col items-center justify-center px-4 py-1 mx-1
          transition-all duration-200 ease-in-out relative
          ${isActive 
            ? "bg-[#8875FF]/10 rounded-xl" 
            : "opacity-70"
          }
        `}
      >
        {isPremium && (
          <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 px-1 py-0 bg-gradient-to-r from-amber-500 to-yellow-700 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
            PRO
          </span>
        )}
        <div
          className={`
            p-1.5 rounded-full mb-1
            ${isActive ? "text-[#8875FF]" : "text-[#C4C4C7]"}
          `}
        >
          {icon}
        </div>
        <div className="flex flex-col items-center">
          <span
            className={`
              text-[10px] font-medium whitespace-nowrap
              ${isActive ? "text-[#8875FF]" : "text-[#C4C4C7]"}
            `}
          >
            {label}
          </span>
        </div>
        {isActive && (
          <div className="h-0.5 w-6 bg-[#8875FF] rounded-full mt-1" />
        )}
      </Link>
    );
  }
);

NavItem.displayName = 'NavItem';

export default MobileNavbar;
