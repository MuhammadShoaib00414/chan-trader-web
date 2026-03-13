import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img {...props} src="/logo.svg" alt="App Logo" className="h-25 w-auto" />
    );
}
