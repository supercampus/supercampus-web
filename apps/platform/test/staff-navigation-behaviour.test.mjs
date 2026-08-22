import assert from 'node:assert/strict';
import test from 'node:test';

// These tests call the access rules rather than grepping their source, so they
// fail when a real permission set stops reaching the section it needs — not
// when someone rewords a line of code.
const { canOpenStaffNavigation, availableStaffNavigation, availableErpWorkspaceTabs } = await import(
  '../src/lib/staff-access.ts'
);

/** The grants the `accountant` role actually carries on the website surface. */
const ACCOUNTANT = [
  'canteen.wallet.read',
  'canteen.wallet.top_up',
  'fees.approvals.approve',
  'fees.records.create',
  'fees.records.read',
  'tuition_fee.invoice.read',
  'vendor_management.vendors.read',
];

test('an accountant reaches the ERP section that holds the canteen console', () => {
  // The canteen wallet console is rendered under ERP, so a role that may top up
  // a wallet has to be able to open ERP. No `erp.*` permission is ever issued,
  // so gating on that prefix alone locked out every role but a wildcard admin.
  assert.equal(canOpenStaffNavigation(ACCOUNTANT, 'erp'), true);
});

test('an accountant reaches fees but not sections it has no grants for', () => {
  assert.equal(canOpenStaffNavigation(ACCOUNTANT, 'fees'), true);
  assert.equal(canOpenStaffNavigation(ACCOUNTANT, 'crm'), false);
  assert.equal(canOpenStaffNavigation(ACCOUNTANT, 'pipeline'), false);
  assert.equal(canOpenStaffNavigation(ACCOUNTANT, 'students'), false);
  assert.equal(canOpenStaffNavigation(ACCOUNTANT, 'users'), false);
});

test('a gatepass-only role reaches ERP as well', () => {
  assert.equal(canOpenStaffNavigation(['gatepass.outpass.read'], 'erp'), true);
});

test('a shop owner reaches ERP and sees only the Shops workspace', () => {
  const shopOwner = [
    'vendor_management.vendors.read',
    'vendor_management.vendors.update',
    'vendor_management.contracts.read',
  ];
  assert.equal(canOpenStaffNavigation(shopOwner, 'erp'), true);
  assert.deepEqual(availableErpWorkspaceTabs(shopOwner), ['Shops']);
});

test('ERP workspace tabs combine the granted campus-service modules', () => {
  assert.deepEqual(
    availableErpWorkspaceTabs(['canteen.orders.read', 'gatepass.outpass.read']),
    ['Shops', 'Gatepass'],
  );
});

test('a role with no campus-services grants stays out of ERP', () => {
  assert.equal(canOpenStaffNavigation(['crm.leads.read'], 'erp'), false);
});

test('a wildcard administrator reaches every section', () => {
  const everything = availableStaffNavigation(['*']);
  for (const section of ['dashboard', 'crm', 'fees', 'erp', 'users', 'settings']) {
    assert.ok(everything.includes(section), `wildcard should reach ${section}`);
  }
});

test('a role with no grants at all is left with account settings only', () => {
  assert.deepEqual(availableStaffNavigation([]), ['settings']);
});
