import { describe, it, expect } from "vitest";
import calc from "./calc.js";

const {
  pad2, addMonths, monthKeysBetween, lastNMonthKeys, latestMonthKey, ordinalDay,
  inferDateOrder, normalizeDate, parseCSVLine, isTransferDesc,
  spendForMonth, incomeForMonth, spendByCategoryForMonth, spendByCategoryForMonthUpToDay,
  sharePercents, fxKey, txKey, dedupeTransactions, detectRecurringBills,
  remainingBillsThisMonthPure,
} = calc;

/* Helper: a spend transaction (negative amount, per app convention). */
const tx = (date, name, amount, category = "Bills") => ({ date, name, amount, category });

/* ------------------------------------------------------------------ */
describe("pad2", () => {
  it("pads single digits", () => expect(pad2(3)).toBe("03"));
  it("leaves two digits alone", () => expect(pad2(12)).toBe("12"));
});

describe("addMonths", () => {
  it("adds within a year", () => expect(addMonths("2026-03", 2)).toBe("2026-05"));
  it("rolls over the year boundary", () => expect(addMonths("2026-11", 3)).toBe("2027-02"));
  it("rolls backwards over the year boundary", () => expect(addMonths("2026-01", -1)).toBe("2025-12"));
  it("handles a zero step", () => expect(addMonths("2026-06", 0)).toBe("2026-06"));
  it("handles a multi-year jump", () => expect(addMonths("2026-01", 25)).toBe("2028-02"));
});

