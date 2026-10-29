import { test } from "node:test";
import assert from "node:assert/strict";

import { parseExpectCt } from "../src/core.js";

test("simple max-age only", () => {
  assert.deepEqual(parseExpectCt("max-age=10"), {
    maxAge: 10,
    enforce: false,
  });
});

test("enforce flag sets boolean true", () => {
  assert.deepEqual(parseExpectCt("enforce"), { enforce: true });
});

test("report-uri quoted value is extracted", () => {
  assert.deepEqual(
    parseExpectCt('max-age=30; enforce; report-uri="https://ct.example/report"'),
    { maxAge: 30, enforce: true, reportUri: "https://ct.example/report" },
  );
});

test("whitespace around the whole value is trimmed", () => {
  assert.deepEqual(parseExpectCt("  max-age=42  "), {
    maxAge: 42,
    enforce: false,
  });
});

test("whitespace around directives is trimmed", () => {
  assert.deepEqual(
    parseExpectCt("  max-age=7  ;  enforce  "),
    { maxAge: 7, enforce: true },
  );
});

test("empty string returns default", () => {
  assert.deepEqual(parseExpectCt(""), { enforce: false });
});

test("non-string input returns default", () => {
  assert.deepEqual(parseExpectCt(null), { enforce: false });
  assert.deepEqual(parseExpectCt(undefined), { enforce: false });
});

test("unknown directive is ignored", () => {
  assert.deepEqual(parseExpectCt("max-age=5; foo=bar"), {
    maxAge: 5,
    enforce: false,
  });
});

test("duplicate max-age: last value wins", () => {
  assert.deepEqual(parseExpectCt("max-age=10; max-age=20"), {
    maxAge: 20,
    enforce: false,
  });
});

test("non-numeric max-age is ignored", () => {
  assert.deepEqual(parseExpectCt("max-age=abc"), { enforce: false });
});

test("max-age with no value is ignored", () => {
  assert.deepEqual(parseExpectCt("max-age"), { enforce: false });
});

test("unquoted report-uri value is ignored", () => {
  assert.deepEqual(parseExpectCt("report-uri=foo"), { enforce: false });
});

test("enforce with trailing equals is still a flag", () => {
  assert.deepEqual(parseExpectCt("enforce=1"), { enforce: true });
});

test("trailing semicolons do not break parsing", () => {
  assert.deepEqual(parseExpectCt("max-age=5;"), {
    maxAge: 5,
    enforce: false,
  });
});

test("empty segments between semicolons are skipped", () => {
  assert.deepEqual(parseExpectCt("max-age=5;;enforce;;"), {
    maxAge: 5,
    enforce: true,
  });
});
