# LG SW PM Competition 2026 홈페이지

PMPB(Project & Process Management Protection Bureau) 세계관을 담은 LG SW PM Competition 2026 공식 홈페이지입니다.
순수 HTML/CSS/JS로 제작된 정적 사이트이며, GitHub Pages로 배포합니다.

## 폴더 구조

```
index.html      # 메인 (히어로 이미지 + 세계관 소개)
schedule.html   # 대회 일정
prelim.html     # 예선 안내
final.html      # 본선 안내
qna.html        # 질의응답 게시판 (EmailJS로 메일 발송)
assets/
  css/style.css
  js/main.js    # 공통 스크립트(모바일 메뉴 등)
  js/config.js  # EmailJS 설정값
  js/qna.js     # Q&A 폼 제출 + 메일 발송 로직
  js/editor.js  # 웹페이지 In-place 편집 모드
  img/hero.png  # 대표 이미지 (직접 추가 필요)
.github/workflows/deploy.yml  # GitHub Pages 자동 배포
```

## 1. 대표 이미지 추가

첨부받은 캐릭터 이미지를 `assets/img/hero.png` 경로로 저장하세요. 이미지가 없으면 안내 문구가 대신 표시됩니다.

## 2. 웹페이지에서 직접 텍스트 수정하기 (In-place 편집 모드)

모든 페이지 우측 하단에 **✏️ 편집 모드** 버튼이 있습니다.

1. 버튼 클릭 → 암호(`pmpb2026`, `assets/js/editor.js`의 `EDIT_PASSCODE`에서 변경 가능) 입력
2. 본문 텍스트를 클릭해서 바로 수정 (제목, 문단, 카드 설명, 표, 타임라인 등)
3. **💾 임시저장**: 현재 브라우저에만 저장(localStorage), 새로고침해도 유지되지만 다른 방문자에게는 보이지 않음
4. **⬇️ HTML 다운로드**: 수정된 페이지 전체를 HTML 파일로 다운로드 → 실제 프로젝트 파일을 이 파일로 교체 후 git commit/push 하면 모든 방문자에게 반영됨
5. **↩️ 초기화**: 임시저장된 편집 내용을 삭제하고 원본으로 복원

> GitHub Pages는 서버가 없는 정적 호스팅이므로, 모든 방문자에게 실시간으로 공유되는 저장은 지원되지 않습니다.
> "HTML 다운로드 → 파일 교체 → git push" 과정을 거쳐야 실제 배포에 반영됩니다.
> 암호는 클라이언트 코드에 평문으로 저장되어 있어 진짜 보안 인증이 아니라 단순 오남용 방지 장치입니다. 민감한 내용을 다루지 마세요.
> `qna.html`은 질문 폼/목록이 동적으로 채워지므로, 편집 가능 영역은 상단 안내 문구로 한정되어 있습니다.

## 3. Q&A 메일 발송 설정 (EmailJS)

이 사이트는 서버 없이 GitHub Pages에서 바로 동작하도록 [EmailJS](https://www.emailjs.com)를 사용합니다.

1. EmailJS 가입 후 Email Service를 연결합니다 (Outlook/Gmail 등).
2. Email Template을 생성하고, 템플릿의 **To Email**을 `DL-lgswpmc-2026@lge.com`으로 고정합니다.
   - 템플릿 변수: `from_name`, `from_email`, `title`, `message`, `submitted_at`
3. `assets/js/config.js`의 값을 발급받은 Public Key / Service ID / Template ID로 교체합니다.

```js
const EMAILJS_CONFIG = {
  publicKey: "실제 Public Key",
  serviceId: "실제 Service ID",
  templateId: "실제 Template ID",
  toEmail: "DL-lgswpmc-2026@lge.com",
};
```

> 참고: 질문 목록은 각 방문자의 브라우저 `localStorage`에 저장되어 본인이 등록한 질문만 확인할 수 있습니다.
> 모든 방문자가 공유하는 게시판이 필요하다면 Firebase/Supabase 같은 DB 연동이 추가로 필요합니다.

## 4. 로컬에서 확인하기

정적 파일이므로 `index.html`을 브라우저로 바로 열어도 되고, 아래처럼 간단한 로컬 서버로 확인할 수도 있습니다.

```powershell
python -m http.server 8080
```

## 5. GitHub 계정에 배포하기

1. GitHub에서 새 저장소를 생성합니다 (예: `lgswpmc-2026`).
2. 이 폴더를 저장소에 푸시합니다.

```powershell
cd C:\Users\myoungsook.chin\lgswpmc-2026
git init
git add .
git commit -m "Initial commit: LG SW PM Competition 2026 site"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_ID>/lgswpmc-2026.git
git push -u origin main
```

3. GitHub 저장소 **Settings → Pages**에서 Source를 **GitHub Actions**로 설정합니다.
4. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드/배포합니다.
5. 배포 완료 후 `https://<YOUR_GITHUB_ID>.github.io/lgswpmc-2026/` 주소로 접속할 수 있습니다.
