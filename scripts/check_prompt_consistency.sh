#!/bin/sh

set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
master="$repo_dir/prompts/BYCHEM_NAVERBLOG_MASTER_PROMPT.md"
image_prompt="$repo_dir/prompts/이미지생성_캐릭터활용_프롬프트.md"

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

require_text "$master" '단일 기준' '마스터 프롬프트에 단일 기준 선언이 없습니다.'
require_text "$master" '긴 변 약 168~198px' '현재 스티커 크기 규칙이 없습니다.'
require_text "$master" 'Pretendard ExtraBold 800, 70pt' '현재 대표사진 제목 규칙이 없습니다.'
require_text "$master" '본문은 나눔고딕 16pt·행간 200%' '현재 본문 서식 규칙이 없습니다.'
require_text "$master" '소제목 → Enter 1번 → 첫 설명 문단' '소제목과 첫 설명 문단의 줄 분리 규칙이 없습니다.'
require_text "$image_prompt" '항상 `BYCHEM_NAVERBLOG_MASTER_PROMPT.md`의 현재 버전을 따른다' '이미지 보조 프롬프트에 우선순위 선언이 없습니다.'

reject_text "$master" '긴 변 약 160~185px' '마스터 프롬프트에 이전 스티커 크기가 남아 있습니다.'
reject_text "$image_prompt" '360~420px' '이미지 보조 프롬프트에 충돌하는 이전 스티커 크기가 남아 있습니다.'
reject_text "$image_prompt" '본문 폭의 35~50%' '이미지 보조 프롬프트에 충돌하는 이전 스티커 비율이 남아 있습니다.'
reject_text "$image_prompt" '제목 색상은 카테고리 기본색' '대표사진 제목 색상 규칙이 마스터와 충돌합니다.'

if [ "$fail" -ne 0 ]; then
  exit 1
fi

echo "OK: active prompt rules are consistent."
