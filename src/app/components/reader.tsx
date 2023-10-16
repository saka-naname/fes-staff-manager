"use client";

// https://github.com/marioninc/webusb-felica/tree/gh-pages

import {
  AbsoluteCenter,
  Box,
  Button,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";

import { NFCDevice } from "@/lib/device";
import RCS300 from "@/lib/devices/rcs300";
import { useState } from "react";
import { sleep } from "@/lib/asyncUtils";

enum TABS_INDEX {
  Uninitialized,
  Initialized,
}

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

export const StudentCardReader = () => {
  const [tabIndex, setTabIndex] = useState(TABS_INDEX.Uninitialized);

  return (
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
              <Text>Initialized!</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </AbsoluteCenter>
    </Box>
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

const session = async (device: USBDevice) => {
  let nfcDevice: NFCDevice;
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
        if (result.success) {
          console.log(result);
        }
      });
      await sleep(500);
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
