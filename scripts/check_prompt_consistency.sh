#!/bin/sh

set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
master="$repo_dir/prompts/BYCHEM_NAVERBLOG_MASTER_PROMPT.md"
image_prompt="$repo_dir/prompts/이미지생성_캐릭터활용_프롬프트.md"
automation="$repo_dir/automations/BYCHEM_BLOG_AUTOMATION_PROMPT.md"
architecture="$repo_dir/docs/PROMPT_ARCHITECTURE.md"
fail=0

require_text() {
  file=$1
  pattern=$2
  message=$3
  if ! grep -Fq -- "$pattern" "$file"; then
    echo "FAIL: $message"
    fail=1
  fi
}

reject_text() {
  file=$1
  pattern=$2
  message=$3
  if grep -Fq -- "$pattern" "$file"; then
    echo "FAIL: $message"
    fail=1
  fi
}

require_text "$master" '이 파일은 현재 운영 규칙의 단일 기준이다.' '마스터 프롬프트에 단일 기준 선언이 없습니다.'
require_text "$master" '긴 변 약 168~198px' '현재 스티커 크기 규칙이 없습니다.'
require_text "$master" 'Pretendard ExtraBold 800, 70pt' '현재 대표사진 제목 규칙이 없습니다.'
require_text "$master" '본문은 나눔고딕 16pt·행간 200%' '현재 본문 서식 규칙이 없습니다.'
require_text "$master" '빈 줄 3개, 즉 Enter 3번' '현재 소제목 간격 규칙이 없습니다.'
require_text "$master" '소제목 → Enter 1번 → 첫 설명 문단' '현재 소제목 줄 분리 규칙이 없습니다.'
require_text "$master" '전용 배경 이미지만 사용한다' '카드뉴스 무문자 표지 배경 규칙이 없습니다.'
require_text "$master" '기본값은 도입부 첫 인사 위치의 `안녕하세요` 스티커 1개' '현재 기본 스티커 규칙이 없습니다.'
require_text "$image_prompt" '항상 `BYCHEM_NAVERBLOG_MASTER_PROMPT.md`의 현재 버전을 따른다' '이미지 보조 프롬프트에 우선순위 선언이 없습니다.'
require_text "$automation" '`templates/review_email.html`' '자동화 프롬프트에 HTML 검수 메일 템플릿이 없습니다.'
require_text "$architecture" '콘텐츠 결과물을 바꾸는 규칙은 마스터 프롬프트에서만 결정한다.' '문서 구조에 콘텐츠 단일 기준이 없습니다.'

reject_text "$master" '긴 변 약 160~185px' '마스터 프롬프트에 이전 스티커 크기가 남아 있습니다.'
reject_text "$master" '빈 줄 2개, 즉 Enter 2번' '마스터 프롬프트에 충돌하는 소제목 간격이 남아 있습니다.'
reject_text "$master" '게시물당 0~2개 범위에서 사용한다' '마스터 프롬프트에 이전 스티커 선택 규칙이 남아 있습니다.'

# 아래 값은 콘텐츠 결과를 결정하므로 마스터 밖의 활성 문서에 복사하면 실패한다.
active_helpers="$repo_dir/AGENTS.md $repo_dir/README.md $repo_dir/docs/PROMPT_ARCHITECTURE.md $repo_dir/docs/WORKFLOW.md $repo_dir/docs/발행운영규칙.md $repo_dir/docs/주간자동화운영.md $image_prompt $automation"
for file in $active_helpers; do
  reject_text "$file" '168~198px' "$(basename "$file")에 스티커 크기 규칙이 중복됐습니다."
  reject_text "$file" '70pt' "$(basename "$file")에 대표사진 글자 크기 규칙이 중복됐습니다."
  reject_text "$file" '21pt' "$(basename "$file")에 소제목 글자 크기 규칙이 중복됐습니다."
  reject_text "$file" 'Enter 3번' "$(basename "$file")에 소제목 간격 규칙이 중복됐습니다."
  reject_text "$file" '약 2,500자' "$(basename "$file")에 본문 분량 규칙이 중복됐습니다."
  reject_text "$file" '#페인트시너' "$(basename "$file")에 고정 태그 규칙이 중복됐습니다."
done

if [ "$fail" -ne 0 ]; then
  exit 1
fi

echo "OK: master prompt is the single source of content rules."
