"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
    },
    {
      name: "Analysis",
      href: "/dashboard/analysis",
    },
  ]

  return (
    <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-[#efc87d]" : "text-muted-foreground",
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}

