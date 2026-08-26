# 검수 완료 이미지

담당자가 검수하고 확정한 이미지를 원고 파일명과 같은 폴더에 넣으면 API 이미지보다 먼저 사용합니다.

원고가 `cardnews/data/2026-08-26_IPA.md`라면 다음과 같이 저장합니다.

```text
cardnews/assets/approved/2026-08-26_IPA/
├── cover.png
├── content_01.png
├── content_02.png
└── sources.json
```

- `cover`는 표지와 아웃트로가 함께 사용합니다.
- 본문은 `content_01`부터 원고의 소제목 순서대로 연결됩니다.
- PNG, JPG, JPEG, WEBP를 지원하며 권장 크기는 1080×1350px입니다.
- 일부 이미지만 넣어도 됩니다. 없는 이미지만 Pexels, OpenAI, 임시 배경 순서로 채웁니다.
- 확정 이미지는 재보정하지 않고 그대로 사용합니다.

Actions 아티팩트에서 검수할 때는 원고별 `images/` 폴더의 글자 없는 배경을 사용합니다. 글자가 이미 합성된 `01_cover.png`, `02_content.png` 같은 최종 카드 파일은 이 폴더에 넣지 않습니다.

Pexels나 OpenAI 이미지라면 선택적으로 `sources.json`에 출처를 기록합니다.

```json
{
  "cover": {
    "source": "pexels",
    "photographer": "사진가 이름",
    "photographer_url": "https://www.pexels.com/@photographer/",
    "photo_url": "https://www.pexels.com/photo/123456/"
  },
  "content_01": {
    "source": "openai"
  }
}
```

`source`는 `pexels` 또는 `openai`를 사용합니다. Pexels 출처를 적으면 아웃트로 고지와 결과 JSON의 출처 정보에 자동 반영됩니다.
