import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh items-center justify-center bg-background p-6 md:p-10 overflow-hidden bg-[radial-gradient(60rem_30rem_at_85%_-10%,rgba(59,130,246,0.10),transparent),radial-gradient(40rem_20rem_at_15%_110%,rgba(34,197,94,0.08),transparent),radial-gradient(28rem_14rem_at_50%_20%,rgba(244,63,94,0.06),transparent)]">
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute -top-32 -right-28 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)] blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_70%)] blur-2xl" />
            </div>
            <div className="w-full max-w-md">
                <Card className="w-full bg-card/90 backdrop-blur-sm shadow-lg">
                    <CardHeader className="text-center space-y-2">
                        <Link href={home()} className="inline-flex items-center justify-center">
                            <AppLogoIcon />
                            <span className="sr-only">{title}</span>
                        </Link>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            {title}
                        </CardTitle>
                        <CardDescription>
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
