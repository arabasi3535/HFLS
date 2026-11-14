import { ago } from "./LiveVideos";

test("ago — 상대 시각", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  expect(ago("2026-11-14T11:30:00Z", now)).toBe("30분 전");
  expect(ago("2026-11-14T09:00:00Z", now)).toBe("3시간 전");
  expect(ago("2026-11-12T12:00:00Z", now)).toBe("2일 전");
  expect(ago("2026-10-31T12:00:00Z", now)).toBe("2주 전");
  expect(ago("2026-08-14T12:00:00Z", now)).toBe("3개월 전");
  expect(ago("2024-11-14T12:00:00Z", now)).toBe("2년 전");
});
