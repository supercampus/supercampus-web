import { defineModule } from "@supercampus/module-sdk";

export const feesModule = defineModule({
  key: "fees",
  version: "0.1.0",
  navigation: [{
    id: "fees",
    label: "Fees",
    route: "/dashboard/fees",
    requiredPermissions: ["fees.read"],
  }],
  canActivate: (context) => context.enabledModules.includes("fees"),
});

export const feesCapabilities = [
  "fee-plans",
  "invoices",
  "payments",
  "refunds",
  "scholarships",
  "reports",
] as const;