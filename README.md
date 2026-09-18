# BYCHEM 네이버 블로그 AI 자동화

바이켐 네이버 기업 블로그의 주제 기획, 내용 확인, 원고 작성, 이미지 제작, 담당자 승인, 비공개 게시까지 같은 기준으로 반복하기 위한 인수인계 저장소입니다.

현재 운영 규칙의 단일 기준은 [`prompts/BYCHEM_NAVERBLOG_MASTER_PROMPT.md`](prompts/BYCHEM_NAVERBLOG_MASTER_PROMPT.md)입니다. 다른 프롬프트·매뉴얼·템플릿·예시와 내용이 다르면 마스터 프롬프트의 최신 버전을 따릅니다. 문서별 역할과 수정 순서는 [`docs/PROMPT_ARCHITECTURE.md`](docs/PROMPT_ARCHITECTURE.md)를 참고하세요.

## 빠른 시작

1. [`prompts/BYCHEM_NAVERBLOG_MASTER_PROMPT.md`](prompts/BYCHEM_NAVERBLOG_MASTER_PROMPT.md)의 전체 내용을 AI의 시스템 지침 또는 프로젝트 지침에 넣습니다.
2. 작업 요청은 [`templates/작업요청서.md`](templates/작업요청서.md)를 복사해 작성합니다.
3. 바이켐 제품 내용과 관련 글감은 [`references/product_catalog/`](references/product_catalog/)의 카탈로그를 우선 참고합니다.
4. 순환자원·분리정제·금속 회수 관련 주제는 [`docs/순환자원_분리정제_콘텐츠백로그.md`](docs/순환자원_분리정제_콘텐츠백로그.md)를 참고합니다.
5. 캐릭터 이미지 생성에는 `assets/characters/`의 원본을 참조 이미지로 제공합니다.
6. 결과물은 `examples/YYYY-MM-DD_주제_상태/`와 같은 구조로 저장합니다.
7. 담당자 승인 전에는 네이버 블로그에 **비공개**로만 저장합니다.

## 표준 진행 방식

`월간 캘린더 제안 → 원고·이미지 제작 → 사실·보안 검수 → 담당자 승인 → 비공개 게시 → 최종 공개 승인`

회사의 제품·사양·성과를 다루는 글은 승인된 회사 소개서와 제품자료가 제공된 뒤에만 작성합니다. 자료가 없을 때는 생활 속 화학, AI, 첨단소재, 산업 트렌드 등 일반 정보형 콘텐츠만 제작합니다.

## 주간 자동 실행

- 실행 일정: 매주 화요일·목요일 오전 9시(Asia/Seoul)
- 회차별 작업: 블로그 1건 기획·작성·이미지 제작 → 네이버 비공개 게시 → 같은 내용의 카드뉴스 PNG 제작
- 이미지 기본값: 대표사진 1컷 + 캐릭터 본문 이미지 1컷 + 기술 이미지·인포그래픽 1컷. 세 번째 이미지는 설명 가치가 있을 때만 사용합니다.
- 스티커: 사용자가 제외를 요청하지 않으면 승인된 네이버 스티커를 최소 1개 사용합니다. 기본은 도입부의 `안녕하세요`이며, 글의 구조에 따라 `궁금해요`, `연구중`, `꼼꼼하게`, `좋아요`, `감사합니다`로 바꿀 수 있습니다.
- 완료 전달: 실행 중인 Codex 작업에 게시물 링크와 카드뉴스 PNG 파일 링크를 남깁니다.
- 이메일 검수: 비공개 게시 성공 후 담당자에게 모바일용 HTML 검수 메일을 보내고, 게시물 링크와 카드뉴스 PNG를 함께 전달합니다.
- 로그인 만료 시: 원고·이미지·카드뉴스는 완성해 저장하고 네이버 게시만 보류한 뒤 필요한 조치를 알립니다.
- 로그인 재사용: 이 Mac의 Codex 인앱 브라우저에 보관된 로컬 세션을 우선 사용합니다. 세션·쿠키·인증 정보는 GitHub에 올리지 않습니다.

