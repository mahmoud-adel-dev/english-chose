import { describe, expect, it } from "vitest";
import { getDownloads } from "../src/lib/site/downloads";

describe("public download links", () => {
  it("does not advertise an unbuilt APK or unavailable iOS release", () => {
    expect(getDownloads({})).toEqual({ android: null, ios: null });
  });
  it("uses the bundled real APK only when the caller confirms it exists", () => {
    expect(getDownloads({}, true).android).toBe("/downloads/english-coach.apk");
  });
  it("allows configurable HTTPS distribution URLs", () => {
    expect(getDownloads({ ANDROID_DOWNLOAD_URL: "https://example.com/app.apk", IOS_DOWNLOAD_URL: "https://testflight.apple.com/join/AbCd1234" }))
      .toEqual({ android: "https://example.com/app.apk", ios: "https://testflight.apple.com/join/AbCd1234" });
  });
  it.each(["https://example.com/ios", "https://apps.apple.com/", "https://testflight.apple.com/join/", "https://apps.apple.com.evil.example/app/id1234567890"])("rejects non-distribution iOS URL %s", (url) => {
    expect(getDownloads({ IOS_DOWNLOAD_URL: url }).ios).toBeNull();
  });
  it("accepts an App Store app listing", () => {
    expect(getDownloads({ IOS_DOWNLOAD_URL: "https://apps.apple.com/eg/app/english-coach/id1234567890" }).ios).toBe("https://apps.apple.com/eg/app/english-coach/id1234567890");
  });
  it.each(["javascript:alert(1)", "http://example.com/app.apk", "//example.com/app.apk", "https://user:password@example.com/app.apk", "not a URL"])("rejects unsafe URL %s", (url) => {
    expect(getDownloads({ ANDROID_DOWNLOAD_URL: url, IOS_DOWNLOAD_URL: url })).toEqual({ android: null, ios: null });
  });
});
