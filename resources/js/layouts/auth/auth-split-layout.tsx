import AppLogoIcon from '@/components/app-logo-icon'
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card'
import { home } from '@/routes'
import { Link } from '@inertiajs/react'
import { type PropsWithChildren } from 'react'

interface AuthLayoutProps {
  name?: string
  title?: string
  description?: string
}

export default function AuthSplitLayout({
  children,
  title,
  description,
}: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="flex min-h-svh bg-background">
      <div className="relative hidden lg:block w-1/2">
        <img
          src="/login.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <Link href={home()} className="inline-flex items-center gap-2">
              <span className="text-lg font-semibold tracking-wide text-white">Admin Portal</span>
            </Link>
          </div>
          <div className="space-y-3 max-w-xl">
            <h1 className="text-4xl font-bold leading-tight">Your Trusted Partner</h1>
            <p className="text-sm/6 opacity-90">
              Up-to-date tools and expert support to help you work with confidence.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-xl">
              <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-2xl font-semibold">2,000+</div>
                <div className="text-xs opacity-90">Users Served</div>
              </div>
              <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-2xl font-semibold">98%</div>
                <div className="text-xs opacity-90">Success Rate</div>
              </div>
              <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-2xl font-semibold">24/7</div>
                <div className="text-xs opacity-90">Expert Support</div>
              </div>
            </div>
          </div>
          <div className="text-xs opacity-80">© {new Date().getFullYear()} All rights reserved.</div>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Card className="w-full bg-card/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center space-y-2">
              <Link href={home()} className="inline-flex items-center justify-center">
                <AppLogoIcon />
                <span className="sr-only">{title}</span>
              </Link>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
