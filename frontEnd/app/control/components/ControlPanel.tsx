"use client";
import React, { useCallback, useMemo } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import mainPageConfig from "@/MainPageConfigModular";
import { IconType } from "react-icons";
import ToggleButton from "./ToggleItem";
import RangeItem from "./RangeItem";
import GaugeItem from "./GaugeItem";
import useRoomData, { RoomData } from "../../hooks/useRoomData";
import {
  MdMusicNote,
  MdQueueMusic,
  MdLightbulb,
  MdDeleteOutline,
  MdWaterDrop,
} from "react-icons/md";

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
  const { roomData, isLoading, error } = useRoomData();
  const [scrollPosition, setScrollPosition] = React.useState(0);

  const getValueForTopic = useCallback(
    (topic: string): string | undefined => {
      const item = roomData.find((data: RoomData) => data.topic === topic);
      return item ? item.value : undefined;
    },
    [roomData]
  );

  // Save scroll position before update
  React.useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.pageYOffset);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll position after update
  React.useEffect(() => {
    if (!isLoading) {
      window.scrollTo(0, scrollPosition);
    }
  }, [isLoading, scrollPosition]);

  const memoizedContent = useMemo(() => {
    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error.message}</div>;
    }

    return (
      <div className="min-w-[90%]">
        <Card className="mb-6 transition-all duration-300 hover:shadow-lg gradient-bg rounded-lg overflow-hidden">
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col items-center justify-center">
                <MdQueueMusic className="text-4xl text-primary mb-2" />
                <p className="text-sm font-semibold">Artist</p>
                <p className="text-lg">
                  {getValueForTopic("c/Artist") || "N/A"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <MdMusicNote className="text-4xl text-primary mb-2" />
                <p className="text-sm font-semibold">Song</p>
                <p className="text-lg">{getValueForTopic("c/Song") || "N/A"}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <MdLightbulb
                  className={`text-4xl mb-2 ${getValueForTopic("lawn/autonomousLighting") === "1" ? "text-yellow-400" : "text-gray-400"}`}
                />
                <p className="text-sm font-semibold">Auto Lighting</p>
                <p className="text-lg">
                  {getValueForTopic("lawn/autonomousLighting") === "1"
                    ? "On"
                    : "Off"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <MdDeleteOutline
                  className={`text-4xl mb-2 ${getValueForTopic("dustbin/fullStatus") === "1" ? "text-red-500" : "text-green-500"}`}
                />
                <p className="text-sm font-semibold">Dustbin</p>
                <p className="text-lg">
                  {getValueForTopic("dustbin/fullStatus") === "1"
                    ? "Full"
                    : "Empty"}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <MdWaterDrop className="text-4xl text-blue-500 mb-2" />
                <p className="text-sm font-semibold">Water Level</p>
                <p className="text-lg">
                  {getValueForTopic("waterTank/waterLevel") || "N/A"}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainPageConfig.map((area: AreaConfig) => (
            <Card
              key={area.roomId}
              className="mb-6 transition-all duration-300 hover:shadow-lg gradient-bg rounded-lg overflow-hidden"
            >
              <CardHeader className="flex items-center gap-3">
                <h4 className="text-xl font-bold gradient-text">
                  {area.roomName}
                </h4>
              </CardHeader>
              <Divider />
              <CardBody>
                {/* Toggle Items */}
                {area.toggleItems && area.toggleItems.length > 0 && (
                  <div className="mb-6">
                    <h5 className="mb-4 text-lg font-semibold gradient-text">
                      Controls
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {area.toggleItems.map((item, index) => (
                        <ToggleButton
                          key={index}
                          topic={item.topic}
                          subTitle={item.heading}
                          value={getValueForTopic(item.topic) === "1"}
                          type={item.type}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Range Changeable Topics */}
                {area.rangeChangeableTopic &&
                  area.rangeChangeableTopic.length > 0 && (
                    <div className="mb-6">
                      <h5 className="mb-4 text-lg font-semibold gradient-text">
                        Adjustments
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {area.rangeChangeableTopic.map((item, index) => (
                          <RangeItem
                            key={index}
                            customHeading={item.heading}
                            {...item}
                            value={
                              Number(getValueForTopic(item.topic)) ||
                              item.defaultValue
                            }
                            type={item.type}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Gauge Sensor Topics */}
                {area.gaugeSensorTopics &&
                  area.gaugeSensorTopics.length > 0 && (
                    <div className="mb-6">
                      <h5 className="mb-4 text-lg font-semibold gradient-text">
                        Sensors
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {area.gaugeSensorTopics.map((item, index) => (
                          <GaugeItem
                            key={index}
                            item={{
                              ...item,
                              value: Number(getValueForTopic(item.topic)) || 0,
                              min: item.min || 0,
                              max: item.max || 100,
                              icon: item.icon as IconType,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
              </CardBody>
              <Divider />
              <CardFooter>
                {getValueForTopic(`${area.roomTag}/alert`) && (
                  <span className="text-sm">
                    {getValueForTopic(`${area.roomTag}/alert`)}
                  </span>
                )}{" "}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }, [roomData, isLoading, error, getValueForTopic]);

  return memoizedContent;
};

export default React.memo(ControlPanel);
