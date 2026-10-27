import { requestPlan } from "../utils/claude";
import { verifyPlanToken } from "../utils/token";
import { planRequestSchema } from "#shared/practice";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  if (!config.anthropicApiKey)
    throw createError({
      statusCode: 503,
      statusMessage: "Claude API 키가 설정되지 않았습니다.",
    });
  const token = getHeader(event, "x-plan-token") || "";
  if (config.planAccessToken) {
    if (!(await verifyPlanToken(token, config.planAccessToken)))
      throw createError({
        statusCode: 401,
        statusMessage: "계획 생성 접근 토큰을 확인해 주세요.",
      });
  } else if (!import.meta.dev)
    throw createError({
      statusCode: 503,
      statusMessage: "서버에 계획 생성 접근 토큰을 설정해 주세요.",
    });
  const origin = getHeader(event, "origin");
  if (origin && origin !== getRequestURL(event).origin)
    throw createError({
      statusCode: 403,
      statusMessage: "허용되지 않은 요청입니다.",
    });
  const body = await readValidatedBody(event, (b) =>
    planRequestSchema.safeParse(b),
  );
  if (!body.success)
    throw createError({
      statusCode: 400,
      statusMessage: "연습 계획 입력값을 확인해 주세요.",
    });
  try {
    const plan = await requestPlan(
      { apiKey: config.anthropicApiKey, model: config.anthropicModel },
      body.data,
    );
    setHeader(event, "Cache-Control", "no-store");
    return { plan };
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage:
        "계획 생성에 실패했습니다. API 설정과 사용 한도를 확인한 뒤 다시 시도해 주세요.",
    });
  }
});
