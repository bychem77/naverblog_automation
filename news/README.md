# BYCHEM 뉴스 인스타그램 게시물

`BYCHEM 뉴스` 블로그 글마다 1080×1350 PNG 한 장을 생성합니다. 첨부된 Canva 예시처럼 행사 사진을 어두운 전체 배경과 중앙의 흰 사진 프레임에 함께 사용하고, 상단에 제목과 부제를 배치합니다. 이미지 오른쪽 아래에는 저장소의 BYCHEM 로고를 사용합니다.

## 새 게시물 입력

1. 실제 행사·회사 활동을 확인할 수 있는 사용 승인 사진을 `news/assets/approved/`에 저장합니다. AI가 만든 가상 행사 사진을 실제 회사 뉴스처럼 사용하지 않습니다.
2. `news/data/YYYY-MM-DD_slug.json`을 만듭니다. `category`는 정확히 `BYCHEM 뉴스`여야 합니다.
3. `title`과 `subtitle`은 승인된 블로그 글에서 확인된 내용만 짧게 옮깁니다. `image`는 저장소 루트 기준 사진 경로입니다.
4. GitHub `main`에 입력 파일과 사진을 반영하면 Actions가 PNG를 생성합니다. 결과는 `BYCHEM News Instagram` 실행의 아티팩트에서 받습니다.

```json
{
  "category": "BYCHEM 뉴스",
  "title": "행사·수상 소식을 한눈에 전하는 제목",
  "subtitle": "확인된 핵심 내용 한 줄",
  "image": "news/assets/approved/YYYY-MM-DD_slug.jpg"
}
```

`news/data/sample.json`은 레이아웃 확인용입니다. 실제 행사 소식이 아니며 게시에 사용하지 않습니다. Actions의 수동 실행은 `news/data/` 아래 JSON 경로를 받으며, 실제 입력 파일만 지정할 수 있습니다.

## 로컬 미리보기

기존 카드뉴스의 Playwright·Pretendard 설치를 재사용합니다.

```bash
cd cardnews
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm news ../news/data/sample.json ../news/output/sample.png
```

사진이 없거나 분류가 `BYCHEM 뉴스`가 아니면 렌더링이 실패합니다. 제목·부제가 영역에 들어가지 않으면 글자 크기를 줄이고, 그래도 넘치면 오류를 내므로 문구를 짧게 고쳐야 합니다.

