const DEFAULT_BASE = "https://api.weeek.net/public/v1";

export function weeekConfig() {
  const token = process.env.WEEEK_API_TOKEN?.trim();
  const projectId = Number(process.env.WEEEK_PROJECT_ID || process.env.WEEEK_FBS_PROJECT_ID);
  const boardId = Number(process.env.WEEEK_BOARD_ID || process.env.WEEEK_FBS_BOARD_ID);
  const boardColumnId = Number(
    process.env.WEEEK_BOARD_COLUMN_ID || process.env.WEEEK_FBS_BOARD_COLUMN_ID,
  );
  const baseUrl = (process.env.WEEEK_API_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");

  const configured =
    Boolean(token) &&
    Number.isFinite(projectId) &&
    projectId > 0 &&
    Number.isFinite(boardId) &&
    boardId > 0 &&
    Number.isFinite(boardColumnId) &&
    boardColumnId > 0;

  return { token, projectId, boardId, boardColumnId, baseUrl, configured };
}

export async function createWeeekLeadTask({ title, description }) {
  const cfg = weeekConfig();
  if (!cfg.configured) {
    throw new Error("WEEEK не сконфигурирован");
  }

    const body = {
      title,
      description,
      type: "call",
      projectId: cfg.projectId,
      boardId: cfg.boardId,
      boardColumnId: cfg.boardColumnId,
    };

  const response = await fetch(`${cfg.baseUrl}/tm/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const message =
      (typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      "WEEEK API error";
    throw new Error(message);
  }

  return data;
}
