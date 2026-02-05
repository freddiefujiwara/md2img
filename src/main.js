import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

const applySpaRedirect = () => {
  if (typeof window === "undefined") return;
  const search = window.location.search;
  if (!search) return;

  if (search.startsWith("?/")) {
    const trimmed = search.slice(2);
    const [rawPath, rawQuery] = trimmed.split("&");
    const normalizedPath = rawPath.startsWith("/")
      ? rawPath.slice(1)
      : rawPath;
    const nextUrl = `${import.meta.env.BASE_URL}${normalizedPath}${
      rawQuery ? `?${rawQuery}` : ""
    }${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
    return;
  }

  const queryString = search.startsWith("?") ? search.slice(1) : search;
  const getRawParam = (key) => {
    for (const pair of queryString.split("&")) {
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
