import Image from "next/image";
import balaji from "@/assets/tirupati-balaji-hd-wallpaper-for-android-2745524-removebg-preview.png";
import { HugeiconsIcon } from "@hugeicons/react";
import { MenuIcon } from "@hugeicons/core-free-icons";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 w-full h-14 bg-white border-b border-gray-200 flex items-center justify-start shadow-sm z-30">
      {/* Hamburger Icon (Left) */}
      <button 
        className="left-4 p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors mr-0.5 sm:mr-3 flex items-center justify-center cursor-pointer"
        aria-label="Open Sidebar"
        onClick={onMenuClick}
      >
        <HugeiconsIcon icon={MenuIcon} size={24} color="currentColor" strokeWidth={2} />
      </button>

      {/* Project Title (Center) */}
      <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight leading-tight flex items-center gap-1 justify-center">
        <Image src={balaji} alt="Arun ID Cards & Digital" className="w-8" />
        <span className="font-extrabold text-gray-900 tracking-tight leading-tight">
          ARUN
        </span>
        <span className="text-violet-600">
          ID CARDS & DIGITAL
        </span>
      </h2>
    </header>
  );
}