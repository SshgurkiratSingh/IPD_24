import React from "react";
import { Button } from "@nextui-org/button";

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onQuestionClick,
}) => {
  return (
    <div className="mt-4">
      <p className="font-bold text-lg">Try asking:</p>
      <div className="flex flex-wrap mt-2">
        {questions.map((question, idx) => (
          <Button
            key={idx}
            size="sm"
            variant="flat"
            className="m-1 bg-blue-600 hover:bg-blue-700  gradient-text2 border-1 border-blue-600"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
