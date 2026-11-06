# http-expect-ct-header-parse

Parses an HTTP `Expect-CT` response header value into `maxAge`, `reportUri`, and `enforce` fields.

```js
import { parseExpectCt } from "http-expect-ct-header-parse";

const directives = parseExpectCt('max-age=30; enforce; report-uri="https://ct.example/report"');
// { maxAge: 30, enforce: true, reportUri: "https://ct.example/report" }
```

## Why this exists

Reading the `Expect-CT` header by hand is easy to get wrong: `enforce` is a flag with no value, `max-age` is numeric, and `report-uri` is a quoted string. This library does that one job and returns a plain object, so a monitoring or proxy layer can inspect the header without a regular expression that only handles the happy path.

The trade-off: the parser is lenient. A malformed `max-age` is silently ignored rather than thrown, because a consumer inspecting response headers should not crash on a bad header from some origin it does not control. Unknown directives are dropped.

## Edge you will hit

`report-uri` must be a double-quoted string per the grammar. `report-uri=foo` (no quotes) returns `undefined` for `reportUri`, not the raw token. If your test fixtures omit the quotes, this is the behaviour to expect.

Duplicated `max-age` directives resolve to the **last** value, matching how browsers process duplicated directives in similar security headers.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

