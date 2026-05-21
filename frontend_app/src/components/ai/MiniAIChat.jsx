import { useMemo, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { askAIChat } from "../../api/ai";
import { useDepartment } from "../../context/useDepartment";

const quickActions = [
  "Что нужно срочно пополнить?",
  "Какие товары лучше заказать?",
  "Что показывает AI-анализ?",
  "Как оформить приемку поставки?",
];

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    text: "Привет. Я AI-помощник склада. Могу подсказать по пополнению, поставкам, продажам, приемке и AI-рекомендациям.",
  },
];

function Bubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "88%",
        padding: "10px 12px",
        borderRadius: isUser ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
        border: `1px solid ${isUser ? "var(--accent-border)" : "var(--border)"}`,
        background: isUser ? "var(--accent)" : "var(--code-bg)",
        color: isUser ? "#fff" : "var(--text-h)",
        textAlign: "left",
        fontSize: 14,
        lineHeight: 1.45,
        whiteSpace: "pre-line",
      }}
    >
      {text}
    </div>
  );
}

export default function MiniAIChat() {
  const { department, subdepartment } = useDepartment();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const canSend = useMemo(
    () => value.trim().length > 0 && !isTyping,
    [value, isTyping]
  );

  function openChat() {
    setIsOpen(true);
  }

  function closeChat() {
    setIsOpen(false);
  }

  async function sendMessage(textFromSuggestion) {
    const text = (textFromSuggestion || value).trim();

    if (!text || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setValue("");
    setIsTyping(true);

    try {
      const response = await askAIChat({
        message: text,
        department,
        subdepartment,
      });

      const assistantMessage = {
        id: Date.now() + Math.random(),
        role: "assistant",
        text: response?.answer || "AI-помощник не вернул ответ.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          role: "assistant",
          text: "Не удалось получить ответ AI-помощника. Проверьте, запущен ли backend и работает ли маршрут /ai/chat.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSend() {
    sendMessage();
  }

  function handleQuickAction(text) {
    sendMessage(text);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {isOpen ? (
        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 146,
            width: 340,
            maxWidth: "calc(100% - 24px)",
            height: 500,
            maxHeight: "72vh",
            borderRadius: 24,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            boxShadow: "var(--shadow)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 14px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background:
                "linear-gradient(180deg, var(--accent-bg) 0%, transparent 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid var(--accent-border)",
                  background: "var(--accent)",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                <Bot size={18} />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    color: "var(--text-h)",
                  }}
                >
                  AI-помощник
                  <Sparkles size={14} />
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  Анализ продаж и остатков
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeChat}
              aria-label="Закрыть чат"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text-h)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                outline: "none",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              maskImage:
                "linear-gradient(to right, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)",
            }}
          >
            {quickActions.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => handleQuickAction(text)}
                disabled={isTyping}
                style={{
                  whiteSpace: "nowrap",
                  minHeight: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--code-bg)",
                  color: "var(--text-h)",
                  cursor: isTyping ? "default" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  outline: "none",
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                  opacity: isTyping ? 0.6 : 1,
                }}
              >
                {text}
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "var(--bg)",
            }}
          >
            {messages.map((message) => (
              <Bubble key={message.id} role={message.role} text={message.text} />
            ))}

            {isTyping ? (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 12px",
                  borderRadius: "18px 18px 18px 6px",
                  border: "1px solid var(--border)",
                  background: "var(--code-bg)",
                  color: "var(--text-h)",
                  fontSize: 14,
                }}
              >
                AI анализирует данные...
              </div>
            ) : null}
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: 12,
              background: "var(--bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Задай вопрос об остатках, пополнении, поставке..."
                style={{
                  flex: 1,
                  resize: "none",
                  minHeight: 44,
                  maxHeight: 100,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text-h)",
                  padding: "10px 12px",
                  fontSize: 14,
                  lineHeight: 1.4,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Отправить сообщение"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  border: "none",
                  background: canSend ? "var(--accent)" : "var(--code-bg)",
                  color: canSend ? "#fff" : "var(--text)",
                  cursor: canSend ? "pointer" : "default",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  boxShadow: canSend ? "var(--shadow)" : "none",
                  outline: "none",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={openChat}
        aria-label="Открыть AI-чат"
        style={{
          position: "absolute",
          right: 12,
          bottom: 76,
          width: 58,
          height: 58,
          borderRadius: 18,
          border: "1px solid var(--accent-border)",
          background: "var(--accent)",
          color: "#fff",
          zIndex: 9999,
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          boxShadow: "var(--shadow)",
          outline: "none",
        }}
      >
        <MessageCircle size={22} />
      </button>
    </>
  );
}