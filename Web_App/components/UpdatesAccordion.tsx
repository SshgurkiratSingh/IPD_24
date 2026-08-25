import React from 'react';
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Listbox, ListboxItem } from "@nextui-org/listbox";
import { MdUpdate } from "react-icons/md";

interface Update {
  topic: string;
  value: string;
}

interface UpdatesAccordionProps {
  updates: Update[];
}

const UpdatesAccordion: React.FC<UpdatesAccordionProps> = ({ updates }) => {
  return (
    <Accordion className="mt-4">
      <AccordionItem
        title={
          <div className="flex items-center gradient-text">
            <MdUpdate className="mr-2" />
            <span className="font-semibold">Updates</span>
          </div>
        }
      >
        <Listbox className="mt-2">
          {updates.map((update, idx) => (
            <ListboxItem key={idx}>
              <div className="flex items-center">
                <div>
                  <p className="font-medium">{update.topic}</p>
                  <p className="text-sm text-gray-400">Value: {update.value}</p>
                </div>
              </div>
            </ListboxItem>
          ))}
        </Listbox>
      </AccordionItem>
    </Accordion>
  );
};

export default UpdatesAccordion;