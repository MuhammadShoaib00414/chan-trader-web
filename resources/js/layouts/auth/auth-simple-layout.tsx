import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { useEffect, useRef, type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

function ElectronCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const DOT_COUNT = 70;
        const MAX_DIST = 140;

        interface Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            r: number;
        }

        const particles: Particle[] = Array.from({ length: DOT_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            r: Math.random() * 1.8 + 0.8,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update positions
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            }

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < MAX_DIST) {
                        const alpha = (1 - dist / MAX_DIST) * 0.28;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 58, 61, ${alpha})`;
                        ctx.lineWidth = 0.7;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw dots
            for (const p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 90, 92, 0.75)';
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
        />
    );
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="auth-page-bg flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <ElectronCanvas />

            {/* Card */}
            <div className="auth-card relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-7">
                    {/* Logo */}
                    <div className="flex flex-col items-center gap-5">
                        <Link href={home()} className="block">
                            <img
                                src="/logo/Login.svg"
                                alt="Logo"
                                className="auth-logo h-10 w-auto"
                            />
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="auth-title text-2xl font-bold tracking-tight">
                                {title}
                            </h1>
                            <p className="auth-description text-sm">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Form content */}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
}
