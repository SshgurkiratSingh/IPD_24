import React from 'react';
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestedQuestions from "./SuggestedQuestions";
import VoiceModeOverlay from "./VoiceModeOverlay";
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatContainerProps {
  chatHistory: ChatMessageType[];
  userInput: string;
  isLoading: boolean;
  isVoiceMode: boolean;
  liveTranscript: string;
  randomQuestions: string[];
  onUserInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onVoiceModeStart: () => void;
  onVoiceModeEnd: () => void;
  onClearChat: () => void;
  onSuggestedQuestionClick: (question: string) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  chatHistory,
  userInput,
  isLoading,
  isVoiceMode,
  liveTranscript,
  randomQuestions,
  onUserInput,
  onSubmit,
  onVoiceModeStart,
  onVoiceModeEnd,
  onClearChat,
  onSuggestedQuestionClick,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="w-full flex flex-col">
      <Card className="flex flex-col flex-1 p-4 text-white">
        <CardHeader className="flex items-center justify-between">
          <ChatHeader />
        </CardHeader>
        <Divider className="neon-divider" />
        <CardBody className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto mb-4 pr-2">
            {chatHistory.length === 0 ? (
              <div className="mt-4">
                <div className="flex flex-wrap mt-2">
                  <SuggestedQuestions
                    questions={randomQuestions}
                    onQuestionClick={onSuggestedQuestionClick}
                  />
                </div>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  onSuggestedQuestionClick={onSuggestedQuestionClick}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            userInput={userInput}
            isLoading={isLoading}
            onInputChange={onUserInput}
            onSubmit={onSubmit}
            onVoiceModeStart={onVoiceModeStart}
          />
        </CardBody>
        <CardFooter>
          <Button
            variant="shadow"
            color="secondary"
            className={`${chatHistory.length > 0 ? "" : "hidden"}`}
            onClick={onClearChat}
          >
            Clear Chat
          </Button>
        </CardFooter>
      </Card>

      {isVoiceMode && (
        <VoiceModeOverlay
          liveTranscript={liveTranscript}
          onEndConversation={onVoiceModeEnd}
        />
      )}
    </div>
  );
};

export default ChatContainer;