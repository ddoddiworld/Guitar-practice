# Fret Lab

Nuxt 4 + Vue 3 + TypeScript 기반 개인 기타 연습실 MVP입니다. 기존 README.md는 그대로 보존했습니다.

## 실행

Node.js 22.22.3 이상 또는 24.15 이상에서:

```sh
npm ci
cp .env.example .env
npm run dev
```

http://localhost:3000 에서 사용합니다.

## 기능

- 연습 기록: 날짜, 시간, 곡, 분류, 메모 저장 및 삭제
- 연습곡: 곡/아티스트/목표 BPM 등록, 완성도 조정, 삭제 (기존 기록 보존)
- 성장 대시보드: 누적/최근 7일 시간, 연속 연습일, 레퍼토리 수, 일별 차트
- Web Audio API 메트로놈: 30–240 BPM, 3/4·4/4·6/8, 첫 박 강세. 6/8에서는 8분음표 클릭당 BPM입니다. 오디오 시계 기반 선행 예약을 사용하며 화면 이동 후에도 유지됩니다. 종료 시 예약을 정리합니다.
- Claude 주간 계획: 목표, 하루 시간, 최근 기록을 토대로 서버에서 7일 계획 생성 및 텍스트 다운로드
- JSON 데이터 백업 다운로드

데이터는 이 브라우저의 localStorage에 저장됩니다. 계정/서버 DB/기기 간 동기화는 없으며 브라우저 데이터 삭제 시 사라집니다. 백업 파일을 주기적으로 내려받으세요. 손상된 저장 데이터는 덮어쓰지 않습니다. 계획 결과는 화면에서만 유지되므로 다운로드하세요.

## 환경 변수

- `NUXT_ANTHROPIC_API_KEY`: Anthropic API 키. 서버 전용이며 브라우저에 전달하지 않습니다.
- `NUXT_ANTHROPIC_MODEL`: 계정에서 사용 가능한 Claude 모델 ID (기본 `claude-sonnet-4-5`).
- `NUXT_PLAN_ACCESS_TOKEN`: 배포 시 필수. 충분히 긴 무작위 비밀 값을 설정하고 계획 생성 화면에 입력합니다. 개발 환경에서는 선택 사항입니다. 접근 토큰은 브라우저 저장소에 저장하지 않습니다.

`.env`는 Git에서 제외됩니다. 실제 비밀 키를 소스에 넣지 마세요. 프로덕션에서는 호스팅 환경 변수로 주입하세요. 빌드된 서버는 `.env`를 자동 로드하지 않습니다.

```sh
npm run build
node .output/server/index.mjs
```

계획 생성 시 최대 50개 곡과 최근 100개 기록, 목표가 Anthropic으로 전송되며 API 과금이 발생할 수 있습니다. 키 미설정, 접근 거부, 잘못된 입력, API 실패를 화면에서 안내합니다. 개인 사용 MVP이므로 공개 서비스로 확장하려면 사용자별 인증, 요청 제한 및 영속 저장소를 추가하세요.

## 검증

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npx playwright test
```

단위 테스트는 날짜 경계, 통계와 입력 검증을 검사합니다. 브라우저 테스트는 데스크톱/모바일에서 곡 추가, 완성도 변경, 재접속 후 유지, 기록 추가, 대시보드 집계, 메트로놈 시작/정지, API 미설정 안내 및 모의 계획 응답의 안전한 표시를 검사합니다. 실제 유료 Claude 호출은 API 키가 있을 때 수동 검증해야 합니다. 브라우저 자동 테스트는 실제 스피커 소리나 백그라운드 탭의 오디오 타이밍을 보증하지 않습니다.

## Sites 배포

`.openai/hosting.json`에 연결된 비공개 Sites 프로젝트 ID를 보존합니다.

- `npm run build`: 기존 Node 서버 빌드
- `npm run build:sites`: Nuxt의 Cloudflare Worker 빌드 후 `dist/server/index.js`와 호스팅 메타데이터 패키징

Sites에서 다시 배포할 때는 소스를 먼저 동기화한 뒤 동일 커밋에서 만든 배포 파일을 업로드합니다. 클라이언트 파일은 Worker 배포 파일에 포함되며 API도 같은 주소에서 실행됩니다. 예정 주소는 `https://fret-lab-guitar-practice.noisynote513.chatgpt.site`이며, 실제 배포 성공 여부는 Sites 배포 상태로 확인합니다. 기본 접근 권한은 본인 전용입니다.

Claude 기능을 활성화하려면 Sites 런타임 환경 변수에 `NUXT_ANTHROPIC_API_KEY`와 `NUXT_PLAN_ACCESS_TOKEN`을 설정한 후 다시 배포하세요. 비밀 값을 Git이나 브라우저 코드에 넣지 않습니다. API 키가 없는 상태에서도 기록, 연습곡, 대시보드, 메트로놈을 사용할 수 있습니다.

## Cloudflare 계정에 직접 공개 배포

공개 배포 주소: https://fret-lab-guitar-practice.emily-jang.workers.dev

Sites를 거치지 않고 Cloudflare Workers에 서버와 정적 파일을 함께 배포할 수 있습니다. `wrangler.jsonc`가 공개 `workers.dev` 주소를 사용하도록 설정되어 있습니다. 기존 Sites 배포는 별도로 유지됩니다.

```sh
npm ci
npx wrangler login
npm run check:cloudflare
npm run deploy:cloudflare
```

`check:cloudflare`는 Nuxt Worker 빌드와 업로드 파일 검증만 수행하고 실제 배포하지 않습니다. `deploy:cloudflare`는 로그인한 Cloudflare 계정에 배포하고 실제 주소를 표시합니다. 여러 계정이 연결되어 있으면 `CLOUDFLARE_ACCOUNT_ID` 환경 변수로 배포할 계정을 지정하세요.

Claude 관련 비밀 값은 Cloudflare에 저장합니다. 명령 실행 후 프롬프트에서 입력하며, 파일이나 명령 인수에 키를 넣지 않습니다.

```sh
npx wrangler secret put NUXT_ANTHROPIC_API_KEY
npx wrangler secret put NUXT_PLAN_ACCESS_TOKEN
```

공개 사이트의 방문자도 기록·메트로놈을 사용할 수 있으나, 계획 생성에는 접근 토큰이 필요합니다. 브라우저별 기록은 다른 도메인으로 자동 이전되지 않습니다.

Codex에서 기본 인증 폴더에 쓸 수 없는 경우 Wrangler가 지원하는 `XDG_CONFIG_HOME`을 별도 작업 폴더로 지정할 수 있습니다. 로그인과 배포에 동일한 값을 사용하며, 해당 인증 폴더는 Git 저장소에 넣지 않습니다.
