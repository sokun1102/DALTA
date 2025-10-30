import API from "./api";

export const imageUrl = (pathOrUrl) => {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = (API.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
};


