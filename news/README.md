# BYCHEM 뉴스 인스타그램

보도자료·행사 결과자료를 바탕으로 **1080×1350 PNG 1장 + 인스타그램 캡션/해시태그 텍스트**를 생성합니다.

## 고정 디자인

- 폰트: Pretendard Variable
- 상단 왼쪽: `BYCHEM   |   News`
  - 카드뉴스 `BYCHEM | Insight`와 동일한 위치·크기
- 상단 오른쪽: 파일명에서 자동 생성한 `YYYY MON` (예: `2026 SEPT`)
- 제목: 왼쪽 정렬, 제목/부제 블록 `top: 156px`
- 부제: 가운데 정렬, 화면에는 자동으로 `"부제"` 형태로 표시
- 우하단 BYCHEM 로고: 카드뉴스 기본 로고와 동일한 위치·크기
- 배경: 승인 사진을 흐림 처리한 전체 배경
- 중앙 사진: 흰 프레임 안에 실제 승인 사진 사용
  - 가로 사진 → 가로형 고정 프레임
  - 세로 사진 → 세로형 고정 프레임
  - `object-fit: cover`로 프레임에 맞춤
- 렌더 전 Sharp로 사진을 정상 JPEG로 재인코딩해 디코딩 오류를 방지

## 입력 파일

사진: `news/assets/approved/`

JSON: `news/data/YYYY-MM-DD_slug.json`

```json
{
  "category": "BYCHEM 뉴스",
  "title": "짧고 명확한 이미지 제목",
  "subtitle": "제목을 보완하는 한 줄 부제",
  "image": "news/assets/approved/approved_photo.jpg",
  "caption": "인스타그램 캡션",
  "hashtags": ["#바이켐", "#BYCHEM"]
}
```

## 작성 규칙

- `category`: 항상 `BYCHEM 뉴스`
- `title`: 모바일에서 바로 읽히도록 짧고 명확하게
- `subtitle`: 제목 반복 금지, 핵심 성과·행사 의미를 한 줄로 보완
- `image`: 실제 사용 승인된 회사·행사 사진만 사용
- `caption`: 2~4개의 짧은 문단, 약 150~300자, 이모지 1~3개
- `hashtags`: 6~10개, `#바이켐` `#BYCHEM` 기본 포함
- 원자료에 없는 수치·성과·인용문·평가를 추가하지 않음

## 자동화

`main` 브랜치에 뉴스 JSON, 승인 사진, 뉴스 템플릿 또는 렌더 스크립트가 변경되면 GitHub Actions의 **BYCHEM News Instagram**이 자동 실행됩니다.

출력:
- `news/output/<name>.png`
- `news/output/<name>_caption.txt`

Actions 아티팩트에서 결과물을 확인합니다.

## 관련 파일

- 디자인: `cardnews/templates/news_post.html`, `cardnews/templates/news_post.css`
- 렌더: `cardnews/scripts/render_news_post.js`
- 캡션 내보내기: `cardnews/scripts/export_news_caption.js`
- 작성 기준: `prompts/BYCHEM_PRESS_RELEASE_TO_INSTAGRAM_PROMPT.md`
