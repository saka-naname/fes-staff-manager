import { select, confirm } from "@inquirer/prompts";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import eaw from "eastasianwidth";
import { PrismaClient } from "@prisma/client";
import ora from "ora";

function getColumnSample(csvData, key, validated = undefined) {
  if (validated == null) {
    return arrayToSampleString(csvData.map((row) => row[key]));
  }

  return (
    visualBool(validated) +
    arrayToSampleString(
      csvData.map((row) => row[key]),
      9,
    )
  );
}

function arrayToSampleString(array, margin = 6) {
  let maxLen = process.stdout.columns - margin;
  let sampleStr = array.join(", ");
  if (sampleStr.length > maxLen)
    sampleStr = eaw.slice(sampleStr, 0, maxLen) + "...";
  return "[" + sampleStr + "]";
}

const studentIdRegExp = /^([a-zA-Z]{2}[0-9]{5})$/;
const strictStudentIdRegExp = /^([A-Z]{2}[0-9]{5})$/;
const emailRegExp = /^([a-z]{2}[0-9]{5})@shibaura-it.ac.jp$/;
const yearRegExp = /^[^a-zA-Z0-9]?([0-9]+)(th|ｔｈ|期|$)$/;
const yearZenRegExp = /^[^a-zA-Z０-９]?([０-９]+)(th|ｔｈ|期|$)$/;

function parseStudentId(str, mode) {
  switch (mode) {
    case "auto":
      if (studentIdRegExp.test(str)) {
        return parseStudentId(str, "studentid");
      } else if (emailRegExp.test(str)) {
        return parseStudentId(str, "email");
      } else {
        return parseStudentId(str, "direct");
      }
    case "studentid":
      return studentIdRegExp.test(str)
        ? str.match(studentIdRegExp)[1].toUpperCase()
        : undefined;
    case "email":
      return emailRegExp.test(str)
        ? str.match(emailRegExp)[1].toUpperCase()
        : undefined;
    case "direct":
      return str;
    default:
      return undefined;
  }
}

function parseYear(str) {
  if (yearRegExp.test(str)) return parseInt(str.match(yearRegExp)[1]);
  if (yearZenRegExp.test(str))
    return str
      .match(yearZenRegExp)[1]
      .replace(/[０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0),
      );
}

function validate(
  array = [],
  {
    patterns = [],
    rejectPatterns = [],
    unique = false,
    nonBlank = false,
    nonNull = false,
  },
) {
  if (array == []) {
    return false;
  }

  if (
    patterns.length > 0 &&
    !patterns.some((pattern) => array.every((item) => pattern.test(item)))
  ) {
    return false;
  }

  if (
    rejectPatterns.length > 0 &&
    rejectPatterns.some((pattern) => array.every((item) => pattern.test(item)))
  ) {
    return false;
  }

  if (unique) {
    let s = new Set(array);
    if (s.size !== array.length) {
      return false;
    }
  }

  if (nonBlank && array.some((item) => item === "")) {
    return false;
  }

  if (nonNull && array.some((item) => item == null)) {
    return false;
  }

  return true;
}

function visualBool(bool) {
  return bool ? "\u001b[32m✔ \u001b[0m" : "\u001b[31m✘ \u001b[0m";
}

console.log(`fes-staff-manager v${process.env.npm_package_version}`);

