# Sample checkout fixture

This directory is an isolated demo input for Sentinel's read-only code
inspection workflow. It does not connect to a real payment provider.

## Intentional bug

`handle_checkout()` calls `.lower()` on `request.get("paymentMethod")` before
checking that the value exists and is a string. A request with a missing or
`None` `paymentMethod` raises `AttributeError` instead of returning a
validation error.

The bug is intentionally left unfixed so Sentinel can identify and recommend a
safe correction.
