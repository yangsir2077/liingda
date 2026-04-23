# 邮件发送工具 - QQ邮箱SMTP
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 邮件配置（从环境变量读取，生产环境建议用配置文件）
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.qq.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))  # 587=TLS, 465=SSL
EMAIL_USER = os.environ.get('EMAIL_USER', '644681244@qq.com')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', 'ebkonmacooeubfjd')  # QQ授权码
EMAIL_FROM = os.environ.get('EMAIL_FROM', '644681244@qq.com')


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """发送HTML邮件"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = Header(subject, 'utf-8')
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email

        # HTML邮件内容
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)

        # 连接SMTP服务器并发送
        if EMAIL_PORT == 465:
            # SSL方式
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(EMAIL_HOST, EMAIL_PORT, context=context) as server:
                server.login(EMAIL_USER, EMAIL_PASSWORD)
                server.sendmail(EMAIL_USER, [to_email], msg.as_string())
        else:
            # TLS方式
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(EMAIL_USER, EMAIL_PASSWORD)
                server.sendmail(EMAIL_USER, [to_email], msg.as_string())

        print(f"[邮件发送成功] 收件: {to_email}  主题: {subject}")
        return True
    except Exception as e:
        print(f"[邮件发送失败] 收件: {to_email}  错误: {e}")
        return False


def send_verification_email(to_email: str, code: str) -> bool:
    """发送邮箱验证邮件"""
    subject = '【零搭】您的邮箱验证码'
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; color: #4F46E5; margin: 0 0 8px;">零搭 NoCode 平台</h1>
        <p style="color: #64748B; font-size: 14px; margin: 0;">验证您的邮箱地址</p>
      </div>
      <div style="background: #F8FAFC; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #E2E8F0;">
        <p style="color: #64748B; font-size: 14px; margin: 0 0 16px;">您的验证码是：</p>
        <div style="font-size: 36px; font-weight: 800; color: #4F46E5; letter-spacing: 8px; margin: 0 0 16px;">{code}</div>
        <p style="color: #94A3B8; font-size: 12px; margin: 0;">验证码 15 分钟内有效，请勿告知他人。</p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
        如果您没有进行任何操作，请忽略此邮件。
      </div>
    </div>
    """
    return send_email(to_email, subject, html)


def send_password_reset_email(to_email: str, code: str) -> bool:
    """发送密码重置邮件"""
    subject = '【零搭】您的密码重置验证码'
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; color: #4F46E5; margin: 0 0 8px;">零搭 NoCode 平台</h1>
        <p style="color: #64748B; font-size: 14px; margin: 0;">您正在重置密码</p>
      </div>
      <div style="background: #F8FAFC; border-radius: 16px; padding: 32px; text-align: center; border: 1px solid #E2E8F0;">
        <p style="color: #64748B; font-size: 14px; margin: 0 0 16px;">您的验证码是：</p>
        <div style="font-size: 36px; font-weight: 800; color: #EF4444; letter-spacing: 8px; margin: 0 0 16px;">{code}</div>
        <p style="color: #94A3B8; font-size: 12px; margin: 0;">验证码 15 分钟内有效，请勿告知他人。</p>
      </div>
      <div style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 12px;">
        如果您没有发起密码重置，请忽略此邮件。
      </div>
    </div>
    """
    return send_email(to_email, subject, html)
