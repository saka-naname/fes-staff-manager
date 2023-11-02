import { confirm } from "@inquirer/prompts";
import { PrismaClient } from "@prisma/client";
import ora from "ora";

console.log("This script will clear a members' in/out history.");
console.log(
  'If this script is executed, all members\' status will be set to "Exited".',
);
if (await confirm({ message: "Are you sure?", default: false })) {
  console.log("OK!");
} else {
  console.log("Cancelled.");
  process.exit();
}

const prisma = new PrismaClient();
const spinner = ora();

spinner.start("Clearing status records");
await prisma.status.deleteMany();
spinner.succeed("Completed!");
