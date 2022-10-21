import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // {
  //   path: "/",
  //   name: "home",
  //   component: "",
  // },
  {
    // path: "/:catchAll(.*)",
    path: "/:pathMatch(.*)*",
    name: "not-found",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    // component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
    component: <div>404 Not Found</div>,
  },
];

const routerHistory = createWebHistory(process.env.BASE_URL);

const router = createRouter({
  history: routerHistory,
  routes,
});

export default router;
