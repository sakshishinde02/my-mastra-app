"use client";

import { useState } from "react";

export default function Page() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("http://localhost:4111/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      const assistantMessage = { role: "assistant", content: data.text };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error connecting to the server." },
      ]);
    }
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Berkshire Hathaway Chat</h1>
      <div className="border p-4 rounded h-[500px] overflow-y-auto space-y-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="bg-blue-600 text-white px-4 rounded"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </main>
  );
}
