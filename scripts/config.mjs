import { checkbox } from "@inquirer/prompts";
import { PrismaClient } from "@prisma/client";
import ora from "ora";

const prisma = new PrismaClient();
const spinner = ora();

spinner.start("Loading config");
const groups = await prisma.group.findMany();
spinner.stop();

const choices = await checkbox({
  message: "Choose major groups (will be shown by default):",
  loop: false,
  choices: groups.map((group) => {
    return {
      name: group.name,
      checked: !!group.isMajor,
      value: group.id,
    };
  }),
});

spinner.start("Saving configurations");
for (let group of groups) {
  await prisma.group.update({
    where: {
      id: group.id,
    },
    data: {
      isMajor: choices.includes(group.id),
    },
  });
}
spinner.succeed("Configurations has been saved!");
