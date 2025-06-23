import { getFaviconPath } from "@/utils/link.utils";
import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="${getFaviconPath("ms-icon-70x70.png")}" />
      <square150x150logo src="${getFaviconPath("ms-icon-150x150.png")}" />
      <square310x310logo src="${getFaviconPath("ms-icon-310x310.png")}" />
      <TileColor>#f8fafc</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

  return new Response(browserconfig, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