세부 실행 규칙과 인수인계 방법은 [`docs/주간자동화운영.md`](docs/주간자동화운영.md)를 참고하세요. Codex 앱에 등록된 실제 예약 작업은 Git 저장소와 별도로 관리되므로, 저장소를 다른 환경에서 사용하면 같은 예약을 다시 만들어야 합니다.

### 새 컴퓨터에서 예약 작업 복원

`git pull`을 하면 화·목 오전 9시 일정과 전체 실행 프롬프트도 함께 내려받습니다.

- 예약 정의: [`automations/bychem_blog_schedule.yaml`](automations/bychem_blog_schedule.yaml)
- 실제 실행 프롬프트: [`automations/BYCHEM_BLOG_AUTOMATION_PROMPT.md`](automations/BYCHEM_BLOG_AUTOMATION_PROMPT.md)
- 새 컴퓨터용 복원 요청문: [`automations/RESTORE_PROMPT.md`](automations/RESTORE_PROMPT.md)

새 컴퓨터에서는 네이버·이메일을 최초 1회 연결하고 복원 요청문을 Codex에 입력하면 됩니다. 실제 예약 활성 상태와 로그인 세션은 보안상 Git으로 옮길 수 없습니다.

## 저장소 구조

```text
assets/characters/   승인된 래미 캐릭터와 스타일 참고 이미지
docs/                운영 규칙과 편집·검수 절차
examples/            실제 원고·썸네일·본문 이미지 예시
prompts/             다른 AI에 그대로 전달할 마스터·이미지 프롬프트
references/          바이켐 제품 카탈로그 등 승인 참고자료
scripts/             캘린더 등 자료 점검용 보조 스크립트
templates/           월간 캘린더·작업 요청·원고 산출물 템플릿
cardnews/            Markdown 기반 BYCHEM 카드뉴스 JSON·PNG·AI 이미지 자동화
automations/          화·목 오전 9시 예약 정의·실행 프롬프트·복원 안내
```

## 카드뉴스 자동화

`cardnews/data/`에 Markdown 원고를 넣으면 표지, 본문 3~6장, 아웃트로로 구성된 JSON과 1080×1350 PNG를 만들 수 있습니다. 수동 이미지와 선택적인 API 이미지를 지원합니다. 로컬 실행과 GitHub Actions 사용법은 [`cardnews/README.md`](cardnews/README.md)를 참고하세요.

## 중요한 보안 원칙

- 네이버·GitHub 아이디, 비밀번호, 쿠키, 브라우저 프로필과 API 키는 저장소에 넣지 않습니다.
- 고객명, 거래, 가격, 공정, 개인정보는 공개 승인이 없으면 제거합니다.
- 미확인 회사 정보는 만들지 않고 `[사내 확인 필요]`로 표시합니다.
- 타사 홈페이지 이미지와 검색 이미지를 무단 사용하지 않습니다.

## 게시 자동화 전제

네이버 게시 단계는 로그인된 브라우저 세션이 있는 환경에서 수행합니다. 같은 Mac에서는 Codex 인앱 브라우저의 로컬 세션을 재사용할 수 있습니다. AI는 글과 이미지를 입력하고 카테고리·태그·공개 설정을 검수하지만, 로그인 정보는 사용자가 직접 관리합니다. 기본 게시 상태는 항상 **비공개**입니다.

세션을 별도 파일이나 브라우저 프로필로 보관하는 도구를 사용할 경우 `.gitignore`에 등록된 `auth/`, `cookies/`, `browser-profile/`, `session/`, `playwright/.auth/` 중 하나에만 저장합니다. 쿠키·세션 토큰·아이디·비밀번호·인증 코드는 GitHub에 커밋하지 않습니다.
