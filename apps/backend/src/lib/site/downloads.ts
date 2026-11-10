type DownloadEnvironment = { ANDROID_DOWNLOAD_URL?: string; IOS_DOWNLOAD_URL?: string };

function httpsUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function getDownloads(env: DownloadEnvironment, bundledAndroidExists = false) {
  const iosUrl = httpsUrl(env.IOS_DOWNLOAD_URL);
  let ios: string | null = null;
  if (iosUrl) {
    const url = new URL(iosUrl);
    if ((url.hostname === "testflight.apple.com" && /^\/join\/[A-Za-z0-9]{8}\/?$/.test(url.pathname)) ||
        (url.hostname === "apps.apple.com" && /^\/(?:[a-z]{2}\/)?app\/(?:[^/]+\/)?id\d{6,}\/?$/.test(url.pathname))) {
      ios = iosUrl;
    }
  }
  return {
    android: httpsUrl(env.ANDROID_DOWNLOAD_URL) ?? (bundledAndroidExists ? "/downloads/english-coach.apk" : null),
    ios,
  };
}
