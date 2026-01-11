"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Loader } from "@/components/ai-elements/loader";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { MessageSquareIcon } from "lucide-react";
import { FormEvent, useState } from "react";

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const [inputValue, setInputValue] = useState("");

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: inputValue }],
    });
    setInputValue("");
  };

  return (
    <div className="flex h-screen flex-col">
      <Conversation>
        <ConversationContent className="max-w-4xl mx-auto w-full">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Send a message to begin chatting"
              icon={<MessageSquareIcon className="size-8" />}
            />
          ) : (
            messages.map((message) => {
              const textParts = message.parts.filter(
                (part) => part.type === "text"
              );
              const toolParts = message.parts.filter(
                (part) =>
                  part.type === "tool-call" || part.type === "tool-result"
              );

              const textContent = textParts.map((part) => part.text).join("");

              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {textContent && (
                      <MessageResponse>{textContent}</MessageResponse>
                    )}

                    {toolParts.map((part, index) => {
                      if (part.type === "tool-call") {
                        return (
                          <Tool key={`${part.toolCallId}-${index}`}>
                            <ToolHeader
                              title={part.toolName}
                              type={part.type}
                              state={part.state}
                            />
                            <ToolContent>
                              <ToolInput input={part.input} />
                              {part.result && (
                                <ToolOutput
                                  output={part.result}
                                  errorText={undefined}
                                />
                              )}
                            </ToolContent>
                          </Tool>
                        );
                      }
                      return null;
                    })}

                    {!textContent &&
                      toolParts.length === 0 &&
                      status === "streaming" &&
                      message.id === messages[messages.length - 1]?.id &&
                      message.role === "assistant" && <Loader />}
                  </MessageContent>
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto w-full">
          <PromptInput
          onSubmit={(message, event) => {
            handleFormSubmit(event);
          }}
        >
          <PromptInputTextarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
          />
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
