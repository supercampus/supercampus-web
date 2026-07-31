$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = "E:\supercampus\supercampus-web"
$moduleRoot = Join-Path $root "modules"
$downloads = "C:\Users\vishnu\Downloads"
$standardDirs = @("components", "configuration", "dashboards", "permissions", "reports", "routes", "tests")

$map = @(
  @{ Zip = "Academic Management-20260730T183552Z-1-001.zip"; Slug = "academics"; Name = "Academic Management"; Cap = @("courses", "batches", "students", "attendance", "timetable", "academic-approvals") },
  @{ Zip = "Alumni Management-20260730T183548Z-1-001.zip"; Slug = "alumni"; Name = "Alumni Management"; Cap = @("alumni-profiles", "chapters", "events", "mentorship", "donations") },
  @{ Zip = "Analytics & BI-20260730T183546Z-1-001.zip"; Slug = "analytics"; Name = "Analytics & BI"; Cap = @("dashboards", "reports", "metrics", "exports", "insights") },
  @{ Zip = "Attendance-20260730T183544Z-1-001.zip"; Slug = "attendance"; Name = "Attendance"; Cap = @("sessions", "records", "policies", "exceptions", "reports") },
  @{ Zip = "Communication-20260730T183539Z-1-001.zip"; Slug = "communications"; Name = "Communication"; Cap = @("email", "sms", "whatsapp", "templates", "logs", "scheduler") },
  @{ Zip = "Counselling & Mental Wellness-20260730T183537Z-1-001.zip"; Slug = "counselling-wellness"; Name = "Counselling & Mental Wellness"; Cap = @("appointments", "case-notes", "wellness-screening", "referrals", "confidential-reports") },
  @{ Zip = "Document Management-20260730T183512Z-1-001.zip"; Slug = "documents"; Name = "Document Management"; Cap = @("uploads", "verification", "checklists", "requests", "letters") },
  @{ Zip = "Employee Self Service-20260730T183509Z-1-001.zip"; Slug = "employee-self-service"; Name = "Employee Self Service"; Cap = @("profile", "leave", "payroll", "documents", "requests") },
  @{ Zip = "Examination System-20260730T183502Z-1-001.zip"; Slug = "examinations"; Name = "Examination System"; Cap = @("registration", "hall-tickets", "results", "arrears", "revaluation") },
  @{ Zip = "Feedback & Grievance-20260730T183500Z-1-001.zip"; Slug = "feedback-grievance"; Name = "Feedback & Grievance"; Cap = @("feedback", "grievances", "routing", "resolution", "analytics") },
  @{ Zip = "Fees & Finance-20260730T183458Z-1-001.zip"; Slug = "fees"; Name = "Fees & Finance"; Cap = @("dues", "receipts", "concessions", "installments", "refunds", "reports") },
  @{ Zip = "Form Builder-20260730T183454Z-1-001.zip"; Slug = "form-builder"; Name = "Form Builder"; Cap = @("forms", "fields", "publishing", "approval-routing", "erp-mapping") },
  @{ Zip = "Gatepass Management-20260730T183452Z-1-001.zip"; Slug = "gatepass"; Name = "Gatepass Management"; Cap = @("requests", "approvals", "passes", "visitor-linking", "reports") },
  @{ Zip = "Hostel Management-20260730T183450Z-1-001.zip"; Slug = "hostel"; Name = "Hostel Management"; Cap = @("rooms", "allocation", "leave", "mess", "tickets", "reports") },
  @{ Zip = "Library-20260730T183448Z-1-001.zip"; Slug = "library"; Name = "Library"; Cap = @("catalog", "issue", "returns", "fines", "digital-resources") },
  @{ Zip = "No Due Management-20260730T183445Z-1-001.zip"; Slug = "no-due"; Name = "No Due Management"; Cap = @("clearance", "department-checks", "approvals", "certificates", "reports") },
  @{ Zip = "Parents Self Service-20260730T183442Z-1-001.zip"; Slug = "parents-self-service"; Name = "Parents Self Service"; Cap = @("student-profile", "fees", "attendance", "notices", "communication") },
  @{ Zip = "Placement & Career-20260730T183808Z-1-001.zip"; Slug = "placement"; Name = "Placement & Career"; Cap = @("companies", "drives", "applications", "offers", "career-services") },
  @{ Zip = "Repairs & Maintenance-20260730T183436Z-1-001.zip"; Slug = "repairs-maintenance"; Name = "Repairs & Maintenance"; Cap = @("tickets", "assets", "assignments", "vendors", "reports") },
  @{ Zip = "Roles and Modules-20260730T183432Z-1-001.zip"; Slug = "roles-modules"; Name = "Roles and Modules"; Cap = @("roles", "modules", "features", "crud-permissions", "user-assignment") },
  @{ Zip = "Sick Room & Medical Records-20260730T183426Z-1-001.zip"; Slug = "sick-room-medical-records"; Name = "Sick Room & Medical Records"; Cap = @("visits", "medical-records", "medicines", "referrals", "reports") },
  @{ Zip = "Student Onboarding-20260730T183425Z-1-001.zip"; Slug = "student-onboarding"; Name = "Student Onboarding"; Cap = @("admission-handoff", "profile-creation", "documents", "fee-start", "erp-sync") },
  @{ Zip = "Student Self Service-20260730T183421Z-1-001.zip"; Slug = "student-self-service"; Name = "Student Self Service"; Cap = @("profile", "fees", "attendance", "requests", "documents") },
  @{ Zip = "Timetable-20260730T183419Z-1-001.zip"; Slug = "timetable"; Name = "Timetable"; Cap = @("schedules", "rooms", "faculty-allocation", "substitutions", "publishing") },
  @{ Zip = "Transport Management-20260730T183417Z-1-001.zip"; Slug = "transport"; Name = "Transport Management"; Cap = @("routes", "vehicles", "allocation", "fees", "alerts", "reports") },
  @{ Zip = "Vendor Management-20260730T183415Z-1-001.zip"; Slug = "vendor-management"; Name = "Vendor Management"; Cap = @("vendors", "contracts", "purchase-requests", "compliance", "payments") },
  @{ Zip = "Visitor Management-20260730T183415Z-1-001.zip"; Slug = "visitor-management"; Name = "Visitor Management"; Cap = @("visitor-log", "appointments", "badges", "host-approval", "reports") }
)

