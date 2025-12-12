const API_BASE = "http://localhost:8000/api/chatbot";

export const fetchHistoryParams = async () => {
  const response = await fetch(`${API_BASE}/history`, {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
  });
  return await response.json();
};

export const fetchAiResponse = async (prompt) => {
  const response = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    credentials: "include",
  });
  return await response.json();
};

export const saveMessage = async (id, text, sender) => {
  const response = await fetch(`${API_BASE}/save`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id, text, sender }),
  });
  return await response.json();
};