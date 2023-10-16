// https://github.com/marioninc/webusb-felica/tree/gh-pages

import { NFCDevice, NFCDeviceSessionResult } from "../device";
import { sleep } from "../asyncUtils";
import { toHexString } from "../hexUtils";
import { SITIDCard } from "../studentCard";

export default class RCS300 implements NFCDevice {
  seqNumber = -1;
  endpointIn = -1;
  endpointOut = -1;

  public async send(device: USBDevice, data: number[]): Promise<USBOutTransferResult> {
    const retVal = await new Promise(resolve => {
      const argData = new Uint8Array(data);
      const dataLen = argData.length;
      const SLOTNUMBER = 0;
      const retVal = new Uint8Array(10 + dataLen);

      // ヘッダー
      retVal[0] = 107;
      retVal[1] = 255 & dataLen; // データ長をリトルエンディアンに変換
      retVal[2] = dataLen >> 8 & 255;
      retVal[3] = dataLen >> 16 & 255;
      retVal[4] = dataLen >> 24 & 255;
      retVal[5] = SLOTNUMBER; // タイムスロット番号
      retVal[6] = ++this.seqNumber % 256; // 認識番号

      0 != dataLen && retVal.set(argData, 10); // コマンド追加
      resolve(retVal);
    });
    const out = await device.transferOut(this.endpointOut, retVal as BufferSource);
    await sleep(50);
    return out;
  }

  public async receive(device: USBDevice, len: number): Promise<number[]> {
    const data = await device.transferIn(this.endpointIn, len);
    await sleep(10);
    const arr = [];
    if (!data.data) throw new Error("data is undefined");
    for (let i = data.data.byteOffset; i < data.data.byteLength; i++) {
      arr.push(data.data.getUint8(i));
    }
    return arr;
  }

  public async session(device: USBDevice): Promise<NFCDeviceSessionResult> {
    const len = 50;
    let idmRaw: number[];
    const idCard: SITIDCard = {
      studentId: "",
    };

    // firmware version
    await this.send(device, [0xFF, 0x56, 0x00, 0x00]);
    await this.receive(device, len);

    // endtransparent
    await this.send(device, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x82, 0x00, 0x00]);
    await this.receive(device, len);

    // starttransparent
    await this.send(device, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x81, 0x00, 0x00]);
    await this.receive(device, len);

    // rf off
    await this.send(device, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00]);
    await this.receive(device, len);

    // rf on
    await this.send(device, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x84, 0x00, 0x00]);
    await this.receive(device, len);

    // SwitchProtocolTypeF
    await this.send(device, [0xff, 0x50, 0x00, 0x02, 0x04, 0x8f, 0x02, 0x03, 0x00, 0x00]);
    await this.receive(device, len);

    // FeliCa Polling
    // await this.send(device, [0xFF, 0x50, 0x00, 0x01, 0x00, 0x00, 0x11, 0x5F, 0x46, 0x04, 0xA0, 0x86, 0x01, 0x00, 0x95, 0x82, 0x00, 0x06, 0x06, 0x00, 0xFF, 0xFF, 0x01, 0x00, 0x00, 0x00, 0x00]);
    await this.send(device, generateCommunicateThruEX([0x00, 0x82, 0x77, 0x01, 0x00]));
    const poling_res_f = await this.receive(device, len);
    if (poling_res_f.length == 46) {
      idmRaw = poling_res_f.slice(26, 34);
    } else {
      return {
        success: false,
      } as NFCDeviceSessionResult;
    }

    // Read Without Encryption(Student ID)
    await this.send(device, generateCommunicateThruEX([0x06, ...idmRaw, 0x01, 0x0B, 0x01, 0x02, 0x80, 0x00, 0x80, 0x01]));
    const read_res_sid = await this.receive(device, len);
    console.debug(read_res_sid);
    if (read_res_sid[13] === 0x90 && read_res_sid[14] === 0x00) {
      idCard.studentId = String.fromCharCode(...read_res_sid.slice(40, 47));
    } else {
      return {
        success: false,
      } as NFCDeviceSessionResult;
    }

    // Read Without Encryption(Student ID & Valid Date)
    const read_res_vld = await this.receive(device, len);
    console.debug(read_res_vld);
    if (read_res_sid[13] === 0x90 && read_res_sid[14] === 0x00) {
      const validFromStr = String.fromCharCode(...read_res_vld.slice(3, 11));
      idCard.validFrom = new Date(
        parseInt(validFromStr.substring(0, 4)),
        parseInt(validFromStr.substring(4, 6)),
        parseInt(validFromStr.substring(6, 8)),
        0,
        0,
        0
      );
      const validToStr = String.fromCharCode(...read_res_vld.slice(11, 19));
      idCard.validTo = new Date(
        parseInt(validToStr.substring(0, 4)),
        parseInt(validToStr.substring(4, 6)),
        parseInt(validToStr.substring(6, 8)),
        23,
        59,
        59
      );
    } else {
      return {
        success: false,
      } as NFCDeviceSessionResult;
    }

    // rf off
    await this.send(device, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00]);
    await this.receive(device, len);

    // endtransparent
    await this.send(device, [0xFF, 0x50, 0x00, 0x00, 0x02, 0x82, 0x00, 0x00]);
    await this.receive(device, len);

    const idm = idmRaw.map(v => toHexString(v, 2)).join(" ");
    return {
      success: true,
      idm: idm,
      studentCard: idCard,
    }
  }
}

function generateCommunicateThruEX(command: number[]) {
  const ctexDataLength = 12 + command.length;
  const cmdLength = 1 + command.length;
  const commandHeader = [
    // communicateThruEX command
    0xFF,
    0x50,
    0x00,
    0x01,
    0x00,
    // Data length
    ctexDataLength >> 8 & 255,
    255 & ctexDataLength,
  ];
  const requestHeader = [
    // const
    0x5F,
    0x46,
    0x04,
    // Timeout duration
    0xA0,
    0x86,
    0x01,
    0x00,
    // const
    0x95,
    0x82,
    // Data length
    cmdLength >> 8 & 255,
    255 & cmdLength,
  ];
  return [
    ...commandHeader,
    ...requestHeader,
    cmdLength,
    ...command,
    0x00,
    0x00,
    0x00,
  ];
}
