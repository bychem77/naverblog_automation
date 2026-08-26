# BYCHEM 카드뉴스 자동화

Markdown 원고를 카드뉴스 JSON으로 정리하고, BYCHEM 전용 HTML/CSS 템플릿을 이용해 1080×1350 PNG로 렌더링합니다.

## 카드 구성

1. 표지: 원고 주제에 맞춘 AI 생성 배경, 제목, 해시태그
2. 본문 3~6장: 원고의 핵심 단락을 완결된 1~2문장으로 그대로 사용
3. 아웃트로: 표지와 완전히 동일한 배경, BYCHEM CI, 20px AI 이미지 고지

모든 카드 JSON에는 `image_prompt`가 포함됩니다. 표지 이미지는 아웃트로에서도 동일한 파일을 재사용하며, 본문은 각 슬라이드마다 별도 이미지를 사용합니다.

이미지는 다음 순서로 선택합니다.

1. `cardnews/assets/manual/원고파일명/`에 올린 수동 이미지
2. `PEXELS_API_KEY`가 설정된 경우 Pexels 무료 스톡 사진(제목의 영문 키워드로 검색)
3. `OPENAI_API_KEY`가 설정된 경우 OpenAI API 생성 이미지
4. 기존 임시 배경

본문은 글자 수를 맞추기 위해 자르거나 말줄임표를 붙이지 않으며, 페이지 수를 채우기 위한 임시 문구도 만들지 않습니다. 원고에는 최소 3개의 본문 소제목(`##`)이 필요하고, 6개를 넘으면 앞의 핵심 흐름과 마지막 결론을 사용합니다.

고정 글자 크기는 상단 브랜드 36.4px, 표지 제목 95.2px, 해시태그 36.4px, 본문 제목 70px, 본문 37.8px, 아웃트로 고지 28px입니다. 표지 하단의 BYCHEM Blue는 별도 사각 도형 없이 하나의 연속 그라디에이션으로 처리합니다.

## 로컬 사용법

Node.js 20 이상과 pnpm이 필요합니다.

```bash
cd cardnews
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm build data/sample.md output/sample
```

수동 이미지가 있으면 가장 먼저 사용합니다. API 키가 없거나 이미지 생성이 실패해도 나머지 페이지는 임시 배경으로 정상 렌더링됩니다.

결과는 `output/sample/`에 `cardnews.json`, 표지, 본문 3~6장, 아웃트로 PNG로 생성됩니다. 아웃트로 파일 번호는 본문 장수에 따라 자동으로 정해집니다.

템플릿만 빠르게 미리 보려면 `cardnews/`를 로컬 웹 서버로 연 뒤 아래 주소를 사용합니다.

```text
templates/card.html?type=cover&data=../output/sample/cardnews.json
```

JSON 변환과 렌더링을 따로 실행할 수도 있습니다.

```bash
pnpm convert data/sample.md output/sample/cardnews.json
pnpm render output/sample/cardnews.json output/sample
```

## GitHub Actions

Actions 탭의 `BYCHEM Card News`에서 원고 경로를 입력해 수동 실행할 수 있습니다. `cardnews/data/*.md`가 변경되어 `main`에 반영되면 해당 폴더의 모든 원고도 자동 렌더링됩니다. 결과 PNG와 JSON은 실행 화면의 `bychem-cardnews-*` 아티팩트에서 내려받습니다.

## 수동 이미지 사용법

원고가 `cardnews/data/2026-08-26_IPA.md`라면 이미지를 다음 위치에 올립니다.

```text
cardnews/assets/manual/2026-08-26_IPA/cover.png
cardnews/assets/manual/2026-08-26_IPA/content_01.png
cardnews/assets/manual/2026-08-26_IPA/content_02.png
...
```

`cover`는 표지와 아웃트로에 함께 사용합니다. 본문은 `content_01`부터 원고의 소제목 순서대로 연결됩니다. PNG, JPG, JPEG, WEBP를 지원하며 권장 크기는 1080×1350px입니다. 일부 이미지만 있어도 나머지는 다음 우선순위의 배경으로 자동 보완됩니다.

API 키와 토큰은 저장소에 커밋하지 않습니다.
