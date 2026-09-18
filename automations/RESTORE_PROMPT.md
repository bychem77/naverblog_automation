# 새 컴퓨터 예약 작업 복원 요청문

아래 문장을 새 컴퓨터의 Codex 데스크톱 앱에서 이 저장소를 연 뒤 그대로 입력합니다.

> 이 저장소의 `automations/bychem_blog_schedule.yaml`과 `automations/BYCHEM_BLOG_AUTOMATION_PROMPT.md`를 읽고, 현재 로컬 프로젝트와 현재 작업을 대상으로 바이켐 블로그·카드뉴스 예약 작업을 등록하거나 같은 이름의 기존 작업을 최신 내용으로 업데이트해줘. 매주 화요일과 목요일 오전 9시, 시간대는 Asia/Seoul, 상태는 활성으로 설정해. 실제 실행 프롬프트는 저장소의 예약 실행 프롬프트 전체 내용을 사용해. `automations/local.settings.yaml`이 없거나 네이버·이메일 연결이 안 되어 있으면 예약 등록은 완료한 뒤 최초 실행 전에 필요한 연결 항목만 알려줘.

## 최초 1회 준비

1. `automations/local.settings.example.yaml`을 `automations/local.settings.yaml`로 복사해 검토자 이메일을 입력한다.
2. Codex 인앱 브라우저에서 네이버에 로그인한다.
3. 사용할 이메일 앱을 연결한다.
4. 위 복원 요청문을 실행해 예약 작업을 등록한다.

GitHub에서 `git pull`을 하면 일정과 실행 규칙의 최신본은 내려받을 수 있습니다. 다만 실제 예약의 활성 상태와 로그인 세션은 컴퓨터별 보안 정보라서 새 컴퓨터에서 최초 1회 등록과 로그인이 필요합니다.
