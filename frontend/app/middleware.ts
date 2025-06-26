import { NextRequest, NextResponse } from 'next/server';

// Middleware to guard routes using token stored in cookies
export function middleware(req: NextRequest) {
    const token = req.cookies.get('token')?.value; // Extract token from cookies
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');

    // Redirect to login if token is missing and route is protected
    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Prevent logged-in users from accessing login/register again
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/vault', req.url));
    }

    return NextResponse.next();
}

// Middleware applies only to these paths
export const config = {
    matcher: ['/vault', '/login', '/register'],
};
