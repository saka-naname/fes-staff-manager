import { GroupWithMembers } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  let groups: GroupWithMembers[];
  try {
    groups = await prisma.group.findMany({
      include: {
        members: {
          orderBy: {
            year: "desc"
          }
        }
      },
      orderBy: {
        name: "asc",
      }
    });
  } catch (e) {
    console.error(e);
    return new NextResponse("An error has occured while finding groups", {
      status: 500,
    });
  }

  return new NextResponse(JSON.stringify(groups), {
    status: 200,
  });
}
