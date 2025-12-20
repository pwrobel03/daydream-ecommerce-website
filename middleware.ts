import authConfig from "./auth.config"; 
import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
  
  // Poprawiona logika dla tras dynamicznych (/category/..., /product/...)
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === "/") {
      return nextUrl.pathname === "/"
    }
    return nextUrl.pathname.startsWith(route)
  })

  const isAuthRoute = authRoutes.includes(nextUrl.pathname)

  if (isApiAuthRoute) {
    return null
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
    }
    return null
  }

  // Jeśli użytkownik nie jest zalogowany i trasa nie jest publiczna -> login
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/login", nextUrl))
  }

  return null
})

// TEN BLOK MUSI ZOSTAĆ:
export const config = {
  // Wyklucza pliki statyczne (obrazy, pdf, itp.) oraz foldery systemowe Next.js
  // Middleware nie uruchomi się dla Twoich zdjęć granoli, co oszczędza serwer
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}