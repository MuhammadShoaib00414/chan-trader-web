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
import { Folder, LayoutGrid, Shield, Users, Package, ShoppingCart, Truck, CreditCard, Boxes, Store, Tag, Layers, ReceiptText, WalletCards, Building2, FileText } from 'lucide-react';
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
        title: 'Subcategories',
        href: '/admin/subcategories',
        icon: Layers,
    },
    {
        title: 'Articles',
        href: '/admin/articles',
        icon: FileText,
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
        title: 'Shop Dashboard',
        href: '/admin/shop/dashboard',
        icon: WalletCards,
    },
    {
        title: 'Customers',
        href: '/admin/shop/customers',
        icon: Users,
    },
    {
        title: 'Sales',
        href: '/admin/shop/sales',
        icon: ReceiptText,
    },
    {
        title: 'Stock Management',
        href: '/admin/shop/stock',
        icon: Package,
    },
    {
        title: 'Promotions',
        href: '/admin/promotions',
        icon: Tag,
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
    {
        title: 'Suppliers',
        href: '/admin/suppliers',
        icon: Building2,
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
    const perms: string[] = authExt.permissions ?? [];
    const requiredPerms: Record<string, string[]> = {
        '/dashboard': ['view dashboard'],
        '/users': ['view users'],
        '/roles': ['view roles'],
        '/admin/vendors': ['view vendors'],
        '/admin/stores': ['stores.view', 'view stores'],
        '/admin/categories': ['categories.manage', 'view categories'],
        '/admin/subcategories': ['subcategories.manage', 'view subcategories'],
        '/admin/articles': ['articles.manage', 'view articles'],
        '/admin/brands': ['brands.manage', 'view brands'],
        '/admin/products': ['products.view', 'view products'],
        '/admin/shop/dashboard': ['view shop dashboard'],
        '/admin/shop/customers': ['view customers'],
        '/admin/shop/sales': ['view sales'],
        '/admin/shop/stock': ['view stock'],
        '/admin/promotions': ['promotions.manage', 'promotions.view', 'view promotions', 'create promotions', 'edit promotions', 'delete promotions'],
        '/admin/orders': ['orders.view', 'view orders'],
        '/admin/shipments': ['shipments.view', 'view shipments'],
        '/admin/payments': ['payments.view', 'view payments'],
        '/admin/suppliers': ['view suppliers'],
    };
    const filteredItems = mainNavItems.filter((item) => {
        const href = typeof item.href === 'string' ? item.href : item.href.url;
        const rp = requiredPerms[href];
        if (!rp) return true;
        return rp.some((p) => perms?.includes(p));
    });
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch style={{ pointerEvents: 'none' }}>
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
