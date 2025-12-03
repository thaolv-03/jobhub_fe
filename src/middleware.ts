
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const refreshToken = request.cookies.get('jobhub_refresh_token');
    const { pathname } = request.nextUrl;

    // If there's no refresh token and the user is trying to access a protected route
    if (!refreshToken) {
        // Redirect to login page, preserving the originally requested URL
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If the token exists, allow the request to proceed
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/candidate/:path*',
        '/employer/:path*',
        // Add /admin/:path* if you have admin routes
        // '/admin/:path*',
    ],
};
