import { nextIndex, prevIndex, formatDate, formatRelative } from "./utils";

describe("nextIndex", () => {
  const fiveItems = [1, 2, 3, 4, 5];
  test("works with middle index", () => {
    expect(nextIndex(fiveItems, 2)).toBe(3);
  });
  test("works with last index", () => {
    expect(nextIndex(fiveItems, 4)).toBe(4);
  });
  test("works with fractions", () => {
    expect(nextIndex(fiveItems, 1.1)).toBe(2);
    expect(nextIndex(fiveItems, 1.9)).toBe(2);
  });
});

describe("prevIndex", () => {
  const fiveItems = [1, 2, 3, 4, 5];
  test("works with middle index", () => {
    expect(prevIndex(fiveItems, 2)).toBe(1);
  });
  test("works with start index", () => {
    expect(prevIndex(fiveItems, 0)).toBe(0);
  });
  test("works with fractions", () => {
    expect(prevIndex(fiveItems, 1.1)).toBe(1);
    expect(prevIndex(fiveItems, 1.9)).toBe(1);
  });
});

describe("formatRelative", () => {
  const now = new Date(2026, 10, 3, 12);
  test("same day", () => {
    expect(formatRelative(new Date(2026, 10, 3, 8), now)).toBe("hoje");
  });
  test("days", () => {
    expect(formatRelative(new Date(2026, 9, 29, 12), now)).toBe("há 5 dias");
  });
  test("years", () => {
    expect(formatRelative(new Date(2024, 5, 6), now)).toBe("há 2 anos");
  });
});

describe("formatDate", () => {
  test("pads day and month", () => {
    expect(formatDate(new Date(2026, 10, 3))).toBe("03/11/2026");
  });
});
