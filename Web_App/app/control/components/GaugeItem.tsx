import React from "react";
import { Progress } from "@nextui-org/progress";
import { MdThermostat, MdOpacity, MdLocalGasStation, MdSensors, MdWaves } from "react-icons/md";

interface GaugeItemProps {
  item: {
    topic: string;
    heading: string;
    longHeading: string;
    endMark: string;
    type: string;
    value: number;
    min?: number;
    max?: number;
    icon?: React.ElementType;
  };
}

const GaugeItem: React.FC<GaugeItemProps> = ({ item }) => {
  const { value, min = 0, max = 100, heading, endMark, icon: Icon } = item;
  
  // Ensure the value is within the min and max range
  const clampedValue = Math.min(Math.max(value, min), max);
  
  // Calculate the percentage for the Progress component
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  return (
    <div className="p-2 border rounded-lg">
      <div className="flex items-center mb-2">
        {Icon && <Icon className="mr-2" size={24} />}
        <label className="font-medium">{heading}</label>
      </div>
      <Progress value={percentage} color="primary" />
      <span className="block mt-2 text-sm">
        {clampedValue}
        {endMark}
      </span>
    </div>
  );
};

export default GaugeItem;