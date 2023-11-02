import { Group, Member, Status } from "@prisma/client";

type GroupWithMembers = Group & {
  members: Member[],
}

type MemberWithStatuses = Member & {
  stats: Status[],
}

type GroupWithMembersWithStatuses = Group & {
  members: MemberWithStatuses[],
}

type StatusWithMember = Status & {
  member: Member,
}

export type { GroupWithMembers, MemberWithStatuses, GroupWithMembersWithStatuses, StatusWithMember };
