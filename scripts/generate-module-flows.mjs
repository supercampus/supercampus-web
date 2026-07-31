import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const modulesRoot = resolve("modules");

const deliveryTargetsByModule = {
  academics: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  alumni: ["flutter-student-app", "flutter-staff-app", "public-web", "web-admin"],
  analytics: ["flutter-staff-app", "web-admin", "web-staff"],
  attendance: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  communications: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin"],
  "counselling-wellness": ["flutter-student-app", "flutter-staff-app", "web-admin"],
  documents: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  "employee-self-service": ["flutter-staff-app", "web-staff", "web-admin"],
  examinations: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  "feedback-grievance": ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin"],
  fees: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  "form-builder": ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "public-web", "web-admin", "web-staff"],
  gatepass: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  hostel: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  library: ["flutter-student-app", "flutter-staff-app", "web-admin", "web-staff"],
  "no-due": ["flutter-student-app", "flutter-staff-app", "web-admin", "web-staff"],
  "parents-self-service": ["flutter-parent-app", "web-admin"],
  placement: ["flutter-student-app", "flutter-staff-app", "public-web", "web-admin", "web-staff"],
  "repairs-maintenance": ["flutter-student-app", "flutter-staff-app", "web-admin", "web-staff"],
  "roles-modules": ["web-admin"],
  "sick-room-medical-records": ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin"],
  "student-onboarding": ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin"],
  "student-self-service": ["flutter-student-app", "web-admin"],
  timetable: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  transport: ["flutter-student-app", "flutter-parent-app", "flutter-staff-app", "web-admin", "web-staff"],
  "vendor-management": ["flutter-staff-app", "web-admin", "web-staff"],
  "visitor-management": ["flutter-staff-app", "public-web", "web-admin", "web-staff"],
};

const workflowTypeByAction = [
  ["approval", /approve|approval|verify|verification|review|accepted|rejected/i],
  ["notification", /notify|notification|alert|reminder|email|sms|whatsapp/i],
  ["integration", /sync|erp|gateway|api|integration|push|export|import/i],
  ["report", /report|analytics|dashboard|insight|metric/i],
  ["delete", /delete|archive|remove/i],
  ["update", /update|replace|edit|renew|publish|assign|allocate/i],
  ["create", /create|generate|add|upload|register|submit|request/i],
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "flow";
}

function stripMarkdown(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/â€”/g, "-")
    .replace(/â€¢/g, "/")
    .replace(/â†’/g, "->")
    .replace(/Ã—/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCrud(action, details = "") {
  const text = `${action} ${details}`;
  if (/delete|remove|archive/i.test(text)) return ["delete"];
  if (/view|read|select|monitor|check|search|download|preview|track|compare/i.test(text)) return ["read"];
  if (/update|edit|replace|approve|reject|verify|assign|allocate|publish|activate|process|route|sync/i.test(text)) return ["read", "update"];
  if (/create|generate|add|upload|register|submit|request|configure|save|store|issue/i.test(text)) return ["create", "read"];
  return ["read"];
}

function inferType(action, details = "") {
  const text = `${action} ${details}`;
  return workflowTypeByAction.find(([, matcher]) => matcher.test(text))?.[0] ?? "action";
}

function parseNavigation(markdown) {
  const fenced = markdown.match(/## Module Navigation\s+```([\s\S]*?)```/i);
  const plain = markdown.match(/Module Navigation\s+([\s\S]*?)(?:Individual Workflows|Dashboard Workflow|Key Features|$)/i);
  const block = fenced?.[1] ?? plain?.[1];
  if (!block) return [];
  return block
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line.replace(/[â”‚â”œâ”€â””├─│└]/g, "")))
    .filter((line) => line && !/^dashboard$/i.test(line))
    .slice(1);
}

function parseOverview(markdown) {
  const match = markdown.match(/## Overview\s+([\s\S]*?)(?:\n---|\n## )/i);
  return match ? stripMarkdown(match[1]) : "";
}

function parseTableSteps(section) {
  const numberedRows = section
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line, index) => {
      const columns = line
        .split("|")
        .slice(1, -1)
        .map(stripMarkdown);
      const action = columns[1] || `Step ${index + 1}`;
      const details = columns[2] || "";
      return {
        id: `step-${index + 1}`,
        order: index + 1,
        title: action,
        description: details || action,
        type: inferType(action, details),
        crud: inferCrud(action, details),
      };
    });
  if (numberedRows.length) return numberedRows;

  return section
    .split(/\r?\n/)
    .filter((line) => /^\|.+\|$/.test(line) && !/^\|\s*-/.test(line) && !/\|\s*Step\s*\|/i.test(line))
    .slice(0, 30)
    .map((line, index) => {
      const columns = line
        .split("|")
        .slice(1, -1)
        .map(stripMarkdown)
        .filter(Boolean);
      const action = columns[0] || `Step ${index + 1}`;
      const details = columns.slice(1).join(" | ");
      return {
        id: `step-${index + 1}`,
        order: index + 1,
        title: action,
        description: details || action,
        type: inferType(action, details),
        crud: inferCrud(action, details),
      };
    })
    .filter((step) => !/^(metric|feature|action|module|role family|domain|scope|aspect|external type)$/i.test(step.title));
}

