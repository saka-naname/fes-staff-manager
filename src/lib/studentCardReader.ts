'use client'

import EventEmitter from "events";

export class StudentCardReader extends EventEmitter {
  private device: USBDevice | null;

  constructor() {
    super();
    this.device = null;
  }

  public async init(): Promise<USBDevice> {
    const device = await navigator.usb.requestDevice({
      filters: [{
        "vendorId": 0x054c
      }]
    }).catch((err) => {
      console.error(err);
      throw new Error(err);
    });

    this.device = device;
    return device;
  }

  public getDevice(): USBDevice | null {
    return this.device;
  }
}
