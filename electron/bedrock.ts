import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_SYSTEM_PROMPT =
  "あなたはデスクトップ右下に住む小さなエイリアンの友達です。日本語で、1文から2文、60文字以内で、やさしく短い一言を返してください。箇条書きや絵文字は不要です。";
const DEFAULT_USER_PROMPT =
  "仕事の合間にふと目に入る、自然で短い一言をください。";

export type BedrockState = {
  status: "idle" | "loading" | "ready" | "error";
  message: string;
  detail: string;
  updatedAt: string | null;
};

type BedrockServiceOptions = {
  onStateChange?: (state: BedrockState) => void;
};

function createInitialState(): BedrockState {
  return {
    status: "idle",
    message: "Bedrock からのひとことを待っています。",
    detail: "起動後に最初の応答を取得します。",
    updatedAt: null,
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function buildPrompt(basePrompt: string) {
  const now = new Date();
  const formattedTime = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return `${basePrompt}\n現在時刻: ${formattedTime}`;
}

function extractTextFromResponse(response: ConverseCommandOutput) {
  const content = response.output?.message?.content ?? [];
  const text = content
    .map((block: (typeof content)[number]) =>
      "text" in block && typeof block.text === "string" ? block.text : "",
    )
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Bedrock の応答にテキストが含まれていません。");
  }

  return text.length > 140 ? `${text.slice(0, 140)}...` : text;
}

export function createBedrockService(options: BedrockServiceOptions) {
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "";
  const modelId = process.env.BEDROCK_MODEL_ID ?? "";
  const explicitProfile =
    process.env.BEDROCK_AWS_PROFILE?.trim() || process.env.AWS_PROFILE?.trim() || "";
  const systemPrompt = process.env.BEDROCK_SYSTEM_PROMPT?.trim() || DEFAULT_SYSTEM_PROMPT;
  const userPrompt = process.env.BEDROCK_USER_PROMPT?.trim() || DEFAULT_USER_PROMPT;

  let state = createInitialState();
  let refreshTimer: NodeJS.Timeout | null = null;
  let refreshInFlight: Promise<void> | null = null;
  let client: BedrockRuntimeClient | null = null;

  function publish(nextState: BedrockState) {
    state = nextState;
    options.onStateChange?.(state);
  }

  async function refresh() {
    if (!client) {
      return;
    }

    if (refreshInFlight) {
      return refreshInFlight;
    }

    publish({
      ...state,
      status: "loading",
      detail: "Bedrock に問いかけています...",
      message:
        state.status === "ready"
          ? state.message
          : "Bedrock からのひとことを待っています。",
    });

    refreshInFlight = (async () => {
      try {
        const response = await client.send(
          new ConverseCommand({
            modelId,
            system: [{ text: systemPrompt }],
            messages: [
              {
                role: "user",
                content: [{ text: buildPrompt(userPrompt) }],
              },
            ],
            inferenceConfig: {
              maxTokens: 80,
              temperature: 0.8,
              topP: 0.95,
            },
          }),
        );

        publish({
          status: "ready",
          message: extractTextFromResponse(response),
          detail: `Bedrock から取得済み: ${modelId}`,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        const message = toErrorMessage(error);

        publish({
          status: "error",
          message:
            state.updatedAt === null
              ? "Bedrock の応答を表示できません。"
              : state.message,
          detail: message,
          updatedAt: state.updatedAt,
        });
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  }

  function start() {
    if (!region || !modelId) {
      publish({
        status: "error",
        message: "Bedrock の設定が足りません。",
        detail: "AWS_REGION と BEDROCK_MODEL_ID を設定してください。",
        updatedAt: null,
      });
      return;
    }

    client = new BedrockRuntimeClient({
      region,
      ...(explicitProfile
        ? {
            credentials: fromIni({
              profile: explicitProfile,
              clientConfig: { region },
            }),
          }
        : {}),
    });
    void refresh();
    refreshTimer = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);
  }

  function stop() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }

    if (client) {
      client.destroy();
      client = null;
    }
  }

  return {
    getState() {
      return state;
    },
    refresh,
    start,
    stop,
  };
}
