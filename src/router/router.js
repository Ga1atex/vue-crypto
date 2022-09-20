import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // {
  //   path: "/",
  //   name: "home",
  //   component: "",
  // },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: <div>404 Not Found</div>,
  },
  {
    path: "/:pathMatch(.*)",
    name: "not-found",
    component: <div>404 Not Found</div>,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
