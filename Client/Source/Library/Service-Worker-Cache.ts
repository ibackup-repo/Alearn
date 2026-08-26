const CACHE_NAME = "Alearn_Corpus_Cache_v1";

export async function Cache_Asset(Url: string): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const Cache_Storage = await caches.open(CACHE_NAME);
    await Cache_Storage.add(Url);
  } catch (Error: any) {
    console.error(`[Cache Error] Failed to cache ${Url}:`, Error);
  }
}

export async function Get_Cached_Response(Url: string): Promise<Response | null> {
  if (!('caches' in window)) return null;
  try {
    const Cache_Storage = await caches.open(CACHE_NAME);
    const Response_Match = await Cache_Storage.match(Url);
    return Response_Match || null;
  } catch (Error: any) {
    console.error(`[Cache Error] Match failed for ${Url}:`, Error);
    return null;
  }
}

export async function Fetch_With_Cache_Fallback<T = any>(Url: string): Promise<T> {
  const Cached = await Get_Cached_Response(Url);
  if (Cached) {
    return await Cached.json();
  }

  const Network_Response = await fetch(Url);
  if (Network_Response.ok) {
    const Cache_Storage = await caches.open(CACHE_NAME);
    Cache_Storage.put(Url, Network_Response.clone());
  }
  return await Network_Response.json();
}

export async function Clear_Corpus_Cache(): Promise<boolean> {
  if (!('caches' in window)) return false;
  return await caches.delete(CACHE_NAME);
}