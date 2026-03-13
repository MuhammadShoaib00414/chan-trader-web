import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

export default function AuthLayout({
    children,
    title,
    description,
    layout = 'simple',
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    layout?: 'simple' | 'split';
}) {
    return (
        layout === 'split' ? (
            <AuthSplitLayout title={title} description={description} {...props}>
                {children}
            </AuthSplitLayout>
        ) : (
            <AuthSimpleLayout title={title} description={description} {...props}>
                {children}
            </AuthSimpleLayout>
        )
    );
}
