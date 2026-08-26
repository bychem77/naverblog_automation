# BYCHEM 카드뉴스 자동화

Markdown 원고를 카드뉴스 JSON으로 정리하고, BYCHEM 전용 HTML/CSS 템플릿을 이용해 1080×1350 PNG로 렌더링합니다.

## 카드 구성

1. 표지: 원고 주제에 맞춘 AI 생성 배경, 제목, 해시태그
2. 본문 3~6장: 원고의 핵심 단락을 완결된 1~2문장으로 그대로 사용
3. 아웃트로: 표지와 완전히 동일한 배경, BYCHEM CI, 20px AI 이미지 고지

디자인은 `bychem_cardnews_prototype_updated.zip`의 승인 프로토타입을 기준으로 합니다. 모든 카드 JSON에는 `image_prompt`가 포함됩니다. OpenAI 이미지 API가 표지 이미지를 한 번 생성하면 아웃트로도 같은 파일을 자동 재사용합니다. 본문 이미지는 각 슬라이드마다 별도로 생성합니다. API 키가 없거나 개별 이미지 생성이 실패하면 해당 페이지는 프로토타입의 샘플 배경을 사용하므로 전체 렌더링은 중단되지 않습니다.

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

`OPENAI_API_KEY` 환경 변수가 있으면 이미지까지 생성하고, 없으면 임시 배경으로 렌더링합니다. 키를 `.env`나 저장소 파일에 기록하지 마세요.

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

### 회사 OpenAI API 연결

개인 ChatGPT 계정의 키를 사용하지 않습니다. 회사가 관리하는 OpenAI API 프로젝트에서 자동화 전용 Service Account를 만든 뒤 다음 한 가지 값만 등록합니다.

1. GitHub 저장소의 `Settings` → `Secrets and variables` → `Actions`로 이동
2. `New repository secret` 선택
3. 이름을 `OPENAI_API_KEY`로 입력하고 회사 Service Account 키 저장

키는 GitHub가 암호화해 보관하며 코드와 결과 아티팩트에는 포함되지 않습니다. 등록 후 새 원고를 `cardnews/data/`에 추가하면 `gpt-image-2`가 1024×1536 중간 품질 이미지를 생성합니다. 표지 1장과 본문 3~6장만 생성하므로 아웃트로 이미지 비용은 별도로 발생하지 않습니다. `sample.md`는 자동 실행에서 제외해 불필요한 이미지 생성을 막습니다.

모델이나 품질을 바꾸려면 같은 화면의 `Variables`에 `OPENAI_IMAGE_MODEL` 또는 `OPENAI_IMAGE_QUALITY`를 추가할 수 있습니다. 기본값은 각각 `gpt-image-2`, `medium`입니다.

API 키, 토큰, 생성 이미지 원본은 저장소에 커밋하지 않습니다. 키가 노출됐다고 의심되면 OpenAI 프로젝트에서 폐기하고 GitHub Secret을 새 키로 교체합니다.
