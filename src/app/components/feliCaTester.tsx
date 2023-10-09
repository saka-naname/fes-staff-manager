"use client";

import { StudentCardReader } from "@/lib/studentCardReader";
import { Button } from "@chakra-ui/react";

const reader = new StudentCardReader();

const TestButton = () => {
  return (
    <Button
      onClick={() => {
        reader.init().then((device) => {
          console.log(device.productName);
          console.log(device.vendorId);
        });
      }}
    >
      Test
    </Button>
  );
};

export default TestButton;
