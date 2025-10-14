import {
    getAverageLatency,
    getFunctionsWithStats,
    getLogsByProject,
    getLogsByStatusCode,
    getLogStatsByProject,
    getLogStatsByType,
    getProjectsWithStats,
    getRecentErrors
} from './queries.js';

async function runExamples() {
  console.log('🔍 Running Query Examples\n');

  try {
    // Example 1: Get all projects with stats
    console.log('1️⃣  Get all projects with statistics:');
    const projects = await getProjectsWithStats();
    console.log(JSON.stringify(projects, null, 2));
    console.log('\n---\n');

    if (projects.length > 0) {
      const firstProject = projects[0];

      // Example 2: Get logs by project (page 1, 10 items)
      console.log(`2️⃣  Get logs for project "${firstProject.name}" (page 1):`);
      const projectLogs = await getLogsByProject(firstProject.id, 1, 10);
      console.log(`Total logs: ${projectLogs.pagination.total}`);
      console.log(`Total pages: ${projectLogs.pagination.totalPages}`);
      console.log(`Showing ${projectLogs.data.length} logs`);
      console.log('\n---\n');

      // Example 3: Get functions with stats
      console.log(`3️⃣  Get functions for project "${firstProject.name}":`);
      const functions = await getFunctionsWithStats(firstProject.id);
      console.log(JSON.stringify(functions, null, 2));
      console.log('\n---\n');

      // Example 4: Get average latency for project
      console.log(`4️⃣  Get average latency for project "${firstProject.name}":"`);
      const latencyStats = await getAverageLatency(firstProject.id);
      console.log(JSON.stringify(latencyStats, null, 2));
      console.log('\n---\n');
    }

    // Example 5: Get recent errors
    console.log('5️⃣  Get 10 most recent error logs:');
    const errors = await getRecentErrors(10);
    console.log(`Found ${errors.length} error logs`);
    errors.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.project.name}/${log.function.name}] ${log.method} - ${log.responseMessage || 'No message'}`);
    });
    console.log('\n---\n');

    // Example 6: Get log statistics by type
    console.log('6️⃣  Get log statistics by type:');
    const typeStats = await getLogStatsByType();
    console.log(JSON.stringify(typeStats, null, 2));
    console.log('\n---\n');

    // Example 7: Get log statistics by project
    console.log('7️⃣  Get log statistics by project:');
    const projectStats = await getLogStatsByProject();
    console.log(JSON.stringify(projectStats, null, 2));
    console.log('\n---\n');

    // Example 8: Get logs by status code 500
    console.log('8️⃣  Get logs with HTTP status code 500:');
    const errorLogs = await getLogsByStatusCode(500, 1, 5);
    console.log(`Total: ${errorLogs.pagination.total}`);
    console.log(`Showing ${errorLogs.data.length} logs`);
    console.log('\n---\n');

    console.log('✅ Query examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples
runExamples()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
