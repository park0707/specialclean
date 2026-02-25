import { createRootRoute,createRouter, createRoute } from '@tanstack/react-router'
import Home from './home'
import Rootcomponent from '../App'
import MyPage from '../home_parts/menu_parts/mypage'
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

export const router = createRouter({
    routeTree:rootRoute.addChildren([homeRoute,myPageRoute]),
})
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
