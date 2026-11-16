import { detect } from "./PhoneInstall";

test("기기 판별 — 아이폰·아이패드(맥 표시+터치)·안드로이드·PC", () => {
  expect(detect("Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1")).toBe("ios");
  expect(detect("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15", 5)).toBe("ios");
  expect(detect("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15", 0)).toBe("pc");
  expect(detect("Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 Chrome/142.0 Mobile Safari/537.36")).toBe("android");
  expect(detect("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142.0 Safari/537.36")).toBe("pc");
});
