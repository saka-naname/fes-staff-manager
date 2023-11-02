import { Group, Status } from "@prisma/client";

type MemberSafe = {
  id: number,
  year: number,
  name: string,
  englishOk: boolean,
  createdAt: Date,
}

type GroupWithMembersSafe = Group & {
  members: MemberSafe[],
}

type MemberWithStatusesSafe = MemberSafe & {
  stats: Status[],
}

type GroupWithMembersWithStatusesSafe = Group & {
  members: MemberWithStatusesSafe[],
}

export type { MemberSafe, GroupWithMembersSafe, MemberWithStatusesSafe, GroupWithMembersWithStatusesSafe };
