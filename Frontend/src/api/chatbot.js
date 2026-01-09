const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/chatbot`;

export const fetchChatHistory = async () => {
  const res = await fetch(`${API_BASE}/history`, {
    credentials: "include",
  });
  return res.json();
};

export const sendPrompt = async (prompt) => {
  const res = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ prompt }),
  });
  return res.json();
};

export const updateChatMessage = async (messageId, text) => {
  const res = await fetch(`${API_BASE}/${messageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  return res.json();
};
