# 보조 스크립트

`inspect_calendar.mjs`는 Codex 문서 런타임의 `@oai/artifact-tool`을 사용해 XLSX 콘텐츠 캘린더의 시트와 표 구조를 점검하는 보조 스크립트입니다.

해당 런타임이 연결된 환경에서 다음처럼 실행합니다.

```bash
node scripts/inspect_calendar.mjs /absolute/path/to/calendar.xlsx
```

일반 Node.js 환경에는 이 의존성이 없을 수 있으므로, 스크립트 실행이 불가능해도 마스터 프롬프트와 운영 절차에는 영향이 없습니다.
