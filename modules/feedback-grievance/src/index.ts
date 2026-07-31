import { defineModule } from "@supercampus/module-sdk";
import { feedbackGrievanceWorkflowCatalog } from "./flows";

export const feedbackgrievanceModule = defineModule({
  key: "feedback-grievance",
  version: "0.1.0",
  workflowCatalog: feedbackGrievanceWorkflowCatalog,
  navigation: [{
    id: "feedback-grievance",
    label: "Feedback & Grievance",
    route: "/dashboard/feedback-grievance",
    requiredPermissions: ["feedback-grievance.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("feedback-grievance"),
});

export const feedbackgrievanceCapabilities = [
  "feedback",
  "grievances",
  "routing",
  "resolution",
  "analytics",
] as const;

