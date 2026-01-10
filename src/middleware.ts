
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const refreshToken = request.cookies.get('jobhub_refresh_token')?.value;
    const { pathname } = request.nextUrl;

    // If there's no refresh token and the user is trying to access a protected route,
    // redirect them to the login page.
    if (!refreshToken) {
        // Preserve the originally requested URL as a 'next' query parameter.
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If the token exists, allow the request to proceed.
    return NextResponse.next();
}

// Config to specify which routes should be protected by this middleware.
export const config = {
    matcher: [
        '/job-seeker/dashboard/:path*',
        '/recruiter/dashboard/:path*',
        '/admin/:path*',
    ],
};



