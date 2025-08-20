#!/usr/bin/env node

/**
 * Script to reproduce the tournament-section.jsx error
 * The error occurs when trying to access .message property on error objects
 * that don't have this property, causing unhandled errors in the console
 */

console.log("=== Reproducing Tournament Section Error ===");

// Simulate the problematic error handling patterns found in tournament-section.jsx
function simulateErrorHandling() {
  console.log("\n1. Testing unsafe error.message access (like line 107):");

  try {
    // Simulate different types of errors that might be thrown
    const errorTypes = [
      new Error("Standard error with message"),
      "String error without message property",
      null,
      undefined,
      { code: "CUSTOM_ERROR" }, // Object without message
      42, // Number
      Symbol("test"), // Symbol
    ];

    errorTypes.forEach((errorObj, index) => {
      try {
        // This simulates the problematic code pattern in the catch blocks
        console.log(`  Error ${index + 1}: Attempting to access .message property...`);
        console.log(`    Error type: ${typeof errorObj}`);
        console.log(`    Error value:`, errorObj);

        // This is the problematic line that causes unhandled errors
        const message = errorObj.message; // <-- This can throw if errorObj is not an object
        console.log(`    ✓ Message accessed safely: ${message}`);

      } catch (accessError) {
        console.log(`    ✗ Error accessing .message:`, accessError.message || accessError);
        console.log(`    This is the type of error that causes the unhandled error in the browser!`);
      }
    });
  } catch (outerError) {
    console.log("Outer catch:", outerError);
  }
}

function simulateSafeErrorHandling() {
  console.log("\n2. Testing SAFE error handling approach:");

  const errorTypes = [
    new Error("Standard error with message"),
    "String error without message property",
    null,
    undefined,
    { code: "CUSTOM_ERROR" },
    42,
    Symbol("test"),
  ];

  errorTypes.forEach((errorObj, index) => {
    try {
      console.log(`  Error ${index + 1}: Safe access to error message...`);

      // Safe approach - check if error has message property
      const message = errorObj?.message || errorObj?.toString?.() || String(errorObj) || 'Unknown error';
      console.log(`    ✓ Safe message: ${message}`);

    } catch (accessError) {
      console.log(`    ✗ Even safe access failed:`, accessError);
      // Final fallback
      console.log(`    Using ultimate fallback: "Unknown error"`);
    }
  });
}

// Run the simulation
simulateErrorHandling();
simulateSafeErrorHandling();

console.log("\n=== Analysis ===");
console.log("The error in tournament-section.jsx happens because:");
console.log("1. Catch blocks assume all caught errors have a .message property");
console.log("2. When non-Error objects are thrown/caught, accessing .message throws");
console.log("3. These thrown errors in catch blocks become unhandled errors");
console.log("4. Lines 107, 145, 174, 194, 200, 291 all have this pattern");

console.log("\n=== Solution ===");
console.log("Replace unsafe 'error.message' with safe access patterns:");
console.log("- error?.message || error?.toString?.() || String(error) || 'Unknown error'");
