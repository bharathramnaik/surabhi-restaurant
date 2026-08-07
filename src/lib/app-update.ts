const OWNER = "bharathramnaik";
const REPO = "surabhi-restaurant";

export type AppUpdateInfo = { latestVersion: string; url: string; body?: string };

export function currentAppVersion(): string {
  return (import.meta.env.VITE_APP_VERSION as string) || "3.0.0";
}

function parseVersion(v: string): number[] {
  return v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
}

export function isNewerVersion(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export async function fetchLatestRelease(): Promise<AppUpdateInfo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest?t=${Date.now()}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data: {
      tag_name?: string;
      body?: string;
      assets?: { name?: string; browser_download_url?: string }[];
    } = await res.json();
    const tag = data.tag_name;
    if (!tag) return null;
    const asset = (data.assets || []).find((a) => a.name?.toLowerCase().endsWith(".apk"));
    if (!asset?.browser_download_url) return null;
    return {
      latestVersion: tag.replace(/^v/, ""),
      url: asset.browser_download_url,
      body: data.body,
    };
  } catch {
    return null;
  }
}