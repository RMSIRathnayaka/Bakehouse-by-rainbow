import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaCommentDots, FaPaperPlane, FaRobot, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import api, { getImageUrl } from "../utils/api";
import { getUserRole } from "../utils/session";
import "./chatbot.css";

const STARTER_MESSAGE = {
  id: "starter",
  role: "bot",
  text: "Hi, I can help with cake recommendations, delivery rules, custom designs, ordering, and payments.",
  suggestions: [
    "I need a birthday cake",
    "How many days before should I order?",
    "Can I upload my own design?",
    "What payment methods are available?",
  ],
};

function Chatbot() {
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const shouldHide = location.pathname.startsWith("/admin-panel") || getUserRole() === "admin";

  const latestSuggestions = useMemo(() => {
    const lastBotMessage = [...messages].reverse().find((message) => message.role === "bot");
    return lastBotMessage?.suggestions || STARTER_MESSAGE.suggestions;
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [isOpen, messages, isSending]);

  if (shouldHide) {
    return null;
  }

  const openChat = () => {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const sendMessage = async (messageText) => {
    const trimmed = messageText.trim();

    if (!trimmed || isSending) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await api.post("/api/chatbot/", { message: trimmed });
      const botMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: response.data.answer,
        intent: response.data.intent,
        suggestions: response.data.suggestions || [],
        products: response.data.products || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot request failed", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-error-${Date.now()}`,
          role: "bot",
          text: "I could not answer that right now. Please try again in a moment.",
          suggestions: STARTER_MESSAGE.suggestions,
        },
      ]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handlePrimaryAction = (intent) => {
    if (intent === "customization") {
      navigate("/custom");
      return;
    }

    navigate("/cakes");
  };

  return (
    <div className={`chatbot-widget ${isOpen ? "is-open" : ""}`}>
      {isOpen && (
        <section className="chatbot-panel" aria-label="BakeHouse assistant">
          <header className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-avatar" aria-hidden="true">
                <FaRobot />
              </span>
              <div>
                <strong>BakeHouse Assistant</strong>
                <span>Online</span>
              </div>
            </div>

            <button type="button" className="chatbot-icon-button" aria-label="Close chat" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </header>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((message) => (
              <article className={`chatbot-message ${message.role}`} key={message.id}>
                <p>{message.text}</p>

                {message.products?.length > 0 && (
                  <div className="chatbot-products">
                    {message.products.map((product) => (
                      <button
                        type="button"
                        className="chatbot-product"
                        key={product.id}
                        onClick={() => navigate("/cakes")}
                      >
                        {product.image && (
                          <img src={getImageUrl(product.image)} alt={product.name} />
                        )}
                        <span>
                          <strong>{product.name}</strong>
                          <small>Rs. {product.price}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {message.role === "bot" && message.intent && message.intent !== "fallback" && (
                  <button
                    type="button"
                    className="chatbot-action"
                    onClick={() => handlePrimaryAction(message.intent)}
                  >
                    {message.intent === "customization" ? "Open custom order" : "Browse cakes"}
                  </button>
                )}
              </article>
            ))}

            {isSending && (
              <article className="chatbot-message bot">
                <p>Checking the bakery catalog...</p>
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-suggestions">
            {latestSuggestions.slice(0, 4).map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about cakes, delivery, or payment"
              maxLength={500}
            />
            <button type="submit" aria-label="Send message" disabled={isSending || !input.trim()}>
              <FaPaperPlane />
            </button>
          </form>
        </section>
      )}

      {!isOpen && (
        <button type="button" className="chatbot-launcher" onClick={openChat} aria-label="Open BakeHouse assistant">
          <FaCommentDots />
          <span>Chat</span>
        </button>
      )}
    </div>
  );
}

export default Chatbot;
