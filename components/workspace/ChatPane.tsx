"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/cv/store";
import { streamChat, nextMessageId } from "@/lib/chat-client";
import type { Message } from "@/lib/cv-schema";
import { track } from "@/lib/funnel";

export function ChatPane() {
  const messages = useSession((s) => s.messages);
  const cv = useSession((s) => s.cv);
  const phase = useSession((s) => s.phase);
  const addMessage = useSession((s) => s.addMessage);
  const updateLastAssistantMessage = useSession(
    (s) => s.updateLastAssistantMessage
  );
  const applyPatchesToStore = useSession((s) => s.applyPatches);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(userText: string) {
    if (!userText.trim() || sending) return;
    setError(null);
    setSending(true);
    setInput("");

    const userMsg: Message = {
      id: nextMessageId(messages),
      role: "user",
      content: userText.trim(),
      createdAt: Date.now(),
    };
    addMessage(userMsg);
    if (messages.length === 0) {
      track("chat_first_message_sent", { phase });
    }

    // Placeholder assistant message that will stream in.
    const nextMessages = [...messages, userMsg];
    const assistantMsg: Message = {
      id: nextMessageId(nextMessages),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    addMessage(assistantMsg);

    try {
      for await (const ev of streamChat({
        messages: nextMessages,
        cv,
        phase,
      })) {
        if (ev.type === "message") {
          updateLastAssistantMessage(ev.text);
        } else if (ev.type === "patches") {
          applyPatchesToStore(ev.patches);
          if (ev.dropped.length > 0) {
            // Silently drop hallucinated patches but log for debugging.
            console.warn("[chat] dropped patches:", ev.dropped);
          }
        } else if (ev.type === "error") {
          setError(ev.error);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const welcome = getWelcome(phase);
  const lastAssistantEmpty =
    sending &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
      >
        {messages.length === 0 && (
          <AgentBubble>
            <p>{welcome}</p>
          </AgentBubble>
        )}
        {messages.map((m) =>
          m.role === "assistant" ? (
            <AgentBubble key={m.id}>
              {m.content || <TypingDots />}
            </AgentBubble>
          ) : (
            <UserBubble key={m.id}>{m.content}</UserBubble>
          )
        )}
        {lastAssistantEmpty && null /* dots shown inside bubble above */}
        {error && (
          <div className="rounded-md border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-200 dark:border-zinc-800 p-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={
              sending
                ? "Mentor is typing…"
                : "Reply to the mentor — Enter to send, Shift+Enter for a new line"
            }
            disabled={sending}
            className="flex-1 resize-none rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="h-9 px-3 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-40 hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[92%]">
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
        Mentor
      </div>
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-auto max-w-[92%]">
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1 text-right">
        You
      </div>
      <div className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm text-white dark:text-zinc-900 leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse [animation-delay:200ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse [animation-delay:400ms]" />
    </span>
  );
}

function getWelcome(phase: string): string {
  switch (phase) {
    case "refine":
      return "Your content is in place. Now I'll help tighten the language — verbs, concision, structure — so each bullet reads like it belongs on a strong CV.";
    case "polish":
      return "Nearly there. I'll check the overall length and formatting, and we'll tidy up anything that feels crowded or sparse before you export.";
    case "define":
    default:
      return "Your CV is loaded on the right. Tell me when you're ready and I'll walk you through each section — asking a few quick questions to fill gaps and sharpen what's there. We'll start with your most recent role.";
  }
}
