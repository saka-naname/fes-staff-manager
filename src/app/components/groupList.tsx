import { Accordion } from "@chakra-ui/react";
import React from "react";
import { GroupAccordionItem } from "./groupAccordionItem";
import type {
  GroupWithMembersWithStatuses,
  MemberWithStatuses,
} from "@/lib/types";
import { Member } from "@prisma/client";

type GroupListProps = {
  groups: GroupWithMembersWithStatuses[];
};

const getUniqueMembers = (members: Member[]): Member[] => {
  const unique: Member[] = [];
  const ids: number[] = [];

  for (const member of members) {
    if (!ids.includes(member.id)) {
      ids.push(member.id);
      unique.push(member);
    }
  }
  return unique;
};

export const GroupList = React.memo(function GroupList(props: GroupListProps) {
  const { groups } = props;

  return (
    <Accordion allowToggle>
      {groups
        .filter((group) => group.isMajor)
        .map((group) => {
          return (
            <GroupAccordionItem
              name={group.name}
              members={group.members.filter(
                (member) =>
                  member.stats.length === 1 && member.stats[0].status === 1,
              )}
            />
          );
        })}
      <GroupAccordionItem
        name="外出中"
        members={getUniqueMembers(
          groups.flatMap((group) => {
            return group.members.filter(
              (member) =>
                member.stats.length === 0 || member.stats[0].status === 0,
            );
          }),
        )}
      />
    </Accordion>
  );
});
