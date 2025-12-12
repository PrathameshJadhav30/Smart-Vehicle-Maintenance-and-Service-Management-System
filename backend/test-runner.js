#!/usr/bin/env node

/**
 * Test Runner Script
 * This script provides a convenient way to run tests for the SVMMS backend
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runTests() {
  console.log('🚀 Starting SVMMS Backend Tests...\n');
  
  try {
    // Run controller tests
    console.log('🧪 Running Controller Tests...');
    const { stdout, stderr } = await execPromise('npm run test:controllers', {
      cwd: process.cwd()
    });
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.error(stderr);
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test execution failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export default runTests;