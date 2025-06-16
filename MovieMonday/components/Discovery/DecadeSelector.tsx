// components/Discovery/DecadeSelector.tsx
import React, { useState } from "react";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Clock, ChevronDown } from "lucide-react";

const decades = [
  { id: "all", label: "All Years" },
  { id: "pre-1970", label: "Pre 1970s" },
  { id: "1970", label: "1970s" },
  { id: "1980", label: "1980s" },
  { id: "1990", label: "1990s" },
  { id: "2000", label: "2000s" },
  { id: "2010", label: "2010s" },
  { id: "2020", label: "2020s" },
];

interface DecadeSelectorProps {
  selectedDecade: string;
  onChange: (decade: string) => void;
}

const DecadeSelector: React.FC<DecadeSelectorProps> = ({
  selectedDecade,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Find the label for the selected decade
  const selectedLabel =
    decades.find((d) => d.id === selectedDecade)?.label || "All Years";

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
      <DropdownTrigger>
        <Button
          endContent={<ChevronDown className="h-4 w-4" />}
          startContent={<Clock className="h-4 w-4" />}
          variant="flat"
        >
          {selectedLabel}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Decade selection"
        selectedKeys={new Set([selectedDecade])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          if (keys instanceof Set && keys.size > 0) {
            onChange(Array.from(keys)[0].toString());
          }
        }}
      >
        {decades.map((decade) => (
          <DropdownItem key={decade.id} textValue={decade.label}>
            {decade.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default DecadeSelector;
