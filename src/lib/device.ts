import { SITIDCard } from "./studentCard";

export interface NFCDevice {
  seqNumber: number;
  endpointIn: number;
  endpointOut: number;
  send(device: USBDevice, data: number[]): Promise<USBOutTransferResult>;
  receive(device: USBDevice, len: number): Promise<number[]>;
  session(device: USBDevice): Promise<NFCDeviceSessionResult>;
}

export interface NFCDeviceSessionResult {
  success: boolean;
  idm?: string;
  studentCard?: SITIDCard;
}
