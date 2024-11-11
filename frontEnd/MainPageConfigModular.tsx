const mainPageConfig = [
    {
      type: "area",
      roomName: "Room",
      roomId: 1,
      roomTag: "room1",
      toggleItems: [
        {
          heading: "Lights",
          topic: "room/light",
          type: "light",
          defaultState: false,
        },
        {
          heading: "Switchboard",
          topic: "room/switchboard",
          type: "switchboard",
          defaultState: false,
        },
      ],
      alertTopic: "room/alert",
      rangeChangeableTopic: [
        {
          topic: "room/brightness",
          heading: "Brightness",
          type: "brightness",
          min: 0,
          max: 100,
          step: 10,
          defaultState: 0,
          endMark: "%",
        },
        {
          topic: "room/fan",
          heading: "Fan Speed",
          type: "fan",
          min: 0,
          max: 100,
          step: 10,
          defaultState: 0,
          endMark: "%",
        },
      ],
      gaugeSensorTopics: [
        {
          topic: "room/temperature",
          heading: "Temperature",
          longHeading: "Room 1 Temperature", // Changed from LongHeading to longHeading
          endMark: "°C",
          type: "temperature",
        },
        {
          topic: "room/humidity",
          heading: "Humidity",
          longHeading: "Room 1 Humidity", // Changed from LongHeading to longHeading
          endMark: "%",
          type: "humidity",
        },
      ],
      backImg: "/back2.webp",
    },
    {
      type: "area",
      roomName: "Hall",
      roomId: 2,
      roomTag: "hall",
      toggleItems: [
        {
          heading: "Light 1",
          topic: "hall/light1",
          type: "light",
          defaultState: false,
        },
        {
          heading: "Switchboard",
          topic: "hall/switchboard",
          type: "switchboard",
          defaultState: false,
        },
        {
          heading: "TV",
          topic: "hall/tv",
          type: "tv",
          defaultState: false,
        },
        {
          heading: "OLED",
          topic: "hall/oled",
          type: "oled",
          defaultState: false,
        },
        {
          heading: "Ambient Light",
          topic: "hall/ambientLight",
          type: "ambientLight",
          defaultState: false,
        },
      ],
      alertTopic: "hall/alert",
      rangeChangeableTopic: [
        {
          topic: "hall/brightness",
          heading: "Brightness",
          type: "brightness",
          min: 0,
          max: 100,
          step: 10,
          defaultState: 0,
          endMark: "%",
        },
        {
          topic: "hall/fan",
          heading: "Fan Speed",
          type: "fan",
          min: 0,
          max: 100,
          step: 10,
          defaultState: 0,
          endMark: "%",
        },
      ],
      gaugeSensorTopics: [
        {
          topic: "hall/temperature",
          heading: "Temperature",
          longHeading: "Hall Temperature", // Changed from LongHeading to longHeading
          endMark: "°C",
          type: "temperature",
        },
        {
          topic: "hall/humidity",
          heading: "Humidity",
          longHeading: "Hall Humidity", // Changed from LongHeading to longHeading
          endMark: "%",
          type: "humidity",
        },
        {
          topic: "hall/gas",
          heading: "Gas Level",
          longHeading: "Hall Gas Level", // Changed from LongHeading to longHeading
          endMark: "ppm",
          type: "gas",
        },
      ],
      backImg: "/hallBack.webp",
    },
    {
      type: "area",
      roomName: "Lawn",
      roomId: 3,
      roomTag: "lawn",
      toggleItems: [
        {
          heading: "Light 1",
          topic: "lawn/light1",
          type: "light",
          defaultState: false,
        },
        {
          heading: "Light 2",
          topic: "lawn/light2",
          type: "light",
          defaultState: false,
        },
        {
          heading: "Light 3",
          topic: "lawn/light3",
          type: "light",
          defaultState: false,
        },
        {
          heading: "Light 4",
          topic: "lawn/light4",
          type: "light",
          defaultState: false,
        },
      ],
      gaugeSensorTopics: [
        {
          topic: "lawn/ultrasonic1",
          heading: "Ultrasonic Sensor 1",
          longHeading: "Lawn Ultrasonic Sensor 1", // Changed from LongHeading to longHeading
          endMark: "cm",
          type: "ultrasonic",
        },
        {
          topic: "lawn/ultrasonic2",
          heading: "Ultrasonic Sensor 2",
          longHeading: "Lawn Ultrasonic Sensor 2", // Changed from LongHeading to longHeading
          endMark: "cm",
          type: "ultrasonic",
        },
      ],
      additionalTopics: ["lawn/autonomousLighting"],
      backImg: "/lawnBack.webp",
    },
    {
      type: "area",
      roomName: "Home Garden",
      roomId: 4,
      roomTag: "homeGarden",
      gaugeSensorTopics: [
        {
          topic: "homeGarden/rainSensor",
          heading: "Rain Sensor",
          longHeading: "Home Garden Rain Sensor", // Changed from LongHeading to longHeading
          endMark: "",
          type: "rain",
        },
        {
          topic: "homeGarden/soilMoisture",
          heading: "Soil Moisture",
          longHeading: "Home Garden Soil Moisture", // Changed from LongHeading to longHeading
          endMark: "%",
          type: "soilMoisture",
        },
      ],
      toggleItems: [
        {
          heading: "Pump Status",
          topic: "homeGarden/pumpStatus",
          type: "pump",
          defaultState: false,
        },
      ],
      backImg: "/homeGardenBack.webp",
    },
  ];
  
  export default mainPageConfig;
  