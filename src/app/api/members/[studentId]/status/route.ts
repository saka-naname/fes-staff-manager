import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Member, Prisma } from "@prisma/client";
import { Status, getStatusType } from "@/lib/status";

type CSRFToken = string;

export async function POST(request: Request, { params, csrfToken }: { params: { studentId: string }, csrfToken: CSRFToken }) {
  let req;
  try {
    req = await request.json();
  } catch (e) {
    console.error(e);
    return new NextResponse("Bad request", {
      status: 500,
    });
  }

  const studentId = params.studentId;
  const status = getStatusType(req.status);

  if (!status) {
    return new NextResponse("Wrong status", {
      status: 400,
    });
  }

  let member: Member | null;
  try {
    member = await prisma.member.findFirst({
      where: {
        studentId: studentId
      }
    });
  } catch (e) {
    console.error(e);
    return new NextResponse("An error has occured while finding member", {
      status: 500,
    });
  }

  if (!member) {
    return new NextResponse("Member not found", {
      status: 400,
    });
  }

  let res;
  try {
    res = await prisma.status.create({
      data: {
        status: status.id,
        member: {
          connect: {
            id: member.id
          }
        }
      },
      include: {
        member: true
      }
    })
  } catch (e) {
    console.error(e);
    return new NextResponse("An error has occured while creating status record", {
      status: 500,
    });
  }

  return new NextResponse(JSON.stringify(res), {
    status: 200,
  });
}
