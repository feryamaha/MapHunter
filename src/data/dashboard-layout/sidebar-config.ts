export interface SidebarNavItem {
  label: string;
  href: string;
  iconName: string;
}

export const sidebarNavItems: SidebarNavItem[] = [
  {
    label: "Buscar Leads",
    href: "/dashboard",
    iconName: "iconDashboard",
  },
];
