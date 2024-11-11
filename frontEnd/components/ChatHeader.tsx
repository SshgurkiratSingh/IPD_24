import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { CardHeader } from "@nextui-org/card";

const ChatHeader: React.FC = () => {
  return (
    <CardHeader className="text-2xl font-bold text-gray-300 neon-text">
      <Breadcrumbs>
        <BreadcrumbItem>
          <span>Home</span>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrent>
          <span>Chat Assistant</span>
        </BreadcrumbItem>
      </Breadcrumbs>
    </CardHeader>
  );
};

export default ChatHeader;