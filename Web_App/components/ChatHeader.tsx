import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { CardHeader } from "@nextui-org/card";
import { AiFillHome } from "react-icons/ai";
import { BsChatDots } from "react-icons/bs";

const ChatHeader: React.FC = () => {
  return (
    <CardHeader className="text-2xl font-bold text-gray-300 neon-text">
      <Breadcrumbs>
        <BreadcrumbItem>
          <AiFillHome className="mr-1" /> <span>Home</span>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <BsChatDots className="mr-1" /> <span>Chat Assistant</span>
        </BreadcrumbItem>
      </Breadcrumbs>
    </CardHeader>
  );
};

export default ChatHeader;