# BYCHEM 카드뉴스 자동화

Markdown 원고를 6장 카드뉴스 JSON으로 정리하고, BYCHEM 전용 HTML/CSS 템플릿을 이용해 1080×1350 PNG로 렌더링합니다.

## 카드 구성

1. 표지: 원고 주제에 맞춘 AI 생성 배경, 제목, 해시태그
2. 본문 4장: 전체 사진 배경, 하단 소제목과 요약 본문
3. 아웃트로: 표지와 완전히 동일한 배경, BYCHEM CI, 20px AI 이미지 고지

디자인은 `bychem_cardnews_prototype_updated.zip`의 승인 프로토타입을 기준으로 합니다. 모든 카드 JSON에는 `image_prompt`가 포함됩니다. AI 이미지 API를 연결할 때 1장의 생성 이미지 경로를 `cover.background`에 넣으면 6장도 렌더러가 같은 파일을 자동 재사용합니다. 6장용 이미지를 별도로 생성하지 않습니다. 2~5장은 각 슬라이드의 `background`에 생성 이미지 경로를 넣습니다. API 연결 전에는 프로토타입의 샘플 배경을 사용합니다.

고정 글자 크기는 상단 브랜드 36.4px, 표지 제목 95.2px, 해시태그 36.4px, 본문 제목 70px, 본문 37.8px, 아웃트로 고지 28px입니다. 표지 하단의 BYCHEM Blue는 별도 사각 도형 없이 하나의 연속 그라디에이션으로 처리합니다.

## 로컬 사용법

Node.js 20 이상과 pnpm이 필요합니다.

```bash
cd cardnews
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm build data/sample.md output/sample
```

결과는 `output/sample/`에 `cardnews.json`과 `01_cover.png`부터 `06_outro.png`까지 생성됩니다.

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

API 키, 토큰, 생성 이미지 원본은 저장소에 커밋하지 않습니다. AI 이미지 API 연결은 별도 워크플로 또는 별도 스크립트로 추가하는 것을 권장합니다.
