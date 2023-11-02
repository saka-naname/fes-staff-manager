import { Accordion } from "@chakra-ui/react";
import React from "react";
import { GroupAccordionItem } from "./groupAccordionItem";
import type { GroupWithMembersWithStatusesSafe, MemberSafe } from "@/lib/types";

type GroupListProps = {
  groups: GroupWithMembersWithStatusesSafe[];
};

const getUniqueMembers = (members: MemberSafe[]): MemberSafe[] => {
  const unique: MemberSafe[] = [];
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
  let index = 0;

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
              key={index++}
            />
          );
        })}
      <GroupAccordionItem
        name="その他"
        members={getUniqueMembers(
          groups
            .filter((group) => !group.isMajor)
            .flatMap((group) => {
              return group.members.filter(
                (member) =>
                  member.stats.length === 1 && member.stats[0].status === 1,
              );
            }),
        )}
        key={index++}
      />
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
        key={index++}
      />
    </Accordion>
  );
});
