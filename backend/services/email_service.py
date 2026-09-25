import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from core.config import settings

logger = logging.getLogger(__name__)

def generate_reset_password_html(full_name: str, reset_url: str, expire_minutes: int) -> str:
    """Tạo mẫu HTML email đặt lại mật khẩu chuẩn thương hiệu ChiChan."""
    return f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Khôi phục mật khẩu - ChiChan</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #F8FAFC;
                margin: 0;
                padding: 0;
                color: #1E293B;
            }}
            .email-container {{
                max-width: 580px;
                margin: 30px auto;
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 4px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }}
            .email-header {{
                background: #005039;
                color: #FFFFFF;
                padding: 28px 32px;
                text-align: center;
            }}
            .email-header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .email-header p {{
                margin: 6px 0 0;
                font-size: 13px;
                opacity: 0.9;
            }}
            .email-body {{
                padding: 32px;
                font-size: 15px;
                line-height: 1.6;
            }}
            .user-greeting {{
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 16px;
                color: #0F172A;
            }}
            .cta-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .cta-button {{
                display: inline-block;
                background-color: #008272;
                color: #FFFFFF !important;
                text-decoration: none;
                padding: 14px 32px;
                font-weight: 700;
                font-size: 15px;
                border-radius: 2px;
                box-shadow: 0 2px 4px rgba(0, 130, 114, 0.3);
            }}
            .link-fallback {{
                background-color: #F1F5F9;
                padding: 12px;
                border-radius: 4px;
                word-break: break-all;
                font-size: 12px;
                color: #475569;
                margin-top: 20px;
            }}
            .email-footer {{
                background: #F8FAFC;
                border-top: 1px solid #E2E8F0;
                padding: 20px 32px;
                font-size: 12px;
                color: #64748B;
                text-align: center;
            }}
            .security-notice {{
                margin-top: 16px;
                font-size: 13px;
                color: #64748B;
                border-left: 3px solid #F59E0B;
                padding-left: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>ChiChan</h1>
                <p>Nền tảng Giáo dục Giới tính & Sức khỏe Vị thành niên</p>
            </div>
            <div class="email-body">
                <div class="user-greeting">Xin chào {full_name},</div>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ChiChan của bạn. Vui lòng bấm vào nút bên dưới để tiến hành tạo mật khẩu mới:</p>
                
                <div class="cta-container">
                    <a href="{reset_url}" target="_blank" class="cta-button">Đặt Lại Mật Khẩu Ngay</a>
                </div>

                <div class="security-notice">
                    <strong>Lưu ý bảo mật:</strong> Liên kết này chỉ có hiệu lực trong vòng <strong>{expire_minutes} phút</strong>. Nếu bạn không gửi yêu cầu này, bạn có thể an tâm bỏ qua email này — mật khẩu hiện tại của bạn vẫn được bảo vệ an toàn.
                </div>

                <p style="margin-top: 24px; font-size: 13px; color: #64748B;">
                    Nếu nút trên không hoạt động, bạn có thể sao chép và dán trực tiếp đường dẫn sau vào trình duyệt web:
                </p>
                <div class="link-fallback">
                    {reset_url}
                </div>
            </div>
            <div class="email-footer">
                <p>© {settings.SMTP_FROM_NAME} • Đề tài Nghiên cứu Khoa học THPT Giồng Ông Tố</p>
                <p>Email này được gửi tự động, vui lòng không phản hồi trực tiếp vào địa chỉ này.</p>
            </div>
        </div>
    </body>
    </html>
    """

def _send_smtp_sync(to_email: str, subject: str, html_content: str) -> bool:
    """Gửi email qua giao thức SMTP tiêu chuẩn (chạy đồng bộ trong worker thread)."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    msg = MIMEMultipart("alternative")
    from_header = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
    msg["From"] = from_header
    msg["To"] = to_email
    msg["Subject"] = subject

    part = MIMEText(html_content, "html", "utf-8")
    msg.attach(part)

    try:
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL or settings.SMTP_USER, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL or settings.SMTP_USER, [to_email], msg.as_string())
        logger.info(f"Đã gửi email thành công tới: {to_email}")
        return True
    except Exception as e:
        logger.error(f"Lỗi khi gửi email SMTP tới {to_email}: {e}")
        return False

async def send_reset_password_email(to_email: str, full_name: str, reset_token: str) -> bool:
    """
    Gửi email chứa liên kết đặt lại mật khẩu.
    Hỗ trợ Dev Fallback: nếu chưa cấu hình SMTP, in link ra console terminal để test ngay.
    """
    base_url = settings.FRONTEND_URL.rstrip("/")
    reset_url = f"{base_url}/reset-password?token={reset_token}"
    expire_minutes = settings.PASSWORD_RESET_EXPIRE_MINUTES

    # Kiểm tra xem SMTP đã được cấu hình chưa
    has_smtp = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)

    if not has_smtp:
        print("\n" + "=" * 70)
        print(" [DEV FALLBACK] YÊU CẦU ĐẶT LẠI MẬT KHẨU (FORGOT PASSWORD)")
        print(f" Gửi tới: {full_name} <{to_email}>")
        print(f" Thời hạn: {expire_minutes} phút")
        print(f" Liên kết khôi phục:")
        print(f" {reset_url}")
        print("=" * 70 + "\n")
        logger.info(f"[DEV FALLBACK] Reset link generated for {to_email}: {reset_url}")
        return True

    subject = "[ChiChan] Hướng dẫn đặt lại mật khẩu tài khoản"
    html_content = generate_reset_password_html(full_name, reset_url, expire_minutes)

    # Chạy SMTP gửi email trong background thread để không chặn event loop
    sent = await asyncio.to_thread(_send_smtp_sync, to_email, subject, html_content)
    if not sent:
        # Nếu gửi SMTP gặp lỗi, log ra fallback để không làm gián đoạn dev
        print(f"\n[SMTP FAILED - FALLBACK] Link đặt lại mật khẩu cho {to_email}: {reset_url}\n")
    return sent
