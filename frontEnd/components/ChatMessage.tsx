import React from 'react';
import { motion } from "framer-motion";
import { Avatar } from "@nextui-org/avatar";
import { CiUser } from "react-icons/ci";
import { AiOutlineRobot } from "react-icons/ai";
import ReactMarkdown from "react-markdown";
import { ChatMessage as ChatMessageType } from '../types/chat';
import UpdatesAccordion from './UpdatesAccordion';
import ContextNeeded from './ContextNeeded';
import ScheduledTaskAccordion from './ScheduledTaskAccordion';
import SuggestedQuestions from './SuggestedQuestions';

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestedQuestionClick: (question: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSuggestedQuestionClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex ${
        message.type === "user" ? "justify-end" : "justify-start"
      } my-2`}
    >
      {message.type === "assistant" && (
        <Avatar
          icon={<AiOutlineRobot />}
          className="mr-2 bg-blue-600"
        />
      )}
      <div
        className={`max-w-full sm:max-w-md px-4 py-2 rounded-xl shadow ${
          message.type === "user"
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-800 text-white rounded-bl-none"
        }`}
      >
        {message.type === "user" ? (
          <p>{message.text}</p>
        ) : (
          <div>
            <ReactMarkdown>{message.data?.reply || message.text}</ReactMarkdown>
            {message.data?.update && message.data.update.length > 0 && (
              <UpdatesAccordion updates={message.data.update} />
            )}
            {message.data?.contextNeed && message.data.contextNeed.length > 0 && (
              <ContextNeeded contextNeeded={message.data.contextNeed} />
            )}
            {message.data?.scheduleTask && Object.keys(message.data.scheduleTask).length > 0 && (
              <ScheduledTaskAccordion task={message.data.scheduleTask} />
            )}
            {message.data?.suggestedQuestions && message.data.suggestedQuestions.length > 0 && (
              <SuggestedQuestions
                questions={message.data.suggestedQuestions}
                onQuestionClick={onSuggestedQuestionClick}
              />
            )}
          </div>
        )}
      </div>
      {message.type === "user" && (
        <Avatar icon={<CiUser />} className="ml-2 bg-blue-600" />
      )}
    </motion.div>
  );
};

export default ChatMessage;