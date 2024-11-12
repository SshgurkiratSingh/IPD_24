import React, { useState } from "react";
import { Progress } from "@nextui-org/progress";

interface GaugeItemProps {
  item: {
    topic: string;
    heading: string;
    longHeading: string;
    endMark: string;
    type: string;
  };
}

const GaugeItem: React.FC<GaugeItemProps> = ({ item }) => {
  const [value, setValue] = useState<number>(50); // Placeholder value
  
  return (
    <div className="p-2 border rounded-lg">
      <label className="block mb-2 font-medium">{item.heading}</label>
      <Progress value={value} color="primary" />
      <span className="block mt-2 text-sm">
        {value}
        {item.endMark}
      </span>
    </div>
  );
};

export default GaugeItem;