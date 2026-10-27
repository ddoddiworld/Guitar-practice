# 검증 기록

2026-10-27, Node.js 24.22.1 환경에서 검증했습니다.

- TypeScript 검사 통과 (`npm run typecheck`)
- 단위 테스트 10개 통과: 일별/주간 집계, 연속 일수, 연도 경계, 잘못된 날짜/시간/BPM, API 입력 범위, Claude 요청 헤더/본문, 오류 및 빈/잘린 응답 처리
- 프로덕션 빌드 통과 (`npm run build`)
- 앱 내 브라우저에서 곡 등록, 완성도, 기록 추가, 새로고침 후 유지, 대시보드 집계, 메트로놈 시작/정지, API 키 미설정 오류 안내 확인
- 390px 모바일 화면의 레이아웃 및 가로 넘침 없음 확인

로컬 Playwright CLI 실행은 macOS 샌드박스의 Mach port 접근 제한으로 브라우저를 시작하지 못했습니다. 테스트 시나리오는 `.github/workflows/ci.yml`에서 Linux Chromium으로 자동 검증하도록 구성했습니다. 로컬에서는 `npm run build` 후 `npm run test:e2e`로 실행합니다.

실제 Anthropic API 키가 제공되지 않아 유료 API 호출은 수행하지 않았습니다. Claude 응답 처리는 주입한 모의 HTTP 응답으로 검증했습니다. 실제 스피커 소리와 백그라운드 탭의 장시간 오디오 동작은 별도 수동 확인이 필요합니다.

## 남아 있는 의존성 경고

`npm audit`는 Nuxt → Nitro → listhen → node-forge 1.4.0의 RSA 서명 검증 취약점(GHSA-86w9-cpqp-85rv)을 보고합니다. 이 단일 하위 의존성 때문에 상위 패키지까지 7개의 high 경고가 전파됩니다. 현재 호환 가능한 수정 버전이 없어 유지했습니다. 이 앱은 node-forge RSA 검증 기능을 직접 사용하지 않습니다. `npm audit fix --force`가 제안하는 이전 Nuxt로의 다운그레이드는 다른 보안 수정을 제거하므로 적용하지 않았습니다.

## Sites 배포 준비 검증

Worker 전용 접근 토큰 검증을 포함한 단위 테스트 11개와 타입 검사를 통과했습니다. Cloudflare Worker 빌드 후 SSR HTML, 정적 JS, HEAD, 허용되지 않은 메서드 거부, API 키 미설정 오류, 프로젝트 ID 검사를 통과했습니다. Node 서버 빌드도 유지합니다.

사이트의 기본 접근 권한은 소유자 본인 전용입니다. 게시 성공 여부와 실제 접속 주소는 Sites 배포 상태를 통해 확인합니다.

## Cloudflare 직접 공개 배포 준비

직접 배포용 Wrangler 설정을 추가했습니다. 타입 검사, 단위 테스트 11개, Cloudflare Worker 빌드 및 `wrangler deploy --dry-run`을 통과했습니다. 2026-10-27 Cloudflare 재로그인 후 공개 배포를 완료했습니다. 배포 버전은 `c5816c1a-cc1d-49bf-889f-0d2962d9bd37`입니다. 실제 공개 주소에서 HTML·JS·CSS 200 응답과 키 미설정 API의 503 안내 응답을 확인했습니다. 기본 Node 서버와 기존 Sites 빌드도 유지합니다.

## 자동 배포·태그 워크플로

타입 검사와 테스트 19개가 통과했습니다. 임시 bare Git 저장소를 사용하는 통합 테스트로 최초 태그, 동일 커밋 재실행, 패치 증가, 오래된 커밋 재실행, develop 실행 거부 및 잘못된 SHA·태그 거부를 확인했습니다. release.json을 포함한 Cloudflare dry-run도 통과했습니다. PR CI는 브라우저 테스트 4개, Node/Sites 빌드 및 Cloudflare dry-run을 포함합니다.

GitHub production 환경은 main 브랜치로 제한했고 계정 변수 및 Worker 전용 API 토큰 Secret을 연결했습니다. 전체 실제 배포·자동 태그 생성은 이 PR이 main에 병합된 뒤 실행됩니다.