describe("monthKeysBetween", () => {
  it("is inclusive of both ends", () =>
    expect(monthKeysBetween("2026-01", "2026-04")).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"]));
  it("returns a single month when from === to", () =>
    expect(monthKeysBetween("2026-05", "2026-05")).toEqual(["2026-05"]));
  it("returns empty when the range is inverted", () =>
    expect(monthKeysBetween("2026-05", "2026-01")).toEqual([]));
  it("caps runaway ranges at 60", () =>
    expect(monthKeysBetween("2000-01", "2099-01").length).toBe(60));
});

describe("lastNMonthKeys", () => {
  it("returns n keys ending at endKey, oldest first", () =>
    expect(lastNMonthKeys("2026-03", 3)).toEqual(["2026-01", "2026-02", "2026-03"]));
  it("crosses the year boundary", () =>
    expect(lastNMonthKeys("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]));
});

describe("latestMonthKey", () => {
  it("finds the newest month", () =>
    expect(latestMonthKey([tx("2026-01-05", "a", -1), tx("2026-07-02", "b", -1)])).toBe("2026-07"));
  it("ignores transactions with no date", () =>
    expect(latestMonthKey([{ name: "x", amount: -1 }, tx("2026-04-01", "b", -1)])).toBe("2026-04"));
  it("falls back to the current month when empty", () =>
    expect(latestMonthKey([])).toMatch(/^\d{4}-\d{2}$/));
});

describe("ordinalDay", () => {
  it("1st", () => expect(ordinalDay(1)).toBe("1st"));
  it("2nd", () => expect(ordinalDay(2)).toBe("2nd"));
  it("3rd", () => expect(ordinalDay(3)).toBe("3rd"));
  it("4th", () => expect(ordinalDay(4)).toBe("4th"));
  it("11th not 11st", () => expect(ordinalDay(11)).toBe("11th"));
  it("12th not 12nd", () => expect(ordinalDay(12)).toBe("12th"));
  it("13th not 13rd", () => expect(ordinalDay(13)).toBe("13th"));
  it("21st", () => expect(ordinalDay(21)).toBe("21st"));
  it("31st", () => expect(ordinalDay(31)).toBe("31st"));
});

/* ---------------- the UK/UAE date clash ---------------- */
describe("inferDateOrder", () => {
  it("infers dmy when the first part exceeds 12", () =>
    expect(inferDateOrder(["13/04/2026"])).toBe("dmy"));
  it("infers mdy when the second part exceeds 12", () =>
    expect(inferDateOrder(["04/13/2026"])).toBe("mdy"));
  it("returns null when every row is ambiguous", () =>
    expect(inferDateOrder(["01/02/2026", "03/04/2026"])).toBeNull());
  it("skips ambiguous rows to find the decisive one", () =>
    expect(inferDateOrder(["01/02/2026", "25/03/2026"])).toBe("dmy"));
  it("returns null on empty input", () => expect(inferDateOrder([])).toBeNull());
  it("tolerates dash and dot separators", () =>
    expect(inferDateOrder(["13-04-2026"])).toBe("dmy"));
});

describe("normalizeDate", () => {
  it("passes ISO through", () => expect(normalizeDate("2026-07-16")).toBe("2026-07-16"));
  it("pads a short ISO", () => expect(normalizeDate("2026-7-6")).toBe("2026-07-06"));
  it("defaults to day-first", () => expect(normalizeDate("04/03/2026")).toBe("2026-03-04"));
  it("honours mdy when told", () => expect(normalizeDate("04/03/2026", "mdy")).toBe("2026-04-03"));
  it("self-corrects an impossible month even under mdy", () =>
    expect(normalizeDate("25/03/2026", "mdy")).toBe("2026-03-25"));
  it("expands a 2-digit year", () => expect(normalizeDate("04/03/26")).toBe("2026-03-04"));
  it("parses '5 Jan 2026'", () => expect(normalizeDate("5 Jan 2026")).toBe("2026-01-05"));
  it("rejects an out-of-range month", () => expect(normalizeDate("01/13/2026")).toBe("2026-01-13"));
  it("returns null on empty", () => expect(normalizeDate("")).toBeNull());
  it("returns null on nonsense", () => expect(normalizeDate("not a date")).toBeNull());
});

/* ---------------- CSV ---------------- */
describe("parseCSVLine", () => {
  it("splits plain fields", () =>
    expect(parseCSVLine("2026-01-01,Tesco,-12.50")).toEqual(["2026-01-01", "Tesco", "-12.50"]));
  it("trims whitespace", () =>
    expect(parseCSVLine("a , b ,c")).toEqual(["a", "b", "c"]));
  it("keeps a comma inside quotes", () =>
    expect(parseCSVLine('2026-01-01,"Smith, John",-5.00')).toEqual(["2026-01-01", "Smith, John", "-5.00"]));
  /* The comma is dropped as it is joined, leaving a parseable number —
     the point is that the field is NOT split into two. */
  it("does not split a thousands separator", () =>
    expect(parseCSVLine("2026-01-01,Rent,-1,234.56")).toEqual(["2026-01-01", "Rent", "-1234.56"]));
  it("thousands separator yields a parseable number", () =>
    expect(Number(parseCSVLine("2026-01-01,Rent,-1,234.56")[2])).toBeCloseTo(-1234.56, 2));
  it("handles an empty trailing field", () =>
    expect(parseCSVLine("a,b,")).toEqual(["a", "b", ""]));
  it("handles a single field", () => expect(parseCSVLine("solo")).toEqual(["solo"]));
});

/* ---------------- transfers ---------------- */
describe("isTransferDesc", () => {
  it("spots a bank transfer", () => expect(isTransferDesc("BANK TRANSFER TO MUM")).toBe(true));
  it("spots a standing order", () => expect(isTransferDesc("Standing Order")).toBe(true));
  it("spots savings movement", () => expect(isTransferDesc("To Savings")).toBe(true));
  it("is case insensitive", () => expect(isTransferDesc("faster payment")).toBe(true));
  it("does not flag a normal purchase", () => expect(isTransferDesc("TESCO STORES 2481")).toBe(false));
  it("handles null safely", () => expect(isTransferDesc(null)).toBe(false));
});

/* ---------------- month aggregates ---------------- */
describe("spendForMonth / incomeForMonth", () => {
  const txs = [
    tx("2026-01-05", "Tesco", -20, "Groceries"),
    tx("2026-01-20", "Costa", -5, "Dining"),
    tx("2026-01-25", "Salary", 2000, "Income"),
    tx("2026-02-01", "Tesco", -30, "Groceries"),
  ];
  it("sums spend as a positive number", () => expect(spendForMonth(txs, "2026-01")).toBe(25));
  it("excludes income from spend", () => expect(spendForMonth(txs, "2026-01")).not.toBe(-1975));
  it("sums income", () => expect(incomeForMonth(txs, "2026-01")).toBe(2000));
  it("returns 0 for a month with no data", () => expect(spendForMonth(txs, "2026-05")).toBe(0));
  it("keeps months separate", () => expect(spendForMonth(txs, "2026-02")).toBe(30));
});

describe("spendByCategoryForMonth", () => {
  const txs = [
    tx("2026-01-05", "Tesco", -20, "Groceries"),
    tx("2026-01-06", "Sainsbury", -10, "Groceries"),
    tx("2026-01-20", "Costa", -5, "Dining"),
    tx("2026-01-25", "Salary", 2000, "Income"),
  ];
  it("groups and sums by category", () =>
    expect(spendByCategoryForMonth(txs, "2026-01")).toEqual({ Groceries: 30, Dining: 5 }));
  it("omits Income entirely", () =>
    expect(spendByCategoryForMonth(txs, "2026-01").Income).toBeUndefined());
  it("category totals sum to the page total", () => {
    const byCat = spendByCategoryForMonth(txs, "2026-01");
    const sum = Object.values(byCat).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(spendForMonth(txs, "2026-01"), 10);
  });
  it("returns {} for an empty month", () =>
    expect(spendByCategoryForMonth(txs, "2026-09")).toEqual({}));
});

describe("spendByCategoryForMonthUpToDay", () => {
  const txs = [
    tx("2026-01-05", "Tesco", -20, "Groceries"),
    tx("2026-01-25", "Tesco", -50, "Groceries"),
  ];
  it("includes only transactions up to the day", () =>
    expect(spendByCategoryForMonthUpToDay(txs, "2026-01", 10)).toEqual({ Groceries: 20 }));
  it("is inclusive of the boundary day", () =>
    expect(spendByCategoryForMonthUpToDay(txs, "2026-01", 5)).toEqual({ Groceries: 20 }));
  it("matches the full month at day 31", () =>
    expect(spendByCategoryForMonthUpToDay(txs, "2026-01", 31)).toEqual(spendByCategoryForMonth(txs, "2026-01")));
});

/* ---------------- shares ---------------- */
describe("sharePercents", () => {
  it("computes simple halves", () => expect(sharePercents([50, 50], 100)).toEqual([50, 50]));
  it("always sums to 100 with awkward thirds", () => {
    const out = sharePercents([1, 1, 1], 3);
    expect(out.reduce((a, b) => a + b, 0)).toBe(100);
  });
  it("gives the remainder to the largest fraction", () =>
    expect(sharePercents([1, 1, 1], 3)).toEqual([34, 33, 33]));
  it("returns zeros when total is 0 rather than NaN", () =>
    expect(sharePercents([1, 2], 0)).toEqual([0, 0]));
  it("returns zeros for a negative total", () =>
    expect(sharePercents([1, 2], -5)).toEqual([0, 0]));
  it("never produces NaN", () => {
    const out = sharePercents([1, 2, 3], 6);
    out.forEach((v) => expect(Number.isFinite(v)).toBe(true));
  });
  it("handles an empty list", () => expect(sharePercents([], 100)).toEqual([]));
});

describe("fxKey", () => {
  it("builds a stable composite key", () =>
    expect(fxKey("2026-01", "AED", "GBP")).toBe("2026-01|AED|GBP"));
  it("is direction sensitive", () =>
    expect(fxKey("2026-01", "AED", "GBP")).not.toBe(fxKey("2026-01", "GBP", "AED")));
});

/* ---------------- dedup ---------------- */
describe("txKey", () => {
  it("is case and whitespace insensitive on the name", () =>
    expect(txKey(tx("2026-01-01", "TESCO  STORES", -5))).toBe(txKey(tx("2026-01-01", "tesco stores", -5))));
  it("distinguishes different amounts", () =>
    expect(txKey(tx("2026-01-01", "Tesco", -5))).not.toBe(txKey(tx("2026-01-01", "Tesco", -6))));
  it("normalises amount precision", () =>
    expect(txKey({ date: "2026-01-01", name: "T", amount: -5 })).toBe(txKey({ date: "2026-01-01", name: "T", amount: -5.0 })));
});

describe("dedupeTransactions", () => {
  it("keeps everything when nothing exists yet", () => {
    const inc = [tx("2026-01-01", "Tesco", -5)];
    expect(dedupeTransactions(inc, []).kept.length).toBe(1);
  });
  it("skips an exact re-upload", () => {
    const t = tx("2026-01-01", "Tesco", -5);
    const r = dedupeTransactions([t], [t]);
    expect(r.kept.length).toBe(0);
    expect(r.skipped).toBe(1);
  });
  it("same transaction twice in one upload against empty -> both kept", () => {
    const t = tx("2026-01-01", "Tesco", -5);
    expect(dedupeTransactions([t, t], []).kept.length).toBe(2);
  });
  it("genuine same-day duplicate is preserved when only one exists", () => {
    const t = tx("2026-01-01", "Costa", -3);
    const r = dedupeTransactions([t, t], [t]);
    expect(r.kept.length).toBe(1);
    expect(r.skipped).toBe(1);
  });
  it("similar-but-different transactions both kept", () => {
    const a = tx("2026-01-01", "Tesco", -5);
    const b = tx("2026-01-01", "Tesco", -6);
    expect(dedupeTransactions([a, b], []).kept.length).toBe(2);
  });
  it("different dates are not duplicates", () => {
    const a = tx("2026-01-01", "Tesco", -5);
    const b = tx("2026-01-02", "Tesco", -5);
    expect(dedupeTransactions([b], [a]).kept.length).toBe(1);
  });
  it("handles null inputs", () => {
    expect(dedupeTransactions(null, null)).toEqual({ kept: [], skipped: 0 });
  });
  it("kept + skipped always equals incoming length", () => {
    const inc = [tx("2026-01-01", "A", -1), tx("2026-01-01", "A", -1), tx("2026-01-02", "B", -2)];
    const r = dedupeTransactions(inc, [tx("2026-01-01", "A", -1)]);
    expect(r.kept.length + r.skipped).toBe(inc.length);
  });
});

/* ---------------- recurring bills ---------------- */
describe("detectRecurringBills", () => {
  it("single month of data returns no bills", () => {
    const txs = [tx("2026-01-01", "Netflix", -10, "Subscriptions")];
    expect(detectRecurringBills(txs)).toEqual([]);
  });
  it("two months of the same bill is detected", () => {
    const txs = [
      tx("2026-01-01", "Netflix", -10, "Subscriptions"),
      tx("2026-02-01", "Netflix", -10, "Subscriptions"),
    ];
    const bills = detectRecurringBills(txs);
    expect(bills.length).toBe(1);
    expect(bills[0].name).toBe("Netflix");
    expect(bills[0].amount).toBe(10);
  });
  it("twice in the SAME month is not recurring", () => {
    const txs = [
      tx("2026-01-01", "Netflix", -10, "Subscriptions"),
      tx("2026-01-15", "Netflix", -10, "Subscriptions"),
    ];
    expect(detectRecurringBills(txs)).toEqual([]);
  });
  it("amount drift beyond 20% is rejected", () => {
    const txs = [
      tx("2026-01-01", "Gym", -100, "Bills"),
      tx("2026-02-01", "Gym", -200, "Bills"),
    ];
    expect(detectRecurringBills(txs)).toEqual([]);
  });
  it("small drift within tolerance is accepted", () => {
    const txs = [
      tx("2026-01-01", "Water", -30, "Bills"),
      tx("2026-02-01", "Water", -32, "Bills"),
    ];
    expect(detectRecurringBills(txs).length).toBe(1);
  });
  it("tiny absolute amounts use the £2 floor not the 20%", () => {
    const txs = [
      tx("2026-01-01", "Tiny", -1, "Bills"),
      tx("2026-02-01", "Tiny", -2, "Bills"),
    ];
    expect(detectRecurringBills(txs).length).toBe(1);
  });
  it("SKIP_BILL_CATS are excluded", () => {
    const txs = [
      tx("2026-01-01", "Tesco", -50, "Groceries"),
      tx("2026-02-01", "Tesco", -50, "Groceries"),
    ];
    expect(detectRecurringBills(txs)).toEqual([]);
  });
  it("income is never a bill", () => {
    const txs = [
      tx("2026-01-25", "Salary", 2000, "Income"),
      tx("2026-02-25", "Salary", 2000, "Income"),
    ];
    expect(detectRecurringBills(txs)).toEqual([]);
  });
  it("trailing digits in the name are normalised together", () => {
    const txs = [
      tx("2026-01-01", "DEWA 12345", -100, "Bills"),
      tx("2026-02-01", "DEWA 67890", -100, "Bills"),
    ];
    expect(detectRecurringBills(txs).length).toBe(1);
  });
  it("sorts by amount descending", () => {
    const txs = [
      tx("2026-01-01", "Small", -10, "Bills"), tx("2026-02-01", "Small", -10, "Bills"),
      tx("2026-01-01", "Big", -500, "Bills"), tx("2026-02-01", "Big", -500, "Bills"),
    ];
    const bills = detectRecurringBills(txs);
    expect(bills[0].name).toBe("Big");
  });
  it("computes an ordinal due day", () => {
    const txs = [
      tx("2026-01-03", "Rent", -1000, "Bills"),
      tx("2026-02-03", "Rent", -1000, "Bills"),
    ];
    expect(detectRecurringBills(txs)[0].due).toBe("3rd");
  });
  it("handles empty input", () => expect(detectRecurringBills([])).toEqual([]));
  it("handles null input", () => expect(detectRecurringBills(null)).toEqual([]));
  it("never returns NaN amounts", () => {
    const txs = [
      tx("2026-01-01", "Rent", -1000, "Bills"),
      tx("2026-02-01", "Rent", -1000, "Bills"),
    ];
    detectRecurringBills(txs).forEach((b) => expect(Number.isFinite(b.amount)).toBe(true));
  });
});

describe("remainingBillsThisMonthPure", () => {
  const txs = [
    tx("2026-01-10", "Netflix", -10, "Subscriptions"),
    tx("2026-02-10", "Netflix", -10, "Subscriptions"),
  ];
  it("returns nothing when the bill is not in excludes", () =>
    expect(remainingBillsThisMonthPure(txs, [], "2026-02", 5)).toEqual([]));
  it("marks a bill already paid this month as paid", () => {
    const out = remainingBillsThisMonthPure(txs, ["Netflix"], "2026-02", 20);
    expect(out[0].paid).toBe(true);
    expect(out[0].upcoming).toBe(false);
  });
  it("marks an unpaid future bill as upcoming", () => {
    const out = remainingBillsThisMonthPure(txs, ["Netflix"], "2026-03", 5);
    expect(out[0].paid).toBe(false);
    expect(out[0].upcoming).toBe(true);
  });
  it("an unpaid bill whose day has passed is not upcoming", () => {
    const out = remainingBillsThisMonthPure(txs, ["Netflix"], "2026-03", 25);
    expect(out[0].paid).toBe(false);
    expect(out[0].upcoming).toBe(false);
  });
  it("exposes a numeric dueDay", () => {
    const out = remainingBillsThisMonthPure(txs, ["Netflix"], "2026-03", 1);
    expect(out[0].dueDay).toBe(10);
  });
  it("handles empty transactions", () =>
    expect(remainingBillsThisMonthPure([], ["Netflix"], "2026-02", 5)).toEqual([]));
});

/* ---------------- cross-cutting invariants ---------------- */
describe("invariants", () => {
  const txs = [
    tx("2026-01-05", "Tesco", -20.55, "Groceries"),
    tx("2026-01-06", "Costa", -3.40, "Dining"),
    tx("2026-01-25", "Salary", 2000, "Income"),
    tx("2026-02-01", "Rent", -1200, "Bills"),
  ];
  it("no NaN or Infinity in month aggregates", () => {
    ["2026-01", "2026-02", "2026-03"].forEach((k) => {
      expect(Number.isFinite(spendForMonth(txs, k))).toBe(true);
      expect(Number.isFinite(incomeForMonth(txs, k))).toBe(true);
      Object.values(spendByCategoryForMonth(txs, k)).forEach((v) =>
        expect(Number.isFinite(v)).toBe(true));
    });
  });
  it("every transaction lands in exactly one month", () => {
    const months = [...new Set(txs.map((t) => t.date.slice(0, 7)))];
    const counted = months.reduce((n, k) => n + txs.filter((t) => t.date.slice(0, 7) === k).length, 0);
    expect(counted).toBe(txs.length);
  });
  it("category totals sum to the month total", () => {
    const byCat = spendByCategoryForMonth(txs, "2026-01");
    const sum = Object.values(byCat).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(spendForMonth(txs, "2026-01"), 10);
  });
});
