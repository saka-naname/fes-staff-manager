"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { GroupList } from "./groupList";
import { GroupWithMembersWithStatuses } from "@/lib/types";

const socket = io({ autoConnect: false });

type CSRFToken = string;

export const GroupView = ({ csrfToken }: { csrfToken: CSRFToken }) => {
  const [items, setItems] = useState([] as GroupWithMembersWithStatuses[]);

  useEffect(() => {
    axios
      .get("/api/groups/latest", {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      })
      .then((res) => {
        return setItems(res.data);
      });

    axios
      .post("/api/socket", "", {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      })
      .then(() => {
        if (socket.connected) {
          return;
        }
        socket.connect();

        socket.on("connect", () => {
          console.log("WebSocket connected.");
        });
        socket.on("msg", (msg) => {
          console.log(msg);
        });
      });

    return () => {
      socket.off("connect");
      socket.off("msg");
    };
  }, []);

  return <GroupList groups={items} />;
};
