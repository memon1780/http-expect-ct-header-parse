/**
 * Parses a single Expect-CT response header value into its directives.
 *
 * The Expect-CT header grammar (RFC 6962 §2.3.5, Expect-CT)
 * is a semicolon-separated list of directives:
 *
 *   max-age        = delta-seconds
 *   enforce        (flag — no value)
 *   report-uri     = quoted-string
 *
 * Interpretation decisions taken (stated plainly so callers know
 * exactly what they get):
 *
 * 1. Whitespace around the whole value and around individual
 *    directives is trimmed. " max-age=10 ; enforce " parses the
 *    same as "max-age=10; enforce".
 * 2. max-age is returned as an integer (Number). If the directive
 *    appears more than once, the LAST occurrence wins — this
 *    matches how browsers are observed to process duplicated
 *    directives in similar security headers.
 * 3. max-age with a non-numeric value (e.g. "max-age=abc") is
 *    silently ignored; the field stays undefined. We do not
 *    throw — a malformed Expect-CT should not crash the consumer.
 * 4. enforce is a boolean flag. Present at all (even
 *    "enforce=something") → true. Absent → false.
 * 5. report-uri is the raw string inside the double quotes. We do
 *    not URL-validate it. Unquoted "report-uri=foo" is treated
 *    as having no value (returns undefined) because the grammar
 *    requires a quoted-string.
 * 6. Unknown directives are ignored, not errors.
 * 7. Empty or whitespace-only input yields { enforce: false }.
 *
 * @param {string} headerValue - raw header value (may be null/undefined)
 * @returns {{ maxAge?: number, reportUri?: string, enforce: boolean }}
 */
export function parseExpectCt(headerValue) {
  const result = { enforce: false };

  if (typeof headerValue !== "string") {
    return result;
  }

  const trimmed = headerValue.trim();
  if (trimmed.length === 0) {
    return result;
  }

  const parts = trimmed.split(";");

  for (const part of parts) {
    const segment = part.trim();
    if (segment.length === 0) {
      continue;
    }

    const eqIndex = segment.indexOf("=");
    let name, rawValue;
    if (eqIndex === -1) {
      name = segment;
      rawValue = "";
    } else {
      name = segment.slice(0, eqIndex).trim();
      rawValue = segment.slice(eqIndex + 1).trim();
    }

    const directive = name.toLowerCase();

    if (directive === "max-age") {
      if (rawValue.length === 0) {
        // max-age with no value — ignore per the lenient policy above.
        continue;
      }
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed) && parsed >= 0) {
        result.maxAge = Math.floor(parsed);
      }
      // Non-numeric or negative max-age → silently ignored.
    } else if (directive === "enforce") {
      // Flag directive: presence alone is meaningful. We do not
      // care about a trailing value.
      result.enforce = true;
    } else if (directive === "report-uri") {
      // The grammar mandates a quoted-string. Strip surrounding
      // double quotes only if both are present.
      if (
        rawValue.length >= 2 &&
        rawValue.startsWith('"') &&
        rawValue.endsWith('"')
      ) {
        result.reportUri = rawValue.slice(1, -1);
      }
      // Unquoted value → ignored (does not match the grammar).
    }
    // Unknown directive → ignored.
  }

  return result;
}
