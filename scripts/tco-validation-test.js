#!/usr/bin/env node
/**
 * TCO Baseline Calculation Validation Test Suite
 * Tests all calculations against expected values based on the Excel workbook formulas
 */

const TEST_ASSUMPTIONS = {
  deviceRefreshYears: { laptop: 3, desktop: 3, thinClient: 5 },
  deviceUnitCost: { laptop: 1200, desktop: 1100, thinClient: 600 },
  supportOps: {
    avgTicketHandlingHours: 0.5,
    deploymentHoursPerDevice: 1.5,
    blendedLaborRateHourly: 50,
    ticketsPerEndpointPerYear: 2,
  },
  licensing: { avgCostPerUserPerYear: 400, coveragePct: 1.0 },
  mgmtSecurity: { costPerEndpointPerYear: 200 },
  vdi: { platformCostPerVdiUserPerYear: 800 },
  overhead: { pctOfTotal: 0.07 },
};

function nonNeg(v) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return undefined;
  return v;
}

function calculateTCO(inputs, assumptions = TEST_ASSUMPTIONS) {
  const laptops = nonNeg(inputs.environment?.laptopCount) ?? 0;
  const desktops = nonNeg(inputs.environment?.desktopCount) ?? 0;
  const thinClients = nonNeg(inputs.environment?.thinClientCount) ?? 0;
  const userCount = nonNeg(inputs.environment?.userCount) ?? 0;
  const endpoints = laptops + desktops + thinClients;

  const vdiPctOfUsers = nonNeg(inputs.vdiDaas?.vdiPctOfUsers) ?? 0;
  const vdiPresent = inputs.vdiDaas?.vdiPresent === "yes" || vdiPctOfUsers > 0;
  const vdiUserCount = vdiPresent ? Math.round(userCount * vdiPctOfUsers / 100) : 0;

  const derivedEndUserDevices =
    (laptops * assumptions.deviceUnitCost.laptop / assumptions.deviceRefreshYears.laptop) +
    (desktops * assumptions.deviceUnitCost.desktop / assumptions.deviceRefreshYears.desktop) +
    (thinClients * assumptions.deviceUnitCost.thinClient / assumptions.deviceRefreshYears.thinClient);

  const avgRefreshYears = endpoints > 0
    ? (laptops * assumptions.deviceRefreshYears.laptop + 
       desktops * assumptions.deviceRefreshYears.desktop + 
       thinClients * assumptions.deviceRefreshYears.thinClient) / endpoints
    : assumptions.deviceRefreshYears.laptop;

  const derivedSupportOps =
    (endpoints * assumptions.supportOps.ticketsPerEndpointPerYear * 
     assumptions.supportOps.avgTicketHandlingHours * assumptions.supportOps.blendedLaborRateHourly) +
    ((endpoints / avgRefreshYears) * assumptions.supportOps.deploymentHoursPerDevice * 
     assumptions.supportOps.blendedLaborRateHourly);

  const derivedLicensing = userCount * assumptions.licensing.avgCostPerUserPerYear * assumptions.licensing.coveragePct;

  const toolSpendTotal = (inputs.toolSpendTotal ?? 0);
  const hasToolSpend = toolSpendTotal > 0;
  const derivedMgmtSecurity = hasToolSpend ? toolSpendTotal : (endpoints * assumptions.mgmtSecurity.costPerEndpointPerYear);

  const vdiPlatformSpendTotal = (inputs.vdiPlatformSpendTotal ?? 0);
  const hasVdiSpend = vdiPlatformSpendTotal > 0;
  const derivedVdiDaas = hasVdiSpend ? vdiPlatformSpendTotal : (vdiUserCount * assumptions.vdi.platformCostPerVdiUserPerYear);

  const endUserDevicesValue = nonNeg(inputs.categoryRollups?.endUserDevicesAnnual) ?? derivedEndUserDevices;
  const supportOpsValue = nonNeg(inputs.categoryRollups?.supportOpsAnnual) ?? derivedSupportOps;
  const licensingValue = nonNeg(inputs.categoryRollups?.licensingAnnual) ?? derivedLicensing;
  const mgmtSecurityValue = nonNeg(inputs.categoryRollups?.mgmtSecurityAnnual) ?? derivedMgmtSecurity;
  const vdiDaasValue = nonNeg(inputs.categoryRollups?.vdiDaasAnnual) ?? derivedVdiDaas;

  const subtotalBeforeOverhead = endUserDevicesValue + supportOpsValue + licensingValue + mgmtSecurityValue + vdiDaasValue;
  const derivedOverhead = subtotalBeforeOverhead * assumptions.overhead.pctOfTotal;
  const overheadValue = nonNeg(inputs.categoryRollups?.overheadAnnual) ?? derivedOverhead;

  const mspSpend = nonNeg(inputs.managedServices?.totalAnnualSpend) ?? 0;
  const totalAnnualTco = endUserDevicesValue + supportOpsValue + licensingValue + mgmtSecurityValue + vdiDaasValue + overheadValue + mspSpend;

  const costPerEndpoint = endpoints > 0 ? totalAnnualTco / endpoints : 0;
  const costPerUser = userCount > 0 ? totalAnnualTco / userCount : 0;
  const vdiCostPerVdiUser = vdiUserCount > 0 ? vdiDaasValue / vdiUserCount : 0;

  return {
    endpoints,
    userCount,
    vdiUserCount,
    endUserDevicesValue,
    supportOpsValue,
    licensingValue,
    mgmtSecurityValue,
    vdiDaasValue,
    overheadValue,
    mspSpend,
    totalAnnualTco,
    costPerEndpoint,
    costPerUser,
    vdiCostPerVdiUser,
  };
}

