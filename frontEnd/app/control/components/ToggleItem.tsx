"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { IconType } from "react-icons";
import {
  FaLightbulb,
  FaPlug,
  FaTv,
  FaDesktop,
  FaLightbulb as FaAmbientLight,
  FaPumpSoap,
} from "react-icons/fa";
interface ToggleButtonProps {
  topic: string;
  value: boolean;
  lastUpdate?: Date;
  subTitle?: string;
  style?: number;
  ambientVariant?: boolean;
  plantVersion?: boolean;
  slideVersion?: boolean;
  type: string;
}

const getIconByType = (type: string): IconType => {
  switch (type) {
    case "light":
      return FaLightbulb;
    case "switchboard":
      return FaPlug;
    case "tv":
      return FaTv;
    case "oled":
      return FaDesktop;
    case "ambientLight":
      return FaAmbientLight;
    case "pump":
      return FaPumpSoap;
    default:
      return FaLightbulb;
  }
};

const ToggleButton = ({
  topic,
  value,
  subTitle = "Light",
  ambientVariant,
  plantVersion,
  slideVersion,
  type,
}: ToggleButtonProps) => {
  const Icon = getIconByType(type);
  const [isToggled, setIsToggled] = useState(value);
  useEffect(() => {
    // Update the checkbox state when the 'value' prop changes
    setIsToggled(value);
  }, [value]);

  const handleCheckboxChangeActual = async () => {
    const invertedValue = !isToggled;
    setIsToggled(invertedValue);

    const encodedTopic = encodeURIComponent(topic);
    try {
      const response = await fetch(
        `http://192.168.1.100:2500/api/v1/publishData?value=${invertedValue}&topic=${encodedTopic}`,
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
        toast.success(`Switch toggled: ${responseData.message}`);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  // Debounce the actual function
  const handleCheckboxChange = debounce(handleCheckboxChangeActual, 200);

  if (plantVersion) {
    return (
      <div
        className="flex flex-col items-center justify-center ml-5"
        id={topic}
      >
        <div className="fx-block">
          <div className="toggle">
            <div>
              <input
                type="checkbox"
                id="toggles"
                checked={isToggled}
                onChange={handleCheckboxChange}
              />
              <div data-unchecked="On" data-checked="Off"></div>
            </div>
          </div>
        </div>

        <div className="text-sm font-bold text-gray-300">{subTitle}</div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center" id={topic}>
        <label className="switch-button" htmlFor={`switch-${topic}`}>
          <div className="switch-outer">
            <input
              id={`switch-${topic}`}
              type="checkbox"
              checked={isToggled}
              onChange={handleCheckboxChange}
            />
            <div className="button">
              <span className="button-toggle"></span>
              <span className="button-indicator"></span>
            </div>
          </div>
        </label>
        <div className="flex items-center mt-2">
          <Icon className="mr-2 text-gray-300" />
          <div className="text-sm font-bold text-gray-300">{subTitle}</div>
        </div>
      </div>
    );
  }
};

export default React.memo(ToggleButton);
