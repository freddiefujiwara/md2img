import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

/**
 * Handles SPA redirection for environments like GitHub Pages.
 * It parses the query parameters to find a redirect path and query.
 */
const applySpaRedirect = () => {
  if (typeof window === "undefined") return;

  const { search, hash } = window.location;
  if (!search) return;

  // Handle the "?/" pattern (e.g., from 404.html redirection)
  if (search.startsWith("?/")) {
    const trimmed = search.slice(2);
    const [rawPath, rawQuery] = trimmed.split("&");
    const normalizedPath = rawPath.replace(/^\//, "");
    const nextUrl = `${import.meta.env.BASE_URL}${normalizedPath}${
      rawQuery ? `?${rawQuery}` : ""
    }${hash}`;
    window.history.replaceState(null, "", nextUrl);
    return;
  }

  // Handle standard "p=" and "q=" parameters
  const params = new URLSearchParams(search);
  const redirectPath = params.get("p");
  if (redirectPath) {
    const query = params.get("q");
    const normalizedPath = redirectPath.replace(/^\//, "");
    const nextUrl = `${import.meta.env.BASE_URL}${normalizedPath}${
      query ? `?${query}` : ""
    }${hash}`;
    window.history.replaceState(null, "", nextUrl);
  }
};

applySpaRedirect();

createApp(App).use(router).mount("#app");
