import React, { useState } from "react";
import { Switch } from "@nextui-org/switch";

interface ToggleItemProps {
  item: {
    heading: string;
    topic: string;
    type: string;
    defaultState: boolean;
  };
}

const ToggleItem: React.FC<ToggleItemProps> = ({ item }) => {
  const [state, setState] = useState<boolean>(item.defaultState);

  const handleToggle = () => {
    setState(!state);
    // Add your MQTT publish logic here if needed
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded-lg">
      <span className="font-medium">{item.heading}</span>
      <Switch isSelected={state} onChange={handleToggle} />
    </div>
  );
};

export default ToggleItem;