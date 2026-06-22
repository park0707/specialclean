import { createRootRoute,createRouter, createRoute } from '@tanstack/react-router'
import Home from './home'
import Rootcomponent from '../App'
import MyPage from '../home_parts/menu_parts/mypage'
import InfoLayout from '../home_parts/menu_parts/info_parts/info'
import BusinessDetail from '../home_parts/menu_parts/BusinessDetail'
const rootRoute = createRootRoute({
    component : Rootcomponent,
})
const homeRoute = createRoute({
    getParentRoute : ()=>rootRoute,
    path:'/',
    component:Home
})
const myPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mypage',
  component: MyPage,
})
const infoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/info',
  validateSearch: (search: Record<string, unknown>) => ({
    menu: (search.menu as string) ?? 'privacy',
    id: search.id ? (search.id as string) : undefined,
  }) as { menu: string; id?: string },
  component: InfoLayout,
})
const businessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/business/$businessId',
  component: BusinessDetail,
})
export const router = createRouter({
    routeTree:rootRoute.addChildren([homeRoute,myPageRoute,infoRoute,businessRoute]),
})
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
