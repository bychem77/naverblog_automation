# 수동 이미지 폴더

회사 ChatGPT 등에서 만든 이미지를 원고 파일명과 같은 폴더에 넣으면 카드뉴스에 자동 적용됩니다.

예를 들어 원고가 `cardnews/data/2026-08-26_IPA.md`라면 다음 구조를 사용합니다.

```text
cardnews/assets/manual/2026-08-26_IPA/
├── cover.png
├── content_01.png
├── content_02.png
├── content_03.png
├── content_04.png
├── content_05.png
└── content_06.png
```

- `cover`는 표지와 아웃트로가 함께 사용합니다.
- `content_01`부터 본문 순서대로 연결됩니다.
- PNG, JPG, JPEG, WEBP 파일을 사용할 수 있습니다.
- 권장 비율은 4:5이며, 권장 크기는 1080×1350px입니다.
- 이미지 안에는 글자, 로고와 워터마크를 넣지 않습니다.
- 일부 파일만 올려도 됩니다. 없는 페이지는 API 이미지 또는 임시 배경을 사용합니다.
