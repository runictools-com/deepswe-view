import v11Artifact from "../artifacts/v1.1/leaderboard-live.json" with { type: "json" };
import v1Artifact from "../artifacts/v1/leaderboard-live.json" with { type: "json" };

const artifacts = {
  "v1.1": v11Artifact,
  v1: v1Artifact,
};

const reasoningOrder = {
  default: -1,
  low: 0,
  medium: 1,
  high: 2,
  xhigh: 3,
  max: 4,
};

const preferredEffort = {
  "gpt-5-6-sol": "medium",
  "gpt-5-6-terra": "medium",
  "gpt-5-6-luna": "medium",
  "gpt-5-5": "medium",
  "claude-opus-4-8": "high",
  "claude-opus-4-7": "xhigh",
  "claude-fable-5": "high",
  "claude-sonnet-5": "high",
  "gemini-3-5-flash": "high",
  "gemini-3-7-flash": "medium",
  "muse-spark-1-1": "medium",
};

const excludedFromDefault = new Set([
  "gpt-5-6-terra",
  "gpt-5-4",
  "grok-4-5",
  "kimi-k2-7-code",
  "claude-sonnet-4-6",
  "gemini-3-1-pro-preview",
  "muse-spark-1-1",
]);

const defaultEffortsByVersion = {
  "v1.1": new Map([
    ["claude-opus-5", ["low", "medium", "high"]],
    ["gpt-5-6-sol", ["low", "medium", "high", "xhigh"]],
    ["claude-fable-5", ["low", "medium", "high"]],
    ["glm-5-3", null],
    ["glm-5-3-flash", null],
    ["kimi-k3", null],
    ["grok-4-6", ["low", "medium", "high", "xhigh"]],
    ["gpt-5-6-luna", ["low", "medium", "high", "xhigh", "max"]],
    ["gemini-3-7-flash", ["low", "medium", "high"]],
    ["deepseek-v4-pro", null],
    ["deepseek-v4-flash", null],
  ]),
};

const pricingChanges = {
  "glm-5-3-flash": {
    from: { input: 0.15, cached: 0.03, output: 0.5 },
    to: { input: 0.075, cached: 0.015, output: 0.25 },
  },
  "gpt-5-6-luna": {
    from: { input: 1, cached: 0.1, output: 6 },
    to: { input: 0.2, cached: 0.02, output: 1.2 },
  },
  "gpt-5-6-terra": {
    from: { input: 2.5, cached: 0.25, output: 15 },
    to: { input: 2, cached: 0.2, output: 12 },
  },
  "gpt-5-6-sol": {
    from: { input: 5, cached: 0.5, output: 30 },
    to: { input: 4, cached: 0.4, output: 20 },
  },
  "deepseek-v4-pro": {
    v1: {
      from: { input: 1.74, cached: 0.0145, output: 3.48 },
      to: { input: 0.435, cached: 0.003625, output: 0.87 },
    },
    "v1.1": {
      from: { input: 0.435, cached: 0.003625, output: 0.87 },
      to: { input: 1.32, cached: 0.044, output: 3.96 },
    },
  },
  "deepseek-v4-flash": {
    from: { input: 0.14, cached: 0.0028, output: 0.28 },
    to: { input: 0.44, cached: 0.014, output: 1.32 },
  },
  "gemini-3-6-flash": {
    from: { input: 1.5, cached: 0.15, output: 7.5 },
    to: { input: 0.75, cached: 0.075, output: 3.75 },
  },
};

export function reasoningRank(effort) {
  return reasoningOrder[effort || "default"] ?? 50;
}

export function modelFamily(model) {
  const name = String(model || "").toLowerCase();
  if (name.includes("gpt-") || name.includes("o1-") || name.includes("o3-") || name.includes("o4-")) return "openai";
  if (name.includes("claude-")) return "anthropic";
  if (name.includes("gemini-")) return "google";
  if (name.includes("grok-")) return "xai";
  if (name.includes("muse-")) return "meta";
  if (name.includes("glm-")) return "zhipu";
  if (name.includes("kimi-")) return "moonshot";
  if (name.includes("deepseek-")) return "deepseek";
  if (name.includes("mistral-")) return "mistral";
  if (name.includes("mimo-")) return "xiaomi";
  if (name.includes("minimax")) return "minimax";
  if (name.includes("qwen")) return "alibaba";
  if (name.includes("composer-")) return "cursor";
  return "other";
}

function priceForTokens(tokens, price) {
  return (
    (tokens.input - tokens.cached) * price.input +
    tokens.cached * price.cached +
    tokens.output * price.output
  );
}