function Write-TextFile($path, $content) {
  $dir = Split-Path -Parent $path
  if (!(Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }
  Set-Content -LiteralPath $path -Value $content -Encoding UTF8
}

foreach ($item in $map) {
  $zipPath = Join-Path $downloads $item.Zip
  if (!(Test-Path -LiteralPath $zipPath)) {
    throw "Missing zip: $zipPath"
  }

  $modulePath = Join-Path $moduleRoot $item.Slug
  $isNew = !(Test-Path -LiteralPath $modulePath)
  if ($isNew) {
    New-Item -ItemType Directory -Force -Path $modulePath | Out-Null
    foreach ($dir in $standardDirs) {
      New-Item -ItemType Directory -Force -Path (Join-Path $modulePath "src\$dir") | Out-Null
      Write-TextFile (Join-Path $modulePath "src\$dir\README.md") "# $($item.Name) $dir`n"
    }

    $permissions = @("$($item.Slug).read", "$($item.Slug).create", "$($item.Slug).update", "$($item.Slug).delete", "$($item.Slug).configure", "$($item.Slug).reports.read")
    $manifest = [ordered]@{
      '$schema' = '../../contracts/module-manifest.schema.json'
      key = $item.Slug
      name = $item.Name
      version = '0.1.0'
      frontendEntry = './src/index.ts'
      permissions = $permissions
      capabilities = $item.Cap
    } | ConvertTo-Json -Depth 6
    Write-TextFile (Join-Path $modulePath 'module.manifest.json') $manifest

    $packageJson = "{`n  `"name`": `"@supercampus/$($item.Slug)`",`n  `"version`": `"0.1.0`",`n  `"private`": true,`n  `"type`": `"module`",`n  `"exports`": `"./src/index.ts`",`n  `"dependencies`": { `"@supercampus/module-sdk`": `"*`" }`n}`n"
    Write-TextFile (Join-Path $modulePath 'package.json') $packageJson

    $varPrefix = $item.Slug.Replace('-', '')
    $capLines = ($item.Cap | ForEach-Object { "  `"$_`"," }) -join "`n"
    $indexTs = "import { defineModule } from `"@supercampus/module-sdk`";`n`nexport const $($varPrefix)Module = defineModule({`n  key: `"$($item.Slug)`",`n  version: `"0.1.0`",`n  navigation: [{`n    id: `"$($item.Slug)`",`n    label: `"$($item.Name)`",`n    route: `"/dashboard/$($item.Slug)`",`n    requiredPermissions: [`"$($item.Slug).read`"],`n  }],`n  canActivate: (context) => context.enabledModules.includes(`"$($item.Slug)`"),`n});`n`nexport const $($varPrefix)Capabilities = [`n$capLines`n] as const;`n"
    Write-TextFile (Join-Path $modulePath 'src\index.ts') $indexTs

    Write-TextFile (Join-Path $modulePath 'README.md') "# $($item.Name) frontend module`n`nThis package owns $($item.Name) navigation, permissions, runtime registration, screens, workflow documentation, and configuration adapters. Shared platform code belongs in packages.`n"
  }

  $flowDir = Join-Path $modulePath 'docs\workflows'
  New-Item -ItemType Directory -Force -Path $flowDir | Out-Null
  $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
  foreach ($entry in $archive.Entries) {
    if ([string]::IsNullOrWhiteSpace($entry.Name)) {
      continue
    }
    $dest = Join-Path $flowDir $entry.Name
    [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
  }
  $archive.Dispose()
  Write-Host "$($item.Zip) -> modules/$($item.Slug)/docs/workflows"
}

$indexRows = $map | ForEach-Object { "| $($_.Name) | ``$($_.Slug)`` | ``modules/$($_.Slug)/docs/workflows`` |" }
$indexContent = "# SuperCampus Module Workflow Map`n`nWorkflow packages imported from ``C:\Users\vishnu\Downloads`` on 2026-07-31.`n`n| Source module | Destination module | Workflow location |`n|---|---|---|`n$($indexRows -join "`n")`n"
Write-TextFile (Join-Path $moduleRoot 'WORKFLOW_MAP.md') $indexContent
