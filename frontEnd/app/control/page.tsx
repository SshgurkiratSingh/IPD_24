// ControlPanel.tsx
"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Switch } from "@nextui-org/switch";
import { Slider } from "@nextui-org/slider";
import { Progress } from "@nextui-org/progress";
import mainPageConfig from "@/MainPageConfigModular";

// Define TypeScript interfaces
interface ToggleItemProps {
  item: {
    heading: string;
    topic: string;
    type: string;
    defaultState: boolean;
  };
}

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

interface GaugeItemProps {
  item: {
    topic: string;
    heading: string;
    longHeading: string;
    endMark: string;
    type: string;
  };
}

interface AreaConfig {
  type: string;
  roomName: string;
  roomId: number;
  roomTag: string;
  toggleItems?: ToggleItemProps["item"][];
  alertTopic?: string;
  rangeChangeableTopic?: RangeItemProps["item"][];
  gaugeSensorTopics?: GaugeItemProps["item"][];
  backImg: string;
  additionalTopics?: string[];
}

// Update your components to use the new interfaces
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

const RangeItem: React.FC<RangeItemProps> = ({ item }) => {
  const [value, setValue] = useState<number>(item.defaultState);

  const handleChange = (newValue: number) => {
    setValue(newValue);
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

const ControlPanel: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      {mainPageConfig.map((area: AreaConfig) => (
        <Card key={area.roomId} className="mb-6">
          <CardHeader className="flex items-center gap-3">
            <h4 className="text-xl font-bold gradient-text3">
              {area.roomName}
            </h4>
          </CardHeader>
          <Divider />
          <CardBody>
            {/* Toggle Items */}
            {area.toggleItems && area.toggleItems.length > 0 && (
              <div className="mb-6">
                <h5 className="mb-4 text-lg font-semibold">Controls</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {area.toggleItems.map((item, index) => (
                    <ToggleItem key={index} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Range Changeable Topics */}
            {area.rangeChangeableTopic &&
              area.rangeChangeableTopic.length > 0 && (
                <div className="mb-6">
                  <h5 className="mb-4 text-lg font-semibold">Adjustments</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {area.rangeChangeableTopic.map((item, index) => (
                      <RangeItem key={index} item={item} />
                    ))}
                  </div>
                </div>
              )}

            {/* Gauge Sensor Topics */}
            {area.gaugeSensorTopics && area.gaugeSensorTopics.length > 0 && (
              <div className="mb-6">
                <h5 className="mb-4 text-lg font-semibold">Sensors</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {area.gaugeSensorTopics.map((item, index) => (
                    <GaugeItem key={index} item={item} />
                  ))}
                </div>
              </div>
            )}
          </CardBody>
          <Divider />
          <CardFooter>
            <span className="text-sm">Background Image: {area.backImg}</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ControlPanel;
