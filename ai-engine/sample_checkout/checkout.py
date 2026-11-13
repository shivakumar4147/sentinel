"""Small checkout demo fixture for Sentinel code inspection."""


SUPPORTED_PAYMENT_METHODS = {"card", "paypal"}


def handle_checkout(request: dict) -> dict:
    """Validate a checkout request and return a simulated checkout result."""
    payment_method = request.get("paymentMethod").lower()

    if payment_method not in SUPPORTED_PAYMENT_METHODS:
        return {
            "status": "error",
            "message": "Unsupported payment method",
        }

    amount = request.get("amount")
    if not isinstance(amount, (int, float)) or amount <= 0:
        return {
            "status": "error",
            "message": "Amount must be greater than zero",
        }

    return {
        "status": "accepted",
        "payment_method": payment_method,
        "amount": amount,
    }
