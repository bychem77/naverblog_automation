# BYCHEM 뉴스 인스타그램 게시물

`BYCHEM 뉴스` 보도자료·블로그 글을 바탕으로 1080×1350 PNG 한 장과 인스타그램 게시용 캡션·해시태그 텍스트를 함께 생성합니다. 행사 사진을 어두운 전체 배경과 중앙의 흰 사진 프레임에 사용하고, 상단에 제목과 부제를 배치합니다. 이미지 오른쪽 아래에는 저장소의 BYCHEM 로고를 사용합니다.

## 새 게시물 입력

1. 실제 행사·회사 활동을 확인할 수 있는 사용 승인 사진을 `news/assets/approved/`에 저장합니다. AI가 만든 가상 행사 사진을 실제 회사 뉴스처럼 사용하지 않습니다.
2. `news/data/YYYY-MM-DD_slug.json`을 만듭니다. `category`는 정확히 `BYCHEM 뉴스`여야 합니다.
3. `title`, `subtitle`, `caption`, `hashtags`는 승인된 보도자료·블로그 글과 원자료에서 확인된 내용만 사용합니다.
4. `image`는 저장소 루트 기준의 승인 사진 경로입니다.
5. GitHub `main`에 입력 파일과 사진을 반영하면 Actions가 PNG와 `*_caption.txt`를 생성합니다. 결과는 `BYCHEM News Instagram` 실행의 아티팩트에서 받습니다.

## 공식 JSON 입력 규격

```json
{
  "category": "BYCHEM 뉴스",
  "title": "행사·성과를 한눈에 전하는 짧은 제목",
  "subtitle": "확인된 핵심 내용 한 줄",
  "image": "news/assets/approved/YYYY-MM-DD_slug.jpg",
  "caption": "인스타그램 게시용 캡션",
  "hashtags": [
    "#바이켐",
    "#BYCHEM",
    "#기업협력프로젝트"
  ]
}
```

### 필드 규칙

- `category`: 항상 `BYCHEM 뉴스`
- `title`: 모바일 화면에서 읽기 쉽게 짧게 작성
- `subtitle`: 제목을 반복하지 않고 핵심 성과·행사 내용을 한 줄로 보충
- `image`: 실제 사용 승인을 받은 행사·회사 사진만 사용
- `caption`: 보도자료를 그대로 복사하지 않고 3~5개의 짧은 문단으로 압축. 자료에 없는 성과·평가·인용문을 추가하지 않음
- `hashtags`: 8~12개 권장. `#바이켐`, `#BYCHEM`을 기본 포함하고 실제 게시물과 직접 관련된 태그만 사용

`news/data/sample.json`은 형식 확인용입니다. 실제 행사 소식이 아니며 게시에 사용하지 않습니다.

## 보도자료 GPT → 인스타그램 흐름

보도자료 GPT는 원자료를 바탕으로 보도자료 초안을 먼저 작성한 뒤, 사용자가 승인·수정한 동일 내용을 기반으로 다음 항목을 생성합니다.

`보도자료 → 인스타 제목 → 인스타 부제 → 캡션 → 해시태그 → news/data JSON`

세부 작성 규칙은 `prompts/BYCHEM_PRESS_RELEASE_TO_INSTAGRAM_PROMPT.md`를 따릅니다.

## 로컬 미리보기

기존 카드뉴스의 Playwright·Pretendard 설치를 재사용합니다.

```bash
cd cardnews
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm news ../news/data/sample.json ../news/output/sample.png
node scripts/export_news_caption.js ../news/data/sample.json ../news/output/sample_caption.txt
```

사진이 없거나 분류가 `BYCHEM 뉴스`가 아니면 이미지 렌더링이 실패합니다. 제목·부제가 영역에 들어가지 않으면 글자 크기를 줄이고, 그래도 넘치면 오류를 내므로 문구를 짧게 고쳐야 합니다. 캡션 또는 해시태그가 누락되면 캡션 텍스트 생성도 실패합니다.
