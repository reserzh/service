"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getFilteredNavGroups,
  canAccessSettings,
  settingsNavItem,
  type NavUser,
  type NavItem,
} from "@/lib/nav-config";

interface AppSidebarProps {
  user: NavUser;
  companyName?: string;
  logoUrl?: string;
}

export function AppSidebar({ user, companyName, logoUrl }: AppSidebarProps) {
  const pathname = usePathname();
  const groups = getFilteredNavGroups(user.role);
  const showSettings = canAccessSettings(user.role);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function renderItem(item: NavItem) {
    // Item with children — collapsible sub-menu
    if (item.children && item.children.length > 0) {
      const parentActive = isActive(item.href) || item.children.some((c) => isActive(c.href));
      return (
        <Collapsible key={item.href} asChild defaultOpen={parentActive} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title} isActive={parentActive}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {/* Parent page link */}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <span>Overview</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                {item.children.map((child) => (
                  <SidebarMenuSubItem key={child.href}>
                    <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                      <Link href={child.href}>
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Simple item
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
          <Link href={item.href}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1.5">
          {logoUrl ? (
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={companyName || "Company"} className="h-8 w-8 object-contain" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Zap className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              {companyName || "FieldService"}
            </span>
            {!companyName && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">Pro</span>
            )}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group, i) => (
          <SidebarGroup key={group.label ?? `group-${i}`}>
            {group.label && (
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => renderItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {showSettings && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(settingsNavItem.href)}
                tooltip={settingsNavItem.title}
              >
                <Link href={settingsNavItem.href}>
                  <settingsNavItem.icon className="h-4 w-4" />
                  <span>{settingsNavItem.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
