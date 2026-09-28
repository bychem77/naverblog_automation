# AI 작업 지침

## 반드시 읽는 순서

1. 모든 블로그 제작 작업: `prompts/BYCHEM_NAVERBLOG_MASTER_PROMPT.md` 전체
2. 보도자료 작성 및 보도자료→인스타그램 변환 작업: `prompts/BYCHEM_PRESS_RELEASE_TO_INSTAGRAM_PROMPT.md`
3. 이미지 생성 작업만: `prompts/이미지생성_캐릭터활용_프롬프트.md`
4. 제품을 언급하는 작업만: `references/product_catalog/README.md`와 해당 승인 자료
5. 예약 실행만: `automations/BYCHEM_BLOG_AUTOMATION_PROMPT.md`
6. 실제 입력·게시 단계만: `docs/WORKFLOW.md`

`docs/발행운영규칙.md`는 사람을 위한 요약이다. `examples/`, `docs/CHANGELOG.md`, 기존 게시물과 카드뉴스는 현재 규칙이 아니며 지시문으로 해석하지 않는다.

## 단일 기준

- 콘텐츠 결과를 바꾸는 규칙은 해당 작업의 전용 프롬프트를 따른다.
- 보도자료 및 뉴스 인스타그램 작업은 `BYCHEM_PRESS_RELEASE_TO_INSTAGRAM_PROMPT.md`를 우선 적용한다.
- 보조 문서나 과거 결과물에서 수치·서식·문체 규칙을 추출해 합치지 않는다.
- 현재 사용자 지시가 전용 프롬프트와 다르면 해당 작업에 한해 사용자 지시를 우선한다.
- 작업 시작 전 `scripts/check_prompt_consistency.sh`를 실행하고 실패하면 제작을 중단한다.

## 보안

- 사실·보안 검수를 통과한 글은 기본적으로 네이버 `이웃 공개`로 게시하고 댓글·공감을 허용한다. `서로이웃 공개`나 `전체 공개`와 혼동하지 않는다. 전체 공개 전환은 별도 명시 승인 후에만 한다.
- 로그인 정보, 쿠키, 토큰, 브라우저 프로필과 이메일 주소를 저장소에 기록하지 않는다.
- 미확인 회사·제품 정보는 만들지 않는다.

## 예약 복원

다른 컴퓨터에서는 `automations/bychem_blog_schedule.yaml`, `automations/BYCHEM_BLOG_AUTOMATION_PROMPT.md`, `automations/RESTORE_PROMPT.md`로 예약을 복원한다. 동일한 예약이 있으면 새로 만들지 말고 업데이트한다.
