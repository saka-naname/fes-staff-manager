"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { GroupList } from "./groupList";
import { GroupWithMembersWithStatuses } from "@/lib/types";

const socket = io({ autoConnect: false });

type CSRFToken = string;

const changeStatus = (
  items: GroupWithMembersWithStatuses[],
  memberId: number,
  status: number,
) => {
  return items.map((group) => {
    group.members = group.members.map((member) => {
      if (member.id === memberId) {
        if (member.stats.length === 0) {
          member.stats.push({
            createdAt: new Date(),
            id: -1,
            memberId: memberId,
            status: status,
          });
        } else {
          member.stats[0].status = status;
        }
      }
      return member;
    });
    return group;
  });
};

export const GroupView = ({ csrfToken }: { csrfToken: CSRFToken }) => {
  const [items, setItems] = useState([] as GroupWithMembersWithStatuses[]);
  const [target, setTarget] = useState({
    memberId: -1,
    status: -1,
  });
  const changedStatusRef = useRef<GroupWithMembersWithStatuses[]>();

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
        socket.on("member_entered", (id: number) => {
          console.log(id, "entered");
          setTarget({ memberId: id, status: 1 });
          console.log(changedStatusRef.current);
        });
        socket.on("member_exited", (id: number) => {
          console.log(id, "exited");
          setTarget({ memberId: id, status: 0 });
          console.log(changedStatusRef.current);
        });
      });

    return () => {
      socket.off("connect");
      socket.off("msg");
      socket.off("member_entered");
      socket.off("member_exited");
    };
  }, []);

  useEffect(() => {
    changedStatusRef.current = changeStatus(
      items,
      target.memberId,
      target.status,
    );
  }, [items, target]);

  useEffect(() => {
    if (changedStatusRef.current) setItems(changedStatusRef.current);
  }, [changedStatusRef.current]);

  return <GroupList groups={items} />;
};
