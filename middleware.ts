import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths without any auth checks
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/reviews') || // Public review API endpoints
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/reviews') || // Public review collection pages
    pathname === '/' ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get the token for protected routes
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // Require authentication for all protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Agency routes - only for agency admins
  if (pathname.startsWith('/agency/')) {
    if (token.role !== 'AGENCY_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Extract agency ID from path
    const agencyIdFromPath = pathname.split('/')[2];
    if (agencyIdFromPath && token.agencyId !== agencyIdFromPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Subaccount routes - for agency admins and subaccount users
  if (pathname.startsWith('/subaccount/')) {
    const subaccountIdFromPath = pathname.split('/')[2];
    
    if (token.role === 'AGENCY_ADMIN') {
      // Agency admins need to verify the subaccount belongs to their agency
      // This will be validated server-side in the actual components
      return NextResponse.next();
    } else if (token.role === 'SUBACCOUNT_USER') {
      // Subaccount users can only access their own subaccount
      if (token.subaccountId !== subaccountIdFromPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Dashboard redirects based on role
  if (pathname === '/dashboard') {
    if (token.role === 'AGENCY_ADMIN' && token.agencyId) {
      return NextResponse.redirect(new URL(`/agency/${token.agencyId}/dashboard`, request.url));
    } else if (token.role === 'SUBACCOUNT_USER' && token.subaccountId) {
      return NextResponse.redirect(new URL(`/subaccount/${token.subaccountId}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/reviews (Public review API endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - reviews (public review collection pages)
     */
    '/((?!api/auth|api/reviews|_next/static|_next/image|favicon.ico|reviews).*)',
  ],
};