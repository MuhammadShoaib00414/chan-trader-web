import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { Folder, LayoutGrid, Shield, Users, Package, ShoppingCart, Truck, CreditCard, Boxes, Store } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Shield,
    },
    {
        title: 'Vendors',
        href: '/admin/vendors',
        icon: Users,
    },
    {
        title: 'Stores',
        href: '/admin/stores',
        icon: Store,
    },
    {
        title: 'Categories',
        href: '/admin/categories',
        icon: Boxes,
    },
    {
        title: 'Brands',
        href: '/admin/brands',
        icon: Folder,
    },
    {
        title: 'Products',
        href: '/admin/products',
        icon: Package,
    },
    {
        title: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Shipments',
        href: '/admin/shipments',
        icon: Truck,
    },
    {
        title: 'Payments',
        href: '/admin/payments',
        icon: CreditCard,
    },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const page = usePage<SharedData>();
    const authExt = page.props.auth as unknown as { roles?: string[]; permissions?: string[] };
    const roles: string[] = authExt.roles ?? [];
    const perms: string[] = authExt.permissions ?? [];
    const isSuperAdmin = roles?.includes('super-admin');
    const requiredPerms: Record<string, string[]> = {
        '/users': ['view users'],
        '/roles': ['view roles'],
        '/admin/vendors': ['view vendors'],
        '/admin/stores': ['stores.view', 'view stores'],
        '/admin/categories': ['categories.manage', 'view categories'],
        '/admin/brands': ['brands.manage', 'view brands'],
        '/admin/products': ['products.view', 'view products'],
        '/admin/orders': ['orders.view', 'view orders'],
        '/admin/shipments': ['shipments.view', 'view shipments'],
        '/admin/payments': ['payments.view', 'view payments'],
    };
    const filteredItems = mainNavItems.filter((item) => {
        const href = typeof item.href === 'string' ? item.href : item.href.url;
        const rp = requiredPerms[href];
        if (!rp) return true;
        return isSuperAdmin || rp.some((p) => perms?.includes(p));
    });
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
