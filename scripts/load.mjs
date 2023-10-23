import { select, confirm } from "@inquirer/prompts";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import eaw from "eastasianwidth";

function getColumnSample(csvData, key) {
  return arrayToSampleString(csvData.map((row) => row[key]));
}

function arrayToSampleString(array) {
  let maxLen = process.stdout.columns - 6;
  let sampleStr = array.join(", ");
  if (sampleStr.length > maxLen)
    sampleStr = eaw.slice(sampleStr, 0, maxLen) + "...";
  return "[" + sampleStr + "]";
}

const studentIdRegExp = /^([a-zA-Z]{2}[0-9]{5})$/;
const emailRegExp = /^([a-z]{2}[0-9]{5})@shibaura-it.ac.jp$/;
const yearRegExp = /([0-9])/;
const yearZenRegExp = /([０－９])/;

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
  if (yearRegExp.test(str)) return parseInt(str.match(yearRegExp));
  if (yearZenRegExp.test(str))
    return str
      .match(yearZenRegExp)
      .replace(/[０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0),
      );
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
      description: getColumnSample(csvData, key),
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
      description: arrayToSampleString(
        csvData.map((d) => parseStudentId(d[studentIdKey], "auto")),
      ),
    },
    {
      name: "Student ID",
      value: "studentid",
      description: arrayToSampleString(
        csvData.map((d) => parseStudentId(d[studentIdKey], "studentid")),
      ),
    },
    {
      name: "Email",
      value: "email",
      description: arrayToSampleString(
        csvData.map((d) => parseStudentId(d[studentIdKey], "email")),
      ),
    },
    {
      name: "Direct (Not recommended)",
      value: "direct",
      description: arrayToSampleString(
        csvData.map((d) => parseStudentId(d[studentIdKey], "direct")),
      ),
    },
  ],
});

const yearKey = await select({
  message: "Year key:",
  choices: Object.keys(csvData[0]).map((key) => {
    return {
      name: key,
      value: key,
      description: getColumnSample(csvData, key),
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
  Year: csvData[0][yearKey],
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
