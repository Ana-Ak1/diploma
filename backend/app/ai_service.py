def generate_ai_recommendation_explanation(item: dict) -> dict:
    """
    Fallback без внешнего AI API.
    Просто возвращает уже рассчитанные локально поля.
    """

    return {
        "title": item.get("title", "Рекомендация"),
        "reason": item.get("reason", ""),
        "recommendation_type": item.get("recommendation_type", "hold"),
        "priority": item.get("priority", "medium"),
    }