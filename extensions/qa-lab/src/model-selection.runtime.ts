// Qa Lab plugin module implements model selection behavior.
import {
  defaultQaModelForMode,
  normalizeQaProviderMode,
  type QaProviderMode,
  type QaProviderModeInput,
} from "./model-selection.js";
import { DEFAULT_QA_LIVE_PROVIDER_MODE } from "./providers/index.js";
import { resolveQaLiveFrontierPreferredModel } from "./providers/live-frontier/model-selection.runtime.js";

const QA_GPT_5_6_SOL_MODEL = "openai/gpt-5.6-sol";
const QA_GPT_5_6_LUNA_MODEL = "openai/gpt-5.6-luna";
const QA_LIVE_ALTERNATE_MODELS = {
  "openai/gpt-5.6": QA_GPT_5_6_LUNA_MODEL,
  [QA_GPT_5_6_SOL_MODEL]: QA_GPT_5_6_LUNA_MODEL,
  [QA_GPT_5_6_LUNA_MODEL]: QA_GPT_5_6_SOL_MODEL,
} as const;

export function defaultQaRuntimeModelForMode(
  mode: QaProviderModeInput,
  options?: {
    alternate?: boolean;
    preferredLiveModel?: string;
  },
) {
  const preferredLiveModel =
    options?.preferredLiveModel ??
    (normalizeQaProviderMode(mode) === DEFAULT_QA_LIVE_PROVIDER_MODE
      ? resolveQaLiveFrontierPreferredModel()
      : undefined);
  return defaultQaModelForMode(mode, {
    ...options,
    preferredLiveModel,
  });
}

export function resolveQaRuntimeModelPair(params: {
  providerMode: QaProviderModeInput;
  primaryModel?: string;
  alternateModel?: string;
  resolveDefaultModel?: (mode: QaProviderMode, alternate?: boolean) => string;
}) {
  const providerMode = normalizeQaProviderMode(params.providerMode);
  const normalizeModel = (model: string | undefined) => model?.trim() || undefined;
  const resolveDefaultModel =
    params.resolveDefaultModel ??
    ((mode: QaProviderModeInput, alternate = false) =>
      defaultQaRuntimeModelForMode(mode, alternate ? { alternate: true } : undefined));
  const primaryModel = normalizeModel(params.primaryModel) ?? resolveDefaultModel(providerMode);
  const explicitAlternateModel = normalizeModel(params.alternateModel);
  let alternateModel = explicitAlternateModel;
  if (!alternateModel && providerMode === DEFAULT_QA_LIVE_PROVIDER_MODE) {
    alternateModel =
      QA_LIVE_ALTERNATE_MODELS[primaryModel.toLowerCase() as keyof typeof QA_LIVE_ALTERNATE_MODELS];
  }
  alternateModel ??= resolveDefaultModel(providerMode, true);
  return { primaryModel, alternateModel };
}
