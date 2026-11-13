
import os

from groq import Groq
from app.schemas import IncidentDiagnosis


MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")


def generate_response(prompt: str) -> IncidentDiagnosis:
    """
    Generate a structured incident diagnosis using Groq.

    The response is validated against IncidentDiagnosis.
    """

    client = Groq(
        api_key=os.getenv("GROQ_API_KEY"),
        timeout=30.0,
        max_retries=0,
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Sentinel, an incident investigation AI. "
                    "Analyze supplied evidence and identify the most "
                    "likely cause. Be concise. Never invent evidence. "
                    "Distinguish facts from hypotheses. If evidence "
                    "is insufficient, lower confidence and recommend "
                    "escalation when necessary."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "incident_diagnosis",
                "schema": {
    **IncidentDiagnosis.model_json_schema(),
    "additionalProperties": False,
},
                "strict": True,
            },
        },
        temperature=0,
        max_completion_tokens=800,
    )

    content = response.choices[0].message.content

    if not content:
        raise ValueError("Groq returned an empty response")

    return IncidentDiagnosis.model_validate_json(content)
