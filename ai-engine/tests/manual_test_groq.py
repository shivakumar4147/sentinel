
from dotenv import load_dotenv

from app.groq_client import generate_response

load_dotenv()

prompt = """
Incident: Checkout API returns HTTP 500.

Evidence:
- Log: paymentMethod is undefined.
- Recent deployment changed saved-cart checkout.
- Database connectivity is healthy.

Identify the probable root cause and recommend an allowed action.
"""

result = generate_response(prompt)

print(result.model_dump_json(indent=2))
