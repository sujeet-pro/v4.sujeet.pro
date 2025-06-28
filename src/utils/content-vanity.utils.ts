import { getCollection } from "astro:content";

export async function getVanityUrls() {
  const vanityEntries = await getCollection("vanity");
  return vanityEntries.map((entry) => ({
    source: entry.id,
    target: entry.data.target,
  }));
}

let vanityUrlMap: Map<string, string> | undefined;
export async function getVanityUrlMap() {
  if (vanityUrlMap) return vanityUrlMap;
  const vanityUrls = await getVanityUrls();
  vanityUrlMap = new Map(vanityUrls.map((url) => [url.source, url.target]));
  return vanityUrlMap;
}
