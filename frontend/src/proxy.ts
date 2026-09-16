import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;
    const role = request.cookies.get('user_role')?.value;
    const { pathname } = request.nextUrl;

    if (token) {
        if (pathname === '/login' || pathname === '/register') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    if (!token) {
        if (pathname.startsWith('/profile') || pathname.startsWith('/dashboard') || pathname.includes('/learn')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    if (token && pathname.startsWith('/dashboard')) {
        if (role !== 'ADMIN' && role !== 'INSTRUCTOR') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    // LƯU Ý: đừng bao giờ thêm '/api/:path*' vào matcher — proxy đứng trước route
    // handlers và nằm trên đường nóng của mọi API call (trong đó có /api/app-config),
    // nên các thay đổi auth-redirect sau này có thể vô tình chặn việc tải config
    // lúc khởi động app.
    matcher: [
        '/login',
        '/register',
        '/profile/:path*',
        '/dashboard/:path*',
        '/courses/:path*/learn',
    ],
};
