import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

const applySpaRedirect = () => {
  if (typeof window === "undefined") return;
  const search = window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
  if (!search) return;

  const getRawParam = (key) => {
    for (const pair of search.split("&")) {
      const [name, value = ""] = pair.split("=");
      if (name === key) return value;
    }
    return null;
  };

  const redirectPath = getRawParam("p");
  if (!redirectPath) return;

  const query = getRawParam("q");
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
