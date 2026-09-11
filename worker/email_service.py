import os
import smtplib
from email.message import EmailMessage

from jinja2 import Environment, FileSystemLoader

from service.util.configuration import settings
from service.util.logger import logger

_TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates", "email")
_jinja_env = Environment(loader=FileSystemLoader(_TEMPLATES_DIR), autoescape=True)


def send_wishlist_status_email(to_email: str, outcomes: list[dict]) -> None:
    if not settings.smtp_from or not settings.smtp_token:
        logger.warning("SMTP not configured, skipping batch email to %s", to_email)
        return

    downloaded = sum(1 for o in outcomes if o.get("success"))
    total = len(outcomes)
    subject = f"CDM Wishlist: {downloaded}/{total} downloaded this week"

    plain = "\n".join(
        f"{'✓' if o.get('success') else ('✗' if o.get('found') else '⏳')} {o['title']} ({o['device_name']}, {o['torrent_type'].upper()})"
        for o in outcomes
    )

    html = _jinja_env.get_template("wishlist_batch.html").render(outcomes=outcomes)

    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(plain)
    msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_from, settings.smtp_token)
            smtp.send_message(msg)
        logger.info("Batch email sent to %s (%d items)", to_email, total)
    except Exception:
        logger.exception("Failed to send batch email to %s", to_email)
