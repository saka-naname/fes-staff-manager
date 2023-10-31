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
  useDisclosure,
} from "@chakra-ui/react";

import type { NextPage, GetServerSideProps } from "next";
import axios from "axios";
import { NFCDevice } from "@/lib/device";
import RCS300 from "@/lib/devices/rcs300";
import { Status, getStatusType } from "@/lib/status";
import { useEffect, useRef, useState } from "react";
import { sleep } from "@/lib/asyncUtils";
import { RadioButton } from "./radioButton";
import { SpinnerOverlay } from "./spinnerOverlay";

enum TABS_INDEX {
  Uninitialized,
  Initialized,
}

type CSRFToken = string;
type POSTStatusResponse = {
  id: number;
  memberId: number;
  status: number;
  createdAt: Date;
  member: {
    id: number;
    studentId: string;
    year: number;
    name: string;
    englishOk: boolean;
    createdAt: Date;
  };
};

const stats = [
  { name: "Entered", mainText: "入室", subText: "Enter" },
  { name: "Exited", mainText: "退室", subText: "Exit" },
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

export const StudentCardReader = ({ csrfToken }: { csrfToken: CSRFToken }) => {
  const currentMode = useRef("Entered");
  const [tabIndex, setTabIndex] = useState(TABS_INDEX.Uninitialized);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { value, getRadioProps, getRootProps } = useRadioGroup({
    defaultValue: "Entered",
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
            const studentId = result.studentCard.studentId;

            console.log(result);
            if (studentId !== prevStudentId) {
              onOpen();

              axios
                .post(
                  `/api/members/${studentId}/status`,
                  {
                    status: currentMode.current,
                  },
                  {
                    headers: {
                      "x-csrf-token": csrfToken,
                    },
                  },
                )
                .then((res) => {
                  switch (res.status) {
                    case 200: {
                      const resJson: POSTStatusResponse = res.data;
                      toast({
                        title: "学生証を読み取りました",
                        description: `${resJson.member.name} さん、${
                          currentMode.current === "Exited"
                            ? "行ってらっしゃい！"
                            : "おかえりなさい！"
                        }`,
                        status: "success",
                        position: "top",
                      });
                      break;
                    }
                    case 400: {
                      toast({
                        title: "リクエストエラーが発生しました",
                        description: res.data,
                        status: "error",
                        position: "top",
                      });
                      break;
                    }
                    case 500: {
                      toast({
                        title: "サーバーエラーが発生しました",
                        description: res.data,
                        status: "error",
                        position: "top",
                      });
                      break;
                    }
                  }
                })
                .finally(() => {
                  onClose();
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
      <SpinnerOverlay in={isOpen} />
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
