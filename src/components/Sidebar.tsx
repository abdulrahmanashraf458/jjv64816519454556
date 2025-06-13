import React, { useContext, useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Cpu,
  History,
  Trophy,
  Medal,
  Settings,
  LogOut,
  Menu as MenuIcon,
  Shield,
  Eye,
  Wallet,
  User,
  Star,
  Zap,
  AtSign,
} from "lucide-react";
import { SidebarContext } from "../App";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SidebarSection {
  title: string;
  links: {
    icon: React.ReactNode;
    label: string;
    href: string;
    state?: { tabName: string };
  }[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Dashboard",
    links: [
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
      { icon: <Cpu size={20} />, label: "Mining", href: "/mining" },
    ],
  },
  {
    title: "Wallet",
    links: [
      {
        icon: <Settings size={20} />,
        label: "Settings",
        href: "/wallet/settings",
        state: { tabName: "settings" },
      },
      { icon: <History size={20} />, label: "History", href: "/history" },
    ],
  },
  {
    title: "Premium",
    links: [
      {
        icon: <Zap size={20} />,
        label: "Quick Transfer",
        href: "/quick-transfer",
      },
      {
        icon: <AtSign size={20} />,
        label: "Custom Address",
        href: "/customaddress",
      },
    ],
  },
  {
    title: "Account",
    links: [
      {
        icon: <Trophy size={20} />,
        label: "Leaderboard",
        href: "/leaderboard",
      },
    ],
  },
];

export default function Sidebar() {
  const { isExpanded, setIsExpanded, isMediumScreen } =
    useContext(SidebarContext);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Check window width on mount and resize
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      
      // Different behavior based on screen sizes
      if (isMobile) {
        // Mobile: Hidden sidebar
        setIsExpanded(false);
        setIsMobileOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsExpanded]);

  // Monitor changes in isExpanded from context
  useEffect(() => {
    if (window.innerWidth < 768) {
      // في الشاشات الصغيرة، عندما يتم تغيير isExpanded من النافبار
      // يجب تحديث حالة isMobileOpen أيضًا للتزامن
      setIsMobileOpen(isExpanded);
    }
  }, [isExpanded]);

  // Handle mobile toggle
  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
    if (!isMobileOpen) {
      setIsExpanded(true);
    }
  };

  // Handle medium screen toggle
  const handleMediumToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Don't render sidebar at all on mobile view since we have MobileNavbar
  if (isMobileView) {
    return null;
  }

  // Determine if sidebar should be floating over content
  const isFloating = isMediumScreen && isExpanded;

  // Determine if overlay should be shown
  const showOverlay = isFloating;

  return (
    <>
      {/* Overlay for medium screens - when sidebar is floating over content */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => {
            if (isMediumScreen) {
              handleMediumToggle();
            }
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen
          bg-[#272626]
          text-[#F4F4F7] shadow-xl z-[60]
          transition-all duration-300 ease-in-out
          ${isExpanded ? "w-64" : "w-20"}
          translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section with toggle button */}
          <div
            className="h-16 flex items-center justify-between px-4 relative"
            style={{ marginTop: 0, paddingTop: 0 }}
          >
            {/* Logo - Only show when expanded */}
            {isExpanded && (
              <span className="font-bold text-xl whitespace-nowrap overflow-hidden text-[#FFFFFF]">
                Cryptonel
              </span>
            )}

            {/* Always show toggle button */}
            <button
              onClick={handleMediumToggle}
              className={`
                p-2 text-[#C4C4C7] hover:text-[#FFFFFF] transition-colors
                ${!isExpanded ? "w-full flex justify-center" : ""}
              `}
              aria-label="Toggle sidebar"
            >
              <MenuIcon size={24} />
            </button>
            {/* خط أفقي متصل بعرض الصفحة */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "1px",
                background: "#3A3A3E",
                zIndex: 20,
              }}
            ></div>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-2 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-[#8875FF] scrollbar-track-transparent hover:scrollbar-thumb-[#9D8DFF]">
            {sidebarSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h2
                  className={`
                  px-4 text-xs font-semibold uppercase tracking-wider text-[#C4C4C7]
                  transition-all duration-300
                  ${
                    isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                  }
                `}
                >
                  {section.title}
                </h2>
                {section.links.map((link) => {
                  // Improved active link detection
                  const isLinkActive = (href: string) => {
                    if (href === "/overview") {
                      return (
                        currentPath === "/" ||
                        currentPath === "/overview" ||
                        currentPath === "/dashboard"
                      );
                    }
                    if (href === "/transfer") {
                      return (
                        currentPath === "/transfer" ||
                        currentPath === "/transfers"
                      );
                    }
                    if (href === "/quick-transfer") {
                      return currentPath === "/quick-transfer";
                    }
                    if (href === "/customaddress") {
                      return currentPath === "/customaddress";
                    }
                    if (href.startsWith("/wallet/")) {
                      return currentPath.startsWith(href);
                    }
                    return currentPath === href;
                  };

                  const isActive = isLinkActive(link.href);

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      state={link.state}
                      className={`
                        flex items-center ${
                          isExpanded ? "justify-start gap-4" : "justify-center"
                        }
                        rounded-lg
                        transition-all duration-200 group
                        ${isExpanded ? "px-4" : "px-0"}
                        py-2.5
                        ${
                          isActive
                            ? "bg-[#8875FF]/50 shadow-lg shadow-[#8875FF]/20"
                            : "hover:bg-[#3A3A3E] hover:shadow-lg hover:shadow-black/10"
                        }
                        active:scale-95 active:opacity-80
                      `}
                    >
                      {/* Icon */}
                      <div
                        className={`${
                          isActive
                            ? "text-white"
                            : "text-[#C4C4C7] group-hover:text-[#FFFFFF]"
                        } transition-colors`}
                      >
                        {link.icon}
                      </div>

                      {/* Label - Only show when expanded */}
                      {isExpanded && (
                        <span
                          className={`text-sm transition-colors ${
                            isActive
                              ? "text-white font-medium"
                              : "text-[#C4C4C7] group-hover:text-[#FFFFFF]"
                          }`}
                        >
                          {link.label}
                        </span>
                      )}

                      {/* Active indicator - White dot for mobile */}
                      {!isExpanded && isActive && (
                        <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white"></span>
                      )}
                      
                      {/* Premium badge for Premium section */}
                      {section.title === "Premium" && isExpanded && (
                        <span className="ml-auto px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-700 text-white text-[10px] font-bold rounded-full">
                          PRO
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer / User Section */}
          <div className="p-4 mt-auto border-t border-[#3A3A3E]">
            {/* Empty footer area */}
          </div>
        </div>
      </aside>
    </>
  );
}
