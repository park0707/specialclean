import { createRootRoute,createRouter, createRoute } from '@tanstack/react-router'
import Home from './home'
import Rootcomponent from '../App'
const rootRoute = createRootRoute({
    component : Rootcomponent,
})
const homeRoute = createRoute({
    getParentRoute : ()=>rootRoute,
    path:'/',
    component:Home
})
export const router = createRouter({
    routeTree:rootRoute.addChildren([homeRoute])
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
