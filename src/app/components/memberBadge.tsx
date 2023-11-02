import { Badge } from "@chakra-ui/react";
import { Member } from "@prisma/client";

type MemberBadgeProps = {
  member: Member;
};

const colorSchemes = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
];

export const MemberBadge = (props: MemberBadgeProps) => {
  const { member } = props;

  return (
    <Badge colorScheme={colorSchemes[member.year % colorSchemes.length]}>
      {member.name}
    </Badge>
  );
};
