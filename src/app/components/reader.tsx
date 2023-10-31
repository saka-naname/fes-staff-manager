"use client";

// https://github.com/marioninc/webusb-felica/tree/gh-pages

import {
  AbsoluteCenter,
  Box,
  Button,
  HStack,
  TabPanel,
  TabPanels,
  Tabs,
  useRadioGroup,
  createStandaloneToast,
} from "@chakra-ui/react";

import { NFCDevice } from "@/lib/device";
import RCS300 from "@/lib/devices/rcs300";
import { useEffect, useRef, useState } from "react";
import { sleep } from "@/lib/asyncUtils";
import { RadioButton } from "./radioButton";

enum TABS_INDEX {
  Uninitialized,
  Initialized,
}

const stats = [
  { name: "enter", mainText: "入室", subText: "Enter", statusId: 1 },
  { name: "exit", mainText: "退室", subText: "Exit", statusId: 0 },
];

const deviceFilters = [
  {
    vendorId: 0x054c,
    productId: 0x0dc8,
  },
  {
    vendorId: 0x054c,
    productId: 0x0dc9,
  },
];

const getNFCDeviceInstance = (productId: number): NFCDevice | null => {
  switch (productId) {
    case 0x0dc8 | 0x0dc9:
      return new RCS300();
    default:
      return null;
  }
};

const { ToastContainer, toast } = createStandaloneToast();

export const StudentCardReader = () => {
  const currentMode = useRef("enter");
  const [tabIndex, setTabIndex] = useState(TABS_INDEX.Uninitialized);
  const { value, getRadioProps, getRootProps } = useRadioGroup({
    defaultValue: "enter",
    onChange: (value) => {
      currentMode.current = value;
    },
  });

  const session = async (device: USBDevice) => {
    let nfcDevice: NFCDevice;
    let prevStudentId = "";
    try {
      const ndn = getNFCDeviceInstance(device.productId);
      if (!ndn) {
        throw new Error("不明なデバイスです");
      }
      nfcDevice = ndn;

      await device.open();
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      console.debug("selectConfiguration");
      await device.selectConfiguration(1);
      console.debug("claimInterface");
      const deviceInterface = device.configuration!.interfaces.filter(
        (v) => v.alternate.interfaceClass === 255,
      )[0];
      await device.claimInterface(deviceInterface.interfaceNumber);
      nfcDevice.endpointIn = deviceInterface.alternate.endpoints.filter(
        (e) => e.direction === "in",
      )[0].endpointNumber;
      nfcDevice.endpointOut = deviceInterface.alternate.endpoints.filter(
        (e) => e.direction === "out",
      )[0].endpointNumber;

      for (;;) {
        await nfcDevice.session(device).then((result) => {
          if (result.success && result.studentCard) {
            console.log(result);
            if (result.studentCard.studentId !== prevStudentId) {
              toast({
                title: "学生証を読み取りました",
                description: `学籍番号: ${result.studentCard.studentId}, current: ${currentMode.current}`,
                status: "success",
                position: "top",
              });
            }
            prevStudentId = result.studentCard.studentId;
          } else {
            prevStudentId = "";
          }
        });
        await sleep(250);
      }
    } catch (e) {
      console.error(e);
      try {
        device.close();
      } catch (e) {
        console.error(e);
      }
      throw e;
    }
  };

  return (
    <>
      <Box minHeight="calc(100vh)" position="relative">
        <AbsoluteCenter axis="both">
          <Tabs index={tabIndex}>
            <TabPanels>
              <TabPanel>
                <Button
                  onClick={async () => {
                    const device = await connect();
                    setTabIndex(TABS_INDEX.Initialized);
                    await session(device);
                  }}
                >
                  Connect
                </Button>
              </TabPanel>
              <TabPanel>
                <HStack {...getRootProps()}>
                  {stats.map((s) => {
                    return (
                      <RadioButton
                        key={s.name}
                        mainText={s.mainText}
                        subText={s.subText}
                        {...getRadioProps({ value: s.name })}
                      />
                    );
                  })}
                </HStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </AbsoluteCenter>
      </Box>
      <ToastContainer />
    </>
  );
};

const connect = async () => {
  let device: USBDevice;
  try {
    device = await navigator.usb.requestDevice({ filters: deviceFilters });
    console.debug(device.productName);

    return device;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
