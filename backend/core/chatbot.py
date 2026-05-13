from datetime import date, timedelta
import re

from .models import CATEGORY_CHOICES, CustomCake, Order, Product


PREPARATION_DAYS = 2
DAILY_ORDER_LIMIT = 3

CATEGORY_LABELS = dict(CATEGORY_CHOICES)
CATEGORY_KEYWORDS = {
    "birthday": ["birthday", "party", "celebration"],
    "wedding": ["wedding", "anniversary"],
    "cupcake": ["cupcake", "cupcakes", "mini"],
    "bento": ["bento", "small", "mini cake"],
    "pastry": ["pastry", "pastries"],
    "dessert": ["dessert", "sweet"],
}
FLAVOR_KEYWORDS = [
    "butter cake",
    "chocolate",
    "red velvet",
    "vanilla",
    "strawberry",
    "coffee",
    "lemon",
    "caramel",
    "butterscotch",
    "black forest",
    "fruit",
    "blueberry",
]
DEFAULT_PROMPTS = [
    "What cake flavors do you have?",
    "How many days before should I order?",
    "Can I upload my own design?",
    "What payment methods are available?",
]


def normalize_message(message):
    return re.sub(r"\s+", " ", (message or "").strip().lower())


def available_products():
    return Product.objects.filter(available=True).order_by("category", "price", "name")


def product_payload(product):
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "category_label": CATEGORY_LABELS.get(product.category, product.category.title()),
        "description": product.description,
        "price": str(product.price),
        "image": product.image.url if product.image else "",
    }


def detect_category(message):
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in message for keyword in keywords):
            return category
    return None


def detect_flavor(message):
    return next((flavor for flavor in FLAVOR_KEYWORDS if flavor in message), None)


def matching_products(message, limit=3):
    category = detect_category(message)
    flavor = detect_flavor(message)
    products = available_products()

    if category:
        products = products.filter(category=category)

    if flavor:
        products = products.filter(
            name__icontains=flavor
        ) | available_products().filter(
            description__icontains=flavor
        )
        if category:
            products = products.filter(category=category)

    if not category and not flavor:
        for keyword in message.split():
            if len(keyword) >= 4:
                keyword_matches = products.filter(name__icontains=keyword)
                if keyword_matches.exists():
                    products = keyword_matches
                    break

    return list(products.distinct()[:limit])


def extract_flavors(products):
    detected = []
    text_values = " ".join(
        f"{product.name} {product.description}" for product in products
    ).lower()
    for flavor in FLAVOR_KEYWORDS:
        if flavor in text_values:
            detected.append(flavor.title())
    return detected


def next_available_delivery_dates(limit=3):
    start_date = date.today() + timedelta(days=PREPARATION_DAYS)
    dates = []
    offset = 0

    while len(dates) < limit and offset < 30:
        current_date = start_date + timedelta(days=offset)
        standard_orders = Order.objects.filter(delivery_date=current_date).count()
        custom_orders = CustomCake.objects.filter(delivery_date=current_date).count()
        if standard_orders < DAILY_ORDER_LIMIT and custom_orders < DAILY_ORDER_LIMIT:
            dates.append(current_date.isoformat())
        offset += 1

    return dates