function proportionalPriceRatio(pricing) {
  const ratio = pricing.to.input / pricing.from.input;
  const cachedRatio = pricing.to.cached / pricing.from.cached;
  const outputRatio = pricing.to.output / pricing.from.output;
  return Math.abs(cachedRatio - ratio) < 1e-9 && Math.abs(outputRatio - ratio) < 1e-9 ? ratio : null;
}

function normalizedCost(row, version) {
  const change = pricingChanges[row.model];
  const pricing = row.model === "deepseek-v4-pro" ? change?.[version] : change;
  if (!pricing) return row.mean_cost_usd;

  const tokens = {
    input: row.mean_input_tokens,
    cached: row.mean_cache_tokens,
    output: row.mean_output_tokens,
  };
  if (![tokens.input, tokens.cached, tokens.output].every(Number.isFinite)) {
    const ratio = proportionalPriceRatio(pricing);
    return ratio == null ? row.mean_cost_usd : row.mean_cost_usd * ratio;
  }
  const fromCost = priceForTokens(tokens, pricing.from);
  if (!(fromCost > 0)) return row.mean_cost_usd;
  return row.mean_cost_usd * (priceForTokens(tokens, pricing.to) / fromCost);
}

function normalizeRow(row, version) {
  return {
    model: row.model,
    effort: row.reasoning_effort || "default",
    config: row.config,
    pass: row.pass_rate,
    cost: normalizedCost(row, version),
    output: row.mean_output_tokens,
    steps: row.mean_agent_steps,
    ci: Math.round(row.ci_half * 100),
    low: row.ci_lo,
    high: row.ci_hi,
    family: modelFamily(row.model),
  };
}

const normalizedRows = Object.fromEntries(
  Object.entries(artifacts).map(([version, artifact]) => [version, artifact.rows.map((row) => normalizeRow(row, version))]),
);

export function getLeaderboardRows(version) {
  return normalizedRows[version] ?? normalizedRows["v1.1"];
}

export function getLeaderboardMetadata(version) {
  const artifact = artifacts[version] ?? artifacts["v1.1"];
  return {
    tasks: artifact.n_tasks_in_set,
    updatedAt: artifact.generated_at,
  };
}

export function getModelRows(version) {
  const bestByModel = new Map();
  for (const row of getLeaderboardRows(version)) {
    const current = bestByModel.get(row.model);
    if (!current || row.pass > current.pass) bestByModel.set(row.model, row);
  }
  return [...bestByModel.values()].sort((a, b) => b.pass - a.pass);
}

export function getBestRows(version, selectedModels) {
  const bestByModel = new Map();
  for (const row of getLeaderboardRows(version)) {
    if (!selectedModels.has(row.model)) continue;
    const current = bestByModel.get(row.model);
    if (!current || reasoningRank(row.effort) > reasoningRank(current.effort)) bestByModel.set(row.model, row);
  }
  return [...bestByModel.values()].sort((a, b) => b.pass - a.pass);
}

export function getConfigGroups(version, selectedConfigs = new Set()) {
  const rows = getLeaderboardRows(version);
  return getModelRows(version).map((modelRow) => {
    const modelRows = rows
      .filter((row) => row.model === modelRow.model)
      .sort((a, b) => reasoningRank(a.effort) - reasoningRank(b.effort));
    return {
      model: modelRow.model,
      family: modelRow.family,
      rows: modelRows,
      selectedCount: modelRows.filter((row) => selectedConfigs.has(row.config)).length,
    };
  });
}

export function getDefaultModelSet(version) {
  const defaultEfforts = defaultEffortsByVersion[version];
  if (defaultEfforts) {
    const availableModels = new Set(getModelRows(version).map((row) => row.model));
    return new Set([...defaultEfforts.keys()].filter((model) => availableModels.has(model)));
  }

  return new Set(
    getModelRows(version)
      .filter((row) => row.pass >= 0.05 && !excludedFromDefault.has(row.model))
      .map((row) => row.model),
  );
}

export function getDefaultConfigSet(version, selectedModels = getDefaultModelSet(version)) {
  const defaultEfforts = defaultEffortsByVersion[version];
  return new Set(
    getLeaderboardRows(version)
      .filter((row) => {
        if (!selectedModels.has(row.model)) return false;
        if (!defaultEfforts) return row.cost <= 15;
        const efforts = defaultEfforts.get(row.model);
        return defaultEfforts.has(row.model) && (efforts === null || efforts.includes(row.effort));
      })
      .map((row) => row.config),
  );
}

export function getPreferredRow(rows, model) {
  const candidates = rows.filter((row) => row.model === model);
  if (candidates.length === 0) return null;
  const preferred = preferredEffort[model];
  return candidates.find((row) => row.effort === preferred) ?? [...candidates].sort((a, b) => reasoningRank(a.effort) - reasoningRank(b.effort)).at(-1);
}
