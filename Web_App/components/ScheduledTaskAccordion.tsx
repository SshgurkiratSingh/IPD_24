import React from 'react';
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Listbox, ListboxItem } from "@nextui-org/listbox";
import { MdSchedule } from "react-icons/md";

interface Action {
  mqttTopic: string;
  value: string;
}

interface ScheduledTask {
  taskType: string;
  time?: number;
  trigger?: {
    topic: string;
    value: string;
  };
  repeatTime?: number;
  limit?: number;
  action?: Action[];
}

interface ScheduledTaskAccordionProps {
  task: ScheduledTask;
}

const ScheduledTaskAccordion: React.FC<ScheduledTaskAccordionProps> = ({ task }) => {
  return (
    <Accordion className="mt-4">
      <AccordionItem
        title={
          <div className="flex items-center">
            <MdSchedule className="mr-2" />
            <span className="font-semibold animate-gradient-flow">Scheduled Task</span>
          </div>
        }
      >
        <div className="p-4 rounded mt-2 bg-gray-900">
          <div className="mb-2">
            <p className="text-lg font-semibold">Task Details</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <p className="font-medium">Task Type:</p>
              <p>{task.taskType}</p>
            </div>
            {task.time && (
              <div>
                <p className="font-medium">Time:</p>
                <p>{new Date(task.time * 1000).toLocaleString()}</p>
              </div>
            )}
            {task.trigger && (
              <div>
                <p className="font-medium">Trigger:</p>
                <p>Topic: {task.trigger.topic}, Value: {task.trigger.value}</p>
              </div>
            )}
            {task.repeatTime && (
              <div>
                <p className="font-medium">Repeat Every:</p>
                <p>{task.repeatTime} seconds</p>
              </div>
            )}
            {task.limit && (
              <div>
                <p className="font-medium">Limit:</p>
                <p>{task.limit === 696969 ? "Infinite" : task.limit}</p>
              </div>
            )}
            {task.action && (
              <div>
                <p className="font-medium">Actions:</p>
                <Listbox className="mt-2">
                  {task.action.map((actionItem: Action, idx: number) => (
                    <ListboxItem key={idx}>
                      <div className="flex items-center">
                        <div>
                          <p className="font-medium">Topic: {actionItem.mqttTopic}</p>
                          <p className="text-sm text-gray-400">Value: {actionItem.value}</p>
                        </div>
                      </div>
                    </ListboxItem>
                  ))}
                </Listbox>
              </div>
            )}
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default ScheduledTaskAccordion;