import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

const applySpaRedirect = () => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get("p");
  if (!redirectPath) return;

  const query = params.get("q");
  const normalizedPath = redirectPath.startsWith("/")
    ? redirectPath.slice(1)
    : redirectPath;
  const nextUrl = `${import.meta.env.BASE_URL}${normalizedPath}${
    query ? `?${query}` : ""
  }${window.location.hash}`;
  window.history.replaceState(null, "", nextUrl);
};

applySpaRedirect();

createApp(App).use(router).mount("#app");
