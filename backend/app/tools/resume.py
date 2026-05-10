async def parse_resume(resume_text: str) -> dict:
    """
    Extract structured data from resume text.
    This is called as a tool by the Personalization Agent —
    the LLM itself does the parsing via its own reasoning.
    We just return the text for the LLM to work with.
    """
    return {
        "resume_text": resume_text[:5000],
        "instruction": (
            "Extract: key skills, work experiences, projects, achievements, "
            "education, and any unique angles (hackathon wins, open source, "
            "startup experience, etc.)"
        ),
    }