function parseDiagramSteps(section) {
  const fenced = [...section.matchAll(/```([\s\S]*?)```/g)].map((match) => match[1]).join("\n");
  if (!fenced) return [];
  const lines = fenced
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line.replace(/[â”‚â–¼â”œâ”€â””â”Œâ”â”´â”¬â”¼â”˜│▼├─└┌┐┴┬┼┘]/g, " ")))
    .filter((line) => line && !/^(yes|no|success|failed|eligible|not eligible)$/i.test(line));
  const seen = new Set();
  return lines
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((action, index) => ({
      id: `step-${index + 1}`,
      order: index + 1,
      title: action,
      description: action,
      type: inferType(action),
      crud: inferCrud(action),
    }));
}

function parseWorkflows(moduleKey, markdown) {
  if (moduleKey === "roles-modules") return parseRoleModuleControl(moduleKey);

  const sections = [...markdown.matchAll(/^###\s+(?:\d+\.?\s*)?(.+?)\s*$/gm)];
  const headingSections = sections.length
    ? sections
    : [...markdown.matchAll(/^##\s+(?:\d+\.?\s*)?(.+?)\s*$/gm)].filter((match) => !/overview|table of contents|module navigation|key features/i.test(match[1]));

  const parsed = headingSections.map((match, index) => {
    const title = stripMarkdown(match[1]);
    const start = match.index + match[0].length;
    const end = headingSections[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(start, end);
    const tableSteps = parseTableSteps(section);
    const steps = tableSteps.length ? tableSteps : parseDiagramSteps(section);
    return {
      id: slugify(title),
      moduleKey,
      name: title,
      summary: steps[0]?.description || title,
      steps,
    };
  }).filter((workflow) => workflow.steps.length);

  if (parsed.length) return parsed;

  const workflowBlock = markdown.match(/Individual Workflows\s+([\s\S]*?)(?:Dashboard Workflow|Key Features|$)/i)?.[1] ?? "";
  const lines = workflowBlock.split(/\r?\n/);
  const titleIndexes = lines
    .map((line, index) => ({ line: stripMarkdown(line), index }))
    .filter(({ line }) =>
      line &&
      (/^\d+\.\s+/.test(line) || (/^[A-Z][A-Z0-9 &/()-]{2,}$/.test(line) && !/^(APPROVED|REJECTED|YES|NO|SUCCESS|FAILED)$/i.test(line)))
    );

  return titleIndexes.map(({ line, index }, flowIndex) => {
    const title = stripMarkdown(line.replace(/^\d+\.\s+/, ""));
    const end = titleIndexes[flowIndex + 1]?.index ?? lines.length;
    const section = lines.slice(index + 1, end).join("\n");
    const steps = parseDiagramSteps(`\`\`\`\n${section}\n\`\`\``);
    return {
      id: slugify(title),
      moduleKey,
      name: title,
      summary: steps[0]?.description || title,
      steps,
    };
  }).filter((workflow) => workflow.steps.length);
}

function parseRoleModuleControl(moduleKey) {
  return [
    {
      id: "mcac-crud-policy",
      moduleKey,
      name: "MCAC to CRUD Policy",
      summary: "Translate View, Operate, Manage, and Admin levels into feature-level CRUD access.",
      steps: [
        {
          id: "step-1",
          order: 1,
          title: "View",
          description: "Allow read-only access to permitted module features within the user's scope.",
          type: "action",
          crud: ["read"],
        },
        {
          id: "step-2",
          order: 2,
          title: "Operate",
          description: "Allow day-to-day create, read, and update operations; approval and destructive actions stay blocked.",
          type: "update",
          crud: ["create", "read", "update"],
        },
        {
          id: "step-3",
          order: 3,
          title: "Manage",
          description: "Allow create, read, update, moderation, approvals, corrections, and operational control without module configuration.",
          type: "approval",
          crud: ["create", "read", "update"],
        },
        {
          id: "step-4",
          order: 4,
          title: "Admin",
          description: "Allow full feature administration including configuration and delete where audit policy permits it.",
          type: "delete",
          crud: ["create", "read", "update", "delete"],
        },
      ],
    },
    {
      id: "scope-resolution",
      moduleKey,
      name: "Scope Resolution",
      summary: "Apply Self, Department, Institution, or Cross-Institution scope after role and CRUD permissions are resolved.",
      steps: [
        {
          id: "step-1",
          order: 1,
          title: "Self Scope",
          description: "Students, parents, and personal staff views can access only their own or linked records.",
          type: "action",
          crud: ["read"],
        },
        {
          id: "step-2",
          order: 2,
          title: "Department Scope",
          description: "HODs, faculty, exam cell, and department coordinators operate only inside their department.",
          type: "action",
          crud: ["read", "update"],
        },
        {
          id: "step-3",
          order: 3,
          title: "Institution Scope",
          description: "Principal, registrar, finance, and admin staff operate across one college.",
          type: "action",
          crud: ["read", "update"],
        },
        {
          id: "step-4",
          order: 4,
          title: "Cross-Institution Scope",
          description: "Management views and controls permitted features across the tenant group.",
          type: "action",
          crud: ["read", "update"],
        },
      ],
    },
    {
      id: "sensitive-module-rules",
      moduleKey,
      name: "Sensitive Module Rules",
      summary: "Apply explicit restrictions for Fees, Examination, Attendance, Gate Pass, and No Due workflows.",
      steps: [
        {
          id: "step-1",
          order: 1,
          title: "Fees & Finance",
          description: "Only Finance and Management receive Admin; students and parents can view own ledger and operate payments.",
          type: "approval",
          crud: ["read", "update"],
        },
        {
          id: "step-2",
          order: 2,
          title: "Examination",
          description: "Exam Controller receives Admin; faculty can enter marks only for assigned subjects; students read published results.",
          type: "approval",
          crud: ["read", "update"],
        },
        {
          id: "step-3",
          order: 3,
          title: "Attendance",
          description: "Faculty mark class attendance, students view their own attendance, and HODs manage corrections and reports.",
          type: "update",
          crud: ["create", "read", "update"],
        },
        {
          id: "step-4",
          order: 4,
          title: "Gate Pass",
          description: "Students request gate passes, wardens approve, and security verifies at the gate.",
          type: "approval",
          crud: ["create", "read", "update"],
        },
        {
          id: "step-5",
          order: 5,
          title: "No Due",
          description: "Finance, Hostel, and Library clearance must be approved before certificate generation.",
          type: "approval",
          crud: ["read", "update"],
        },
      ],
    },
    {
      id: "cross-module-handoffs",
      moduleKey,
      name: "Cross-Module Handoffs",
      summary: "Gate critical ERP handoffs through the required module and CRUD permissions.",
      steps: [
        {
          id: "step-1",
          order: 1,
          title: "Student Onboarding to Academic Management",
          description: "Registrar Admin permission activates the student into academic records.",
          type: "integration",
          crud: ["read", "update"],
        },
        {
          id: "step-2",
          order: 2,
          title: "CRM ERP Handoff to Student Onboarding",
          description: "Finance confirms payment, then Registrar triggers onboarding.",
          type: "integration",
          crud: ["read", "update"],
        },
        {
          id: "step-3",
          order: 3,
          title: "Fees & Finance to No Due",
          description: "Finance clearance is required before No Due certificate generation.",
          type: "integration",
          crud: ["read", "update"],
        },
        {
          id: "step-4",
          order: 4,
          title: "Examination to Placement",
          description: "Exam Controller publishes results and Placement uses CGPA for eligibility.",
          type: "integration",
          crud: ["read", "update"],
        },
      ],
    },
  ];
}

async function main() {
  const moduleDirs = (await readdir(modulesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const moduleKey of moduleDirs) {
    const workflowsDir = join(modulesRoot, moduleKey, "docs", "workflows");
    if (!existsSync(workflowsDir)) continue;

    const files = (await readdir(workflowsDir)).filter((file) => file.endsWith(".md"));
    if (!files.length) continue;

    const sourceFile = files.find((file) => /Workflow|Control/i.test(file)) ?? files[0];
    const sourcePath = join(workflowsDir, sourceFile);
    const markdown = await readFile(sourcePath, "utf8");
    const flows = parseWorkflows(moduleKey, markdown);
    const navigation = parseNavigation(markdown);
    const overview = parseOverview(markdown);
    const source = relative(join(modulesRoot, moduleKey), sourcePath).replaceAll("\\", "/");
    const deliveryTargets = deliveryTargetsByModule[moduleKey] ?? ["web-admin"];
    const catalog = {
      moduleKey,
      source,
      deliveryTargets,
      overview,
      navigation,
      workflows: flows,
    };

    const content = `import type { ModuleWorkflowCatalog } from "@supercampus/contracts";

export const ${moduleKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}WorkflowCatalog = {
  moduleKey: ${JSON.stringify(catalog.moduleKey)},
  source: ${JSON.stringify(catalog.source)},
  deliveryTargets: ${JSON.stringify(catalog.deliveryTargets, null, 2)},
  overview: ${JSON.stringify(catalog.overview)},
  navigation: ${JSON.stringify(catalog.navigation, null, 2)},
  workflows: ${JSON.stringify(catalog.workflows, null, 2)},
} as const satisfies ModuleWorkflowCatalog;
`;

    await writeFile(join(modulesRoot, moduleKey, "src", "flows.ts"), content, "utf8");
    await writeFile(join(modulesRoot, moduleKey, "src", "flows.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  }
}

await main();
