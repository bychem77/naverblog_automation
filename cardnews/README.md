# BYCHEM 카드뉴스 자동화

Markdown 원고를 카드뉴스 JSON으로 정리하고, BYCHEM 전용 HTML/CSS 템플릿을 이용해 1080×1350 PNG로 렌더링합니다.

## 카드 구성

1. 표지: 원고 주제에 맞춘 AI 생성 배경, 제목, 해시태그
2. 본문 3~6장: 원고의 핵심 단락을 완결된 1~2문장으로 그대로 사용
3. 아웃트로: 표지와 완전히 동일한 배경, BYCHEM CI, 20px AI 이미지 고지

모든 카드 JSON에는 `image_prompt`가 포함됩니다. 표지 이미지는 아웃트로에서도 동일한 파일을 재사용하며, 본문은 각 슬라이드마다 별도 이미지를 사용합니다.

이미지는 다음 순서로 선택합니다.

1. `cardnews/assets/approved/원고파일명/`에 저장한 검수 완료 이미지
2. `OPENAI_API_KEY`가 설정된 경우 사내 OpenAI API 생성 이미지
3. API 생성이 불가능하거나 실패하면 Pexels 무료 스톡 사진. 1080×1350으로 맞추고 명암, 색감, 선명도를 자동 보정합니다.
4. 기존 임시 배경

아웃트로의 이미지 고지문은 실제 결과에 맞춰 자동 변경됩니다. Pexels 사진을 사용하면 Pexels 제공 문구가 표시되고, OpenAI API로 생성하면 AI 생성 문구가 표시됩니다. 두 출처가 섞이면 두 가지를 함께 표시합니다. Pexels 사진가와 원본 링크는 결과 `cardnews.json`의 `metadata.pexels_credits`에 기록됩니다.

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

검수 완료 이미지는 재보정 없이 가장 먼저 사용합니다. API 키가 없거나 이미지 생성이 실패해도 나머지 페이지는 임시 배경으로 정상 렌더링됩니다.

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

## 검수 완료 이미지 사용법

원고가 `cardnews/data/2026-08-26_IPA.md`라면 검수한 이미지를 아래 경로에 저장합니다.

```text
cardnews/assets/approved/2026-08-26_IPA/cover.png
cardnews/assets/approved/2026-08-26_IPA/content_01.png
cardnews/assets/approved/2026-08-26_IPA/content_02.png
```

`cover`는 표지와 아웃트로에 함께 사용하며, 본문은 `content_01`부터 순서대로 연결됩니다. 일부 이미지만 확정해도 나머지는 사내 OpenAI API부터 자동으로 채우고, API 생성이 실패한 페이지만 Pexels로 보완합니다. Pexels 또는 OpenAI에서 만든 확정 이미지의 출처 표시는 같은 폴더의 `sources.json`에 기록합니다. 자세한 형식은 [`assets/approved/README.md`](assets/approved/README.md)를 참고합니다.

Actions 아티팩트를 검수할 때는 각 원고 폴더의 `images/`에 들어 있는 글자 없는 배경 이미지 중 확정본을 위 경로로 복사합니다. `01_cover.png`처럼 글자가 합성된 최종 카드 PNG가 아니라 `images/cover.png`, `images/content_01.png` 등을 사용합니다.

API 키와 토큰은 저장소에 커밋하지 않습니다.