function assertApproxEqual(actual, expected, tolerance, testName) {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;
  if (passed) {
    console.log(`  ✓ ${testName}: ${actual.toFixed(2)} ≈ ${expected.toFixed(2)}`);
  } else {
    console.log(`  ✗ ${testName}: ${actual.toFixed(2)} ≠ ${expected.toFixed(2)} (diff: ${diff.toFixed(2)})`);
  }
  return passed;
}

function runTests() {
  console.log("\n========================================");
  console.log("TCO BASELINE CALCULATION VALIDATION");
  console.log("========================================\n");

  let passed = 0;
  let failed = 0;

  // TEST 1: Basic calculation with 100 laptops, 50 desktops, 20 thin clients, 150 users
  console.log("TEST 1: Basic Calculation (170 endpoints, 150 users, no VDI)");
  console.log("----------------------------------------");
  const test1 = calculateTCO({
    environment: { laptopCount: 100, desktopCount: 50, thinClientCount: 20, userCount: 150 },
    vdiDaas: { vdiPresent: "no", vdiPctOfUsers: 0 },
  });

  // End-User Devices: 100*1200/3 + 50*1100/3 + 20*600/5 = 40000 + 18333.33 + 2400 = 60733.33
  if (assertApproxEqual(test1.endUserDevicesValue, 60733.33, 1, "End-User Devices")) passed++; else failed++;
  
  // Support Ops: (170 * 2 * 0.5 * 50) + ((170/avgRefresh) * 1.5 * 50)
  // avgRefresh = (100*3 + 50*3 + 20*5) / 170 = 550/170 = 3.235
  // = 8500 + (52.53 * 1.5 * 50) = 8500 + 3939.88 = 12439.88
  if (assertApproxEqual(test1.supportOpsValue, 12439.88, 10, "Support & Ops")) passed++; else failed++;
  
  // Licensing: 150 * 400 * 1.0 = 60000
  if (assertApproxEqual(test1.licensingValue, 60000, 1, "Licensing")) passed++; else failed++;
  
  // Mgmt Security: 170 * 200 = 34000
  if (assertApproxEqual(test1.mgmtSecurityValue, 34000, 1, "Mgmt & Security")) passed++; else failed++;
  
  // VDI/DaaS: 0 (no VDI)
  if (assertApproxEqual(test1.vdiDaasValue, 0, 1, "VDI/DaaS")) passed++; else failed++;

  // Subtotal: 60733.33 + 12439.88 + 60000 + 34000 + 0 = 167173.21
  // Overhead: 167173.21 * 0.07 = 11702.12
  if (assertApproxEqual(test1.overheadValue, 11702.12, 50, "Overhead")) passed++; else failed++;

  // Total: 178875.33
  if (assertApproxEqual(test1.totalAnnualTco, 178875.33, 100, "Total Annual TCO")) passed++; else failed++;

  // Cost per Endpoint: 178875.33 / 170 = 1052.21
  if (assertApproxEqual(test1.costPerEndpoint, 1052.21, 10, "Cost per Endpoint")) passed++; else failed++;

  // Cost per User: 178875.33 / 150 = 1192.50
  if (assertApproxEqual(test1.costPerUser, 1192.50, 10, "Cost per User")) passed++; else failed++;

  // TEST 2: With VDI (30% of users)
  console.log("\nTEST 2: With VDI (30% of 150 users = 45 VDI users)");
  console.log("----------------------------------------");
  const test2 = calculateTCO({
    environment: { laptopCount: 100, desktopCount: 50, thinClientCount: 20, userCount: 150 },
    vdiDaas: { vdiPresent: "yes", vdiPctOfUsers: 30 },
  });

  // VDI/DaaS: 45 * 800 = 36000
  if (assertApproxEqual(test2.vdiDaasValue, 36000, 1, "VDI/DaaS")) passed++; else failed++;
  if (assertApproxEqual(test2.vdiUserCount, 45, 1, "VDI User Count")) passed++; else failed++;

  // VDI Cost per VDI User: 36000 / 45 = 800
  if (assertApproxEqual(test2.vdiCostPerVdiUser, 800, 1, "VDI Cost per VDI User")) passed++; else failed++;

  // TEST 3: Category Override Test
  console.log("\nTEST 3: Category Override Test");
  console.log("----------------------------------------");
  const test3 = calculateTCO({
    environment: { laptopCount: 100, desktopCount: 50, thinClientCount: 20, userCount: 150 },
    vdiDaas: { vdiPresent: "no", vdiPctOfUsers: 0 },
    categoryRollups: { endUserDevicesAnnual: 75000 },
  });

  // Should use override value instead of calculated
  if (assertApproxEqual(test3.endUserDevicesValue, 75000, 1, "Override End-User Devices")) passed++; else failed++;

  // TEST 4: Tool Spend Override Test
  console.log("\nTEST 4: Tool Spend Override Test");
  console.log("----------------------------------------");
  const test4 = calculateTCO({
    environment: { laptopCount: 100, desktopCount: 50, thinClientCount: 20, userCount: 150 },
    vdiDaas: { vdiPresent: "no", vdiPctOfUsers: 0 },
    toolSpendTotal: 25000,
  });

  // Should use tool spend instead of per-endpoint calculation
  if (assertApproxEqual(test4.mgmtSecurityValue, 25000, 1, "Tool Spend Override")) passed++; else failed++;

  // TEST 5: VDI Platform Spend Override Test
  console.log("\nTEST 5: VDI Platform Spend Override Test");
  console.log("----------------------------------------");
  const test5 = calculateTCO({
    environment: { laptopCount: 100, desktopCount: 50, thinClientCount: 20, userCount: 150 },
    vdiDaas: { vdiPresent: "yes", vdiPctOfUsers: 30 },
    vdiPlatformSpendTotal: 50000,
  });

  // Should use platform spend instead of per-user calculation
  if (assertApproxEqual(test5.vdiDaasValue, 50000, 1, "VDI Platform Spend Override")) passed++; else failed++;

  // TEST 6: MSP Spend Test
  console.log("\nTEST 6: MSP Spend Inclusion Test");
  console.log("----------------------------------------");
  const test6 = calculateTCO({
    environment: { laptopCount: 100, desktopCount: 50, thinClientCount: 20, userCount: 150 },
    vdiDaas: { vdiPresent: "no", vdiPctOfUsers: 0 },
    managedServices: { totalAnnualSpend: 100000 },
  });

  if (assertApproxEqual(test6.mspSpend, 100000, 1, "MSP Spend Captured")) passed++; else failed++;
  // Total should include MSP spend
  const expectedTotal6 = test1.totalAnnualTco + 100000;
  if (assertApproxEqual(test6.totalAnnualTco, expectedTotal6, 100, "Total includes MSP Spend")) passed++; else failed++;

  // TEST 7: Edge Case - Zero Endpoints
  console.log("\nTEST 7: Edge Case - Zero Endpoints");
  console.log("----------------------------------------");
  const test7 = calculateTCO({
    environment: { laptopCount: 0, desktopCount: 0, thinClientCount: 0, userCount: 0 },
    vdiDaas: { vdiPresent: "no", vdiPctOfUsers: 0 },
  });

  if (assertApproxEqual(test7.totalAnnualTco, 0, 1, "Zero endpoints = Zero TCO")) passed++; else failed++;
  if (assertApproxEqual(test7.costPerEndpoint, 0, 1, "Cost per endpoint = 0")) passed++; else failed++;

  // TEST 8: Only Thin Clients (different refresh cycle)
  console.log("\nTEST 8: Only Thin Clients (5-year refresh)");
  console.log("----------------------------------------");
  const test8 = calculateTCO({
    environment: { laptopCount: 0, desktopCount: 0, thinClientCount: 100, userCount: 100 },
    vdiDaas: { vdiPresent: "no", vdiPctOfUsers: 0 },
  });

  // End-User Devices: 100*600/5 = 12000
  if (assertApproxEqual(test8.endUserDevicesValue, 12000, 1, "Thin Clients Only - Devices")) passed++; else failed++;

  // Summary
  console.log("\n========================================");
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("========================================\n");

  if (failed > 0) {
    console.log("⚠️  Some tests failed. Review calculations.");
    process.exit(1);
  } else {
    console.log("✓ All tests passed! Calculations are correct.");
    process.exit(0);
  }
}

runTests();
