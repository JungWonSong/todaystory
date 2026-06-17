import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { SceneMessage, StoryRouteConfig } from "@/types/story";

type ContinueStoryPayload = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  mood: string | null;
  story_world: string | null;
  main_plot: string | null;
  main_conflict?: string | null;
  plot_twist: string | null;
  route_common_rules: string | null;
  forbidden_direction?: string | null;
  opening_scene: string | null;
  first_question: string | null;
};

type ContinueRequestBody = {
  story?: ContinueStoryPayload;
  routeConfig?: StoryRouteConfig;
  messages?: SceneMessage[];
  userInput?: string;
};

function trimText(text: string | null | undefined, max = 300) {
  const value = text?.trim() ?? "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function isSceneMessage(value: unknown): value is SceneMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { role?: unknown; content?: unknown };
  return (
    (candidate.role === "scene" ||
      candidate.role === "user" ||
      candidate.role === "question") &&
    typeof candidate.content === "string"
  );
}

function compactMessage(message: SceneMessage) {
  const prefix = {
    scene: "장면",
    user: "내가 쓴 대사",
    question: "장면이 멈춘 곳",
  }[message.role];

  return `${prefix}: ${trimText(message.content, 300)}`;
}

function safeJsonFromText(text: string) {
  try {
    return JSON.parse(text) as { scene?: string; question?: string };
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as {
          scene?: string;
          question?: string;
        };
      } catch {
        return null;
      }
    }

    return null;
  }
}

function fallbackFromRaw(rawText: string, userInput: string) {
  const raw = trimText(rawText, 600);

  if (raw) {
    return {
      scene: raw,
      question: "나는 이 순간, 어떤 말을 꺼낼까?",
    };
  }

  return {
    scene:
      `“${userInput}”\n\n` +
      "입 밖으로 나온 말은 생각보다 작았다. 하지만 그 말이 방 안의 고요를 아주 천천히 흔들었다. 나는 손끝에 남은 긴장을 느끼며 상대의 눈을 바라보았다. 오래 미뤄두었던 마음이 이제야 이 장면 한가운데 놓인 것 같았다.",
    question: "이 침묵 끝에 나는 뭐라고 말할까?",
  };
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되어 있지 않아요." },
      { status: 500 },
    );
  }

  let body: ContinueRequestBody;

  try {
    body = (await request.json()) as ContinueRequestBody;
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않아요." },
      { status: 400 },
    );
  }

  const userInput = body.userInput?.trim();

  if (!body.story) {
    return NextResponse.json(
      { error: "이야기 정보가 필요해요." },
      { status: 400 },
    );
  }

  if (!userInput) {
    return NextResponse.json(
      { error: "주인공의 대사를 입력해주세요." },
      { status: 400 },
    );
  }

  const compactStory = [
    `제목: ${trimText(body.story.title, 120)}`,
    `소개: ${trimText(body.story.description, 250)}`,
    `분류: ${trimText(body.story.category, 80)}`,
    `분위기: ${trimText(body.story.mood, 150)}`,
    `세계관: ${trimText(body.story.story_world, 300)}`,
    `큰 줄거리: ${trimText(body.story.main_plot, 300)}`,
    `장면의 갈등: ${trimText(body.story.main_conflict, 240)}`,
    `복선/반전: ${trimText(body.story.plot_twist, 200)}`,
    `공통 전개 규칙: ${trimText(body.story.route_common_rules, 240)}`,
    `금지 전개: ${trimText(body.story.forbidden_direction, 200)}`,
    `첫 장면: ${trimText(body.story.opening_scene, 400)}`,
    `첫 질문: ${trimText(body.story.first_question, 160)}`,
  ].join("\n");

  const routeContext = body.routeConfig
    ? [
        `사용자의 역할 분류: ${body.routeConfig.routeLabel}`,
        `주인공 역할: ${body.routeConfig.protagonistRole}`,
        `상대 인물: ${body.routeConfig.counterpartName}`,
        `상대 설정: ${trimText(body.routeConfig.counterpartProfile, 240)}`,
        `루트 첫 장면: ${trimText(body.routeConfig.openingScene, 300)}`,
        `상대의 첫 대사: ${trimText(body.routeConfig.npcLine, 160)}`,
        `멈춤 질문: ${trimText(body.routeConfig.pauseQuestion, 160)}`,
      ].join("\n")
    : "";

  const compactMessages = (body.messages ?? [])
    .filter(isSceneMessage)
    .slice(-6)
    .map(compactMessage)
    .join("\n");

  const systemPrompt = `
너는 한국어 감정형 인터랙티브 소설 작가다.
사용자는 이야기 속 주인공이다.
사용자의 입력은 주인공이 장면 속에서 직접 한 대사다.
너는 그 대사를 소설 본문에 자연스럽게 반영하고, 다음 장면을 이어쓴다.

절대 하지 말 것:
- 사용자에게 조언하지 말 것
- 사용자를 상담하지 말 것
- "좋은 선택이에요" 같은 평가 금지
- AI가 대답하는 말투 금지
- 채팅 응답처럼 쓰지 말 것
- 장면 밖 설명 금지
- roleLabel을 제목이나 인물 이름처럼 쓰지 말 것
- "당신은 ~했습니다"를 남발하지 말 것
- 심리 분석 금지

반드시 할 것:
- story.title을 이야기의 제목으로 이해할 것
- routeConfig.protagonistRole을 사용자가 맡은 역할로 이해할 것
- routeConfig.counterpartName과 counterpartProfile을 상대 인물로 사용할 것
- 사용자의 대사를 장면 안의 실제 대사로 반영할 것
- 등장인물의 반응을 행동과 분위기로 보여줄 것
- story.story_world, story.main_plot, story.main_conflict를 따라갈 것
- story.plot_twist는 초반에 직접 밝히지 말 것
- story.route_common_rules와 story.forbidden_direction을 지킬 것
- 1인칭 소설체로 쓸 것
- 한 번에 250~450자
- 마지막에는 다시 장면을 멈추고, 주인공의 다음 대사를 유도할 것
- 출력은 scene과 question만 포함할 것
- JSON만 출력할 것
`;

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 12000,
  });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content:
            `스토리\n${compactStory}\n\n` +
            `루트 설정\n${routeContext}\n\n` +
            `지금까지의 장면\n${compactMessages}\n\n` +
            `주인공이 방금 한 대사\n${trimText(userInput, 300)}`,
        },
      ],
      text: {
        format: { type: "json_object" },
      },
      temperature: 0.7,
      max_output_tokens: 450,
    });

    const rawText = response.output_text;
    const parsed = safeJsonFromText(rawText);
    const fallback = fallbackFromRaw(rawText, userInput);

    return NextResponse.json({
      scene: trimText(parsed?.scene, 700) || fallback.scene,
      question:
        trimText(parsed?.question, 180) ||
        fallback.question ||
        "나는 이 순간, 어떤 말을 꺼낼까?",
    });
  } catch (error) {
    console.error("story continue failed", error);
    return NextResponse.json(
      {
        error: "장면을 이어가지 못했어요. 다시 한 번 대사를 넣어볼까요?",
      },
      { status: 500 },
    );
  }
}
