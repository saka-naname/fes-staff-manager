"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { GroupList } from "./groupList";
import { GroupWithMembersWithStatusesSafe } from "@/lib/types";
import { SpinnerOverlay } from "./spinnerOverlay";
import { useDisclosure } from "@chakra-ui/react";

const socket = io({ autoConnect: false });

type CSRFToken = string;

const changeStatus = (
  items: GroupWithMembersWithStatusesSafe[],
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
  const [items, setItems] = useState([] as GroupWithMembersWithStatusesSafe[]);
  const changeStatusRef =
    useRef<
      (
        items: GroupWithMembersWithStatusesSafe[],
        memberId: number,
        status: number,
      ) => GroupWithMembersWithStatusesSafe[]
    >();
  const memberIdRef = useRef<number>(-1);
  const itemsRef = useRef<GroupWithMembersWithStatusesSafe[]>([]);
  const { isOpen, onClose } = useDisclosure({
    defaultIsOpen: true,
  });

  useEffect(() => {
    changeStatusRef.current = changeStatus;
  }, [changeStatus]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const enteredHandler = useCallback(() => {
    const newItems = changeStatusRef.current?.(
      itemsRef.current,
      memberIdRef.current,
      1,
    );
    setItems(newItems!);
  }, []);

  const exitedHandler = useCallback(() => {
    const newItems = changeStatusRef.current?.(
      itemsRef.current,
      memberIdRef.current,
      0,
    );
    setItems(newItems!);
  }, []);

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
          memberIdRef.current = id;
          enteredHandler();
        });
        socket.on("member_exited", (id: number) => {
          console.log(id, "exited");
          memberIdRef.current = id;
          exitedHandler();
        });
      })
      .finally(() => {
        onClose();
      });

    return () => {
      socket.off("connect");
      socket.off("msg");
      socket.off("member_entered");
      socket.off("member_exited");
    };
  }, []);

  return (
    <>
      <GroupList groups={items} />
      <SpinnerOverlay in={isOpen} />
    </>
  );
};
