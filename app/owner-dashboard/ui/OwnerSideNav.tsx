'use client'

import Image from "next/image"
import Link from "next/link"
import {
  LayoutDashboard,
  Menu,
  Package,
  BarChart3,
  Settings,
  User,
  Users
} from "lucide-react"

interface OwnerSideNavProps {
  isOpen: boolean, 
  onClose: () => void
}

function OwnerSideNav({isOpen, onClose}: OwnerSideNavProps) {
  return (
    <section>
      
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-80
          bg-card-cream shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#3B1F0E]">
          <span className="font-roboto-slab text-lg font-bold tracking-widest text-card-cream uppercase">
            Menu
          </span>
          <button
            onClick={onClose}
            className="text-card-cream hover:text-[#D4A853] transition-colors p-1 rounded"
          >
            <Image
              src="/white-menu.svg"
              alt="white menu icon"
              width={28}
              height={28}  
            />
          </button>
        </div>

        {/* Content (empty for now) */}
        <div className="flex flex-col p-6">
          {/* Put your nav links here later */}
          <Link href="/owner-dashboard/" className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8D9B5]" >
            <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
            Dashboard
          </Link>
          <Link href="/owner-dashboard/menu" className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8D9B5]" >
            <Menu className="w-5 h-5" aria-hidden="true" />
            Menu Management
          </Link>
          <Link href="/owner-dashboard/inventory" className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8D9B5]" >
            <Package className="w-5 h-5" aria-hidden="true" />
            Inventory
          </Link>
          <Link href="/owner-dashboard/sales-report" className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8D9B5]" >
            <BarChart3 className="w-5 h-5" aria-hidden="true" />
            Sales Report
          </Link>
          <Link href="/owner-dashboard/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8D9B5]" >
            <Settings className="w-5 h-5" aria-hidden="true" />
            Settings
          </Link>
          <Link href="/owner-dashboard/my-profile" className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8D9B5]" >
            <User className="w-5 h-5" aria-hidden="true" />
            My Profile
          </Link>
          <Link href="/owner-dashboard/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-[#E8D9B5]" >
            <Users className="w-5 h-5" aria-hidden="true" />
            Worker Profile
          </Link>
          
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#C8A96E]">
          <p className="text-[10px] text-[#A0845A] text-center uppercase tracking-wider">
            Kombi Cafe © 2026
          </p>
        </div>  
      </aside>
    </section>
  );
}

export default OwnerSideNav