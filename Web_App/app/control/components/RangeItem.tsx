"use client";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";
import { Card, CardHeader, CardBody, Divider } from "@nextui-org/react";
import { debounce } from "lodash";
interface FanSpeedProps {
  topic: string;
  value: number;
  lastUpdate?: Date;
  subTitle?: string;
  style?: number;
  customHeading?: string;
  customIcon?: Boolean;
  type?: string;
}

/*************  ✨ Codeium Command ⭐  *************/
/**
 * RangeItem component for rendering a UI element with a slider to control
 * a specific range value, such as fan speed or brightness. Displays an
 * icon and a heading based on the type and allows user interaction to
 * change the value.
 *
 * Props:
 * - topic: string - The MQTT topic associated with the range control.
 * - value: number - The initial value to display on the slider.
 * - lastUpdate?: Date - Optional date of the last update.
 * - subTitle?: string - Optional subtitle to display below the heading.
 * - style?: number - Optional style identifier for custom styling.
 * - customHeading?: string - Custom heading to display above the slider.
 * - customIcon?: Boolean - Flag to determine if a custom icon is used.
 * - type?: string - Type of the range control, affecting icon and behavior.
 *
 * The component debounces range changes and makes HTTP GET requests to
 * publish new values to a server. It also updates the slider state when
 * the value prop changes.
 */
/******  e51614d2-0deb-415b-9563-8fc4c6fe7a4a  *******/const RangeItem = ({
  topic,
  value,
  lastUpdate,
  subTitle,
  style,
  customHeading = "Fan Speed",
  customIcon = false,
  type,
}: FanSpeedProps) => {
  const renderIcon = () => {
    switch (type) {
      case "brightness":
        return <SunFilledIcon size={30} />;
      case "fan":
        return <MoonFilledIcon size={30} />; // Using MoonFilledIcon as a temporary fan icon
      default:
        return <SunFilledIcon size={30} />;
    }
  };
  const [fanSpeed, setFanSpeed] = useState<number>(value);

  const debouncedHandleRangeChange = useCallback(
    debounce(async (newFanSpeed: number) => {
      const encodedTopic = encodeURIComponent(topic);

      try {
        const response = await fetch(
          `/api/v1/publishData?value=${newFanSpeed}&topic=${encodedTopic}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          console.error("HTTP GET request failed");
        } else {
          console.log("HTTP GET request succeeded");
        }
      } catch (error) {
        console.error("An error occurred:", error);
      }
    }, 500), // 300ms delay
    [topic]
  );

  const handleRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newFanSpeed = parseInt(event.target.value);
    setFanSpeed(newFanSpeed);
    debouncedHandleRangeChange(newFanSpeed);
  };

  useEffect(() => {
    // Update the slider state when the 'value' prop changes
    setFanSpeed(value);
  }, [value]);

  return (
    <Card className="max-w-[400px] dark ">
      <CardHeader className="flex gap-3 dark">
        {customIcon ? <SunFilledIcon size={30} /> : renderIcon()}

        <div className="flex flex-col">
          <p className="text-md">{customHeading}</p>
          <p className="text-small text-default-500">{subTitle}</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="flex flex-col items-center justify-center">
          <div className="dda">
            <input
              type="range"
              min="0"
              max="100"
              value={fanSpeed}
              className="range"
              step="10"
              onChange={handleRangeChange}
            />
            <div className="w-full flex justify-between text-xs px-2">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default RangeItem;