const csvFiles = fs
  .readdirSync("csv", { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .filter((dirent) => path.extname(dirent.name).toLowerCase() === ".csv");

const filename = await select({
  message: "Load data from:",
  choices: csvFiles.map((dirent) => {
    return {
      name: dirent.name,
      value: dirent.name,
    };
  }),
});

let csvData;
try {
  const file = fs.readFileSync(path.resolve("csv", filename), {
    encoding: "utf8",
  });
  csvData = parse(file, { columns: true });
} catch (err) {
  console.error("Failed to open file!");
  console.error(err);
  process.abort();
}

const studentIdKey = await select({
  message: "Student ID or email key:",
  choices: Object.keys(csvData[0]).map((key) => {
    return {
      name: key,
      value: key,
      description: getColumnSample(
        csvData,
        key,
        validate(
          csvData.map((row) => row[key]),
          {
            patterns: [studentIdRegExp, emailRegExp],
            nonBlank: true,
          },
        ),
      ),
    };
  }),
  loop: false,
});

const studentIdMode = await select({
  message: `Data format of ${studentIdKey}:`,
  choices: [
    {
      name: "Auto (Recommended)",
      value: "auto",
      description: (function () {
        let parsed = csvData.map((d) =>
          parseStudentId(d[studentIdKey], "auto"),
        );
        let isValid = validate(parsed, {
          patterns: [strictStudentIdRegExp],
          nonBlank: true,
        });
        return visualBool(isValid) + arrayToSampleString(parsed, 9);
      })(),
    },
    {
      name: "Student ID",
      value: "studentid",
      description: (function () {
        let parsed = csvData.map((d) =>
          parseStudentId(d[studentIdKey], "studentid"),
        );
        let isValid = validate(parsed, {
          patterns: [strictStudentIdRegExp],
          nonBlank: true,
        });
        return visualBool(isValid) + arrayToSampleString(parsed, 9);
      })(),
    },
    {
      name: "Email",
      value: "email",
      description: (function () {
        let parsed = csvData.map((d) =>
          parseStudentId(d[studentIdKey], "email"),
        );
        let isValid = validate(parsed, {
          patterns: [strictStudentIdRegExp],
          nonBlank: true,
        });
        return visualBool(isValid) + arrayToSampleString(parsed, 9);
      })(),
    },
    {
      name: "Direct (NOT recommended)",
      value: "direct",
      description: (function () {
        let parsed = csvData.map((d) =>
          parseStudentId(d[studentIdKey], "direct"),
        );
        let isValid = validate(parsed, {
          patterns: [strictStudentIdRegExp],
          nonBlank: true,
        });
        return visualBool(isValid) + arrayToSampleString(parsed, 9);
      })(),
    },
  ],
});

const yearKey = await select({
  message: "Year(th) key:",
  choices: Object.keys(csvData[0]).map((key) => {
    return {
      name: key,
      value: key,
      description: getColumnSample(
        csvData,
        key,
        validate(
          csvData.map((row) => row[key]),
          {
            patterns: [yearRegExp, yearZenRegExp],
            rejectPatterns: [studentIdRegExp],
            nonBlank: true,
          },
        ),
      ),
    };
  }),
  loop: false,
});

const nameKey = await select({
  message: "Name key:",
  choices: Object.keys(csvData[0]).map((key) => {
    return {
      name: key,
      value: key,
      description: getColumnSample(csvData, key),
    };
  }),
  loop: false,
});

const groupKey = await select({
  message: "Group key:",
  choices: Object.keys(csvData[0]).map((key) => {
    return {
      name: key,
      value: key,
      description: getColumnSample(csvData, key),
    };
  }),
  loop: false,
});

const englishOkKey = await select({
  message: "English OK key:",
  choices: Object.keys(csvData[0]).map((key) => {
    return {
      name: key,
      value: key,
      description: getColumnSample(csvData, key),
    };
  }),
  loop: false,
});

console.log("Preview:");
console.table({
  "Student ID": parseStudentId(csvData[0][studentIdKey], studentIdMode),
  "Year(th)": parseYear(csvData[0][yearKey]),
  Name: csvData[0][nameKey],
  Group: csvData[0][groupKey],
  "English OK": !!csvData[0][englishOkKey],
});

if (await confirm({ message: "Is this OK?", default: true })) {
  console.log("OK!");
} else {
  console.log("Cancelled.");
  process.exit();
}

const prisma = new PrismaClient();
const spinner = ora();

const groupsSet = new Set(
  csvData.flatMap((row) =>
    row[groupKey].split(",").map((group) => group.trim()),
  ),
);
console.log(`${groupsSet.size} groups found:`);
console.log(Array.from(groupsSet).join(", "));

spinner.start("Deleting old records");
await prisma.$transaction([
  prisma.status.deleteMany(),
  prisma.member.deleteMany(),
  prisma.group.deleteMany(),
]);
spinner.succeed();

spinner.start("Creating group table");
for (let group of groupsSet) {
  await prisma.group.create({
    data: {
      name: group,
    },
  });
}
spinner.succeed();

spinner.start("Creating member table");
for (let member of csvData) {
  let studentId = parseStudentId(member[studentIdKey], studentIdMode);
  let year = parseYear(member[yearKey]);
  let name = member[nameKey];
  let groups = {
    connect: await prisma.group.findMany({
      where: {
        OR: member[groupKey].split(",").map((group) => {
          return {
            name: group.trim(),
          };
        }),
      },
    }),
  };
  let englishOk = !!member[englishOkKey];

  await prisma.member
    .create({
      data: {
        studentId: studentId,
        year: year,
        name: name,
        groups: groups,
        englishOk: englishOk,
      },
    })
    .catch((err) => {
      if (err.code !== "P2002") {
        throw err;
      }
    })
    .then(() => {
      prisma.member.update({
        where: {
          studentId: studentId,
        },
        data: {
          year: year,
          name: name,
          groups: groups,
          englishOk: englishOk,
        },
      });
    });
}
spinner.succeed();

console.log("Done!");
