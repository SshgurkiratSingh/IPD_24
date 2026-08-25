import React from 'react';
import { Badge } from "@nextui-org/badge";
import { Tooltip } from "@nextui-org/tooltip";
import { BsInfoCircle } from "react-icons/bs";

interface ContextNeededProps {
  contextNeeded: string[];
}

const ContextNeeded: React.FC<ContextNeededProps> = ({ contextNeeded }) => {
  return (
    <div className="mt-4">
      <p className="font-bold flex items-center">
        Context Needed
        <Tooltip content="Additional permissions required">
          <BsInfoCircle className="ml-1 text-gray-500" />
        </Tooltip>
      </p>
      <div className="flex flex-wrap mt-2">
        {contextNeeded.map((topic, idx) => (
          <Badge
            key={idx}
            variant="flat"
            color="warning"
            className="m-1"
          >
            {topic}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ContextNeeded;