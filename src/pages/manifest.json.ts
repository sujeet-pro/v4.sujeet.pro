import { getFaviconPath } from "@/utils/link.utils"
import type { APIRoute } from "astro"

export const GET: APIRoute = () => {
  const manifest = {
    name: "Sujeet",
    short_name: "Sujeet",
    description: "Sujeet's personal website and blog",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    orientation: "portrait-primary",
    icons: [
      {
        src: getFaviconPath("android-icon-36x36.png"),
        sizes: "36x36",
        type: "image/png",
        density: "0.75",
      },
      {
        src: getFaviconPath("android-icon-48x48.png"),
        sizes: "48x48",
        type: "image/png",
        density: "1.0",
      },
      {
        src: getFaviconPath("android-icon-72x72.png"),
        sizes: "72x72",
        type: "image/png",
        density: "1.5",
      },
      {
        src: getFaviconPath("android-icon-96x96.png"),
        sizes: "96x96",
        type: "image/png",
        density: "2.0",
      },
      {
        src: getFaviconPath("android-icon-144x144.png"),
        sizes: "144x144",
        type: "image/png",
        density: "3.0",
      },
      {
        src: getFaviconPath("android-icon-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        density: "4.0",
      },
    ],
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