def build_response(message):
    normalized = normalize_message(message)
    products = list(available_products()[:12])
    selected_products = matching_products(normalized)
    lower_products = [product_payload(product) for product in selected_products]

    if not normalized:
        return {
            "answer": "Ask me about cake flavors, ordering, delivery dates, payment methods, or custom cake designs.",
            "intent": "empty",
            "suggestions": DEFAULT_PROMPTS,
            "products": [],
        }

    if any(word in normalized for word in ["tomorrow", "unavailable", "can't select", "cant select", "why can't", "why cant"]):
        dates = next_available_delivery_dates()
        return {
            "answer": (
                f"Tomorrow is unavailable because orders must be placed at least {PREPARATION_DAYS} days before delivery. "
                f"We also accept up to {DAILY_ORDER_LIMIT} standard orders and {DAILY_ORDER_LIMIT} custom cake requests per delivery date. "
                f"Next available dates: {', '.join(dates) if dates else 'please check the delivery calendar'}."
            ),
            "intent": "delivery_availability",
            "suggestions": ["How do I place an order?", "Can I upload my own design?", "Show birthday cakes"],
            "products": [],
        }

    if any(word in normalized for word in ["delivery", "date", "days before", "advance", "prepare", "preparation"]):
        dates = next_available_delivery_dates()
        return {
            "answer": (
                f"Please place orders at least {PREPARATION_DAYS} days before the delivery date. "
                f"Each delivery date can accept up to {DAILY_ORDER_LIMIT} standard orders and {DAILY_ORDER_LIMIT} custom cake requests. "
                f"Available dates usually start from {dates[0] if dates else 'the first open date shown in checkout'}."
            ),
            "intent": "delivery_rules",
            "suggestions": ["Why can't I select tomorrow?", "How do I checkout?", "Can I customize a cake?"],
            "products": [],
        }

    if any(word in normalized for word in ["payment", "pay", "cod", "cash", "online", "pickup"]):
        return {
            "answer": "You can choose cash on delivery or pickup at checkout. Pickup means you collect the order from the bakery, while cash on delivery is paid when the cake is delivered.",
            "intent": "payment",
            "suggestions": ["How do I place an order?", "What delivery dates are available?", "Show me cakes"],
            "products": [],
        }

    if any(word in normalized for word in ["custom", "customize", "design", "upload", "own design", "image", "photo", "reference"]):
        return {
            "answer": "Yes, you can create a custom cake request. Choose the occasion, cake size, flavor, color, shape, quantity, delivery date, and upload a reference image for your design.",
            "intent": "customization",
            "suggestions": ["How many days before should I order?", "What flavors do you have?", "I need a birthday cake"],
            "products": [],
        }

    if any(word in normalized for word in ["order", "checkout", "buy", "cart", "steps", "how do i"]):
        return {
            "answer": "To order: select a cake from the catalog, add it to your cart, choose a delivery date at least 2 days ahead, enter contact and address details, then checkout with cash on delivery or pickup.",
            "intent": "ordering",
            "suggestions": ["Why is tomorrow unavailable?", "What payment methods are available?", "Show popular cakes"],
            "products": lower_products,
        }

    if any(word in normalized for word in ["flavor", "flavour", "taste", "have"]):
        flavors = extract_flavors(products)
        flavor_text = ", ".join(flavors[:8]) if flavors else "Chocolate, Red Velvet, Vanilla, Strawberry, and other bakery flavors depending on current catalog availability"
        return {
            "answer": f"Current catalog flavors include: {flavor_text}. You can also request a specific flavor through the custom cake form.",
            "intent": "flavors",
            "suggestions": ["I need a birthday cake", "Can I customize a cake?", "Show wedding cakes"],
            "products": lower_products,
        }

    if detect_category(normalized) or detect_flavor(normalized) or any(word in normalized for word in ["recommend", "suggest", "need", "want", "cake"]):
        category = detect_category(normalized)
        if selected_products:
            lead = "Here are the best matches from the current catalog"
            if category:
                lead = f"For {CATEGORY_LABELS.get(category, category)} orders, these are good matches"
            recommendation = selected_products[0]
            answer = (
                f"{lead}. I recommend {recommendation.name} first. "
                f"It is listed at Rs. {recommendation.price}. For about 15-20 people, choose a 2kg custom cake if you need a larger birthday-style serving."
            )
        else:
            answer = "I can help you choose a cake, but I do not see a matching available product right now. For birthday orders, Chocolate or Red Velvet are reliable choices, and a 2kg cake usually suits about 15-20 people."

        return {
            "answer": answer,
            "intent": "recommendation",
            "suggestions": ["How do I place an order?", "Can I upload my own design?", "What payment methods are available?"],
            "products": lower_products,
        }

    return {
        "answer": "I can help with cake recommendations, ordering steps, delivery rules, custom designs, uploaded references, and payment methods. Try asking what kind of cake you need or when you need it delivered.",
        "intent": "fallback",
        "suggestions": DEFAULT_PROMPTS,
        "products": [],
    }
