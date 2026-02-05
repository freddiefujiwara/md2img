import { createRouter, createWebHistory } from "vue-router";
import EditorView from "./views/EditorView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: EditorView,
  },
  {
    path: "/:encoded(.*)",
    name: "shared",
    component: EditorView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
