import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import './index.css'
import DashboardPage from './pages/DashboardPage'
import ArtPage from './pages/ArtPage'
import KehadiranPage from './pages/KehadiranPage'
import PengambilanPage from './pages/PengambilanPage'
import RekapPage from './pages/RekapPage'
import PengaturanPage from './pages/PengaturanPage'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/art', label: 'ART', icon: '👩‍🍳' },
  { to: '/kehadiran', label: 'Kehadiran', icon: '📅' },
  { to: '/pengambilan', label: 'Ambil Uang', icon: '💸' },
  { to: '/rekap', label: 'Rekap', icon: '🧾' },
  { to: '/pengaturan', label: 'Atur', icon: '⚙️' },
] as const

function RootLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Gaji<span className="text-emerald-700">ART</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100"
                activeProps={{ className: 'bg-emerald-50 text-emerald-800' }}
                activeOptions={{ exact: item.to === '/' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Navigasi bawah — khusus mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-stone-500"
              activeProps={{ className: 'text-emerald-700' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}

const rootRoute = createRootRoute({ component: RootLayout })

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: DashboardPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/art', component: ArtPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/kehadiran', component: KehadiranPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/pengambilan', component: PengambilanPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/rekap', component: RekapPage }),
  createRoute({ getParentRoute: () => rootRoute, path: '/pengaturan', component: PengaturanPage }),
]

const routeTree = rootRoute.addChildren(routes)
const router = createRouter({ routeTree })
const queryClient = new QueryClient()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
