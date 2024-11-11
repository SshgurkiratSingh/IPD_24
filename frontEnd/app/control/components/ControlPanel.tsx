"use client";
import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import mainPageConfig from "@/MainPageConfigModular";
import ToggleButton from "./ToggleItem";
import RangeItem from "./RangeItem";
import GaugeItem from "./GaugeItem";

interface AreaConfig {
  type: string;
  roomName: string;
  roomId: number;
  roomTag: string;
  toggleItems?: any[];
  alertTopic?: string;
  rangeChangeableTopic?: any[];
  gaugeSensorTopics?: any[];
  backImg: string;
  additionalTopics?: string[];
}

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
                    <ToggleButton key={index} {...item} />
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
