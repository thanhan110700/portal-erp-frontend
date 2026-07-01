import { StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import { router } from "./routes"

import { AuthProvider } from "@/app/providers/AuthProvider"
import { ThemeProvider } from "@/app/providers/ThemeProvider"
import { PageLoader } from "@/components/common/PageLoader"
import { Toaster } from "@/components/ui/sonner"

import "./index.css"
import "./i18n"
import { strictMode } from "./config"

const app = (
  <ThemeProvider>
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
    <Toaster position="top-right" richColors />
  </ThemeProvider>
)

createRoot(document.getElementById("root")!).render(
  strictMode ? <StrictMode>{app}</StrictMode> : app,
)
