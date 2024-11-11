import React, { useState } from "react";
import { Slider } from "@nextui-org/slider";

interface RangeItemProps {
  item: {
    topic: string;
    heading: string;
    type: string;
    min: number;
    max: number;
    step: number;
    defaultState: number;
    endMark: string;
  };
}

const RangeItem: React.FC<RangeItemProps> = ({ item }) => {
  const [value, setValue] = useState<number>(item.defaultState);

  const handleChange = (newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setValue(newValue[0]);
    } else {
      setValue(newValue);
    }
    // Add your MQTT publish logic here if needed
  };

  return (
    <div className="p-2 border rounded-lg">
      <label className="block mb-2 font-medium">{item.heading}</label>
      <Slider
        min={item.min}
        max={item.max}
        step={item.step}
        defaultValue={value}
        onChange={handleChange}
        showMarkers
      />
      <span className="block mt-2 text-sm">
        {value}
        {item.endMark}
      </span>
    </div>
  );
};

export default RangeItem;