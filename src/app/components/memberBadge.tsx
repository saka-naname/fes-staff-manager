import { MemberSafe } from "@/lib/types";
import { Badge } from "@chakra-ui/react";

type MemberBadgeProps = {
  member: MemberSafe;
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
