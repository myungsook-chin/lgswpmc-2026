// EmailJS 설정
// 1) https://www.emailjs.com 에 가입 후 Email Service(예: Outlook/Gmail)를 연결하세요.
// 2) Email Template을 만들고, 템플릿의 "To Email" 필드를 DL-lgswpmc-2026@lge.com 으로 고정하세요.
//    (수신 주소는 보안상 JS에서 넘기지 않고 템플릿 설정에 고정하는 것을 권장합니다.)
// 3) 아래 값을 EmailJS 대시보드에서 발급받은 값으로 교체하세요.
const EMAILJS_CONFIG = {
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  templateId: "YOUR_EMAILJS_TEMPLATE_ID",
  toEmail: "DL-lgswpmc-2026@lge.com",
};
