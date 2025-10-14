import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Test query
    const projects = await prisma.project.findMany({ take: 1 });
    console.log('✅ Successfully queried projects:', projects);
    
    // Test create
    console.log('\n🔍 Testing log creation...');
    
    // Find or create a test project
    let project = await prisma.project.findUnique({
      where: { name: 'test-project' }
    });
    
    if (!project) {
      project = await prisma.project.create({
        data: { name: 'test-project' }
      });
      console.log('✅ Created test project:', project.id);
    } else {
      console.log('✅ Found test project:', project.id);
    }
    
    // Find or create a test function
    let func = await prisma.function.findUnique({
      where: { 
        projectId_name: {
          projectId: project.id,
          name: 'test-function'
        }
      }
    });
    
    if (!func) {
      func = await prisma.function.create({
        data: {
          name: 'test-function',
          projectId: project.id
        }
      });
      console.log('✅ Created test function:', func.id);
    } else {
      console.log('✅ Found test function:', func.id);
    }
    
    // Try to create a log
    const log = await prisma.log.create({
      data: {
        projectId: project.id,
        functionId: func.id,
        method: 'POST',
        type: 'ERROR',
        requestHeaders: { 'content-type': 'application/json' },
        requestUrl: '/test',
        responseCode: 500,
        responseSuccess: false,
        responseMessage: 'Test error',
        consoleLog: 'Test console log',
        latency: 100,
        createdAt: new Date(),
      }
    });
    
    console.log('✅ Successfully created log:', log.id);
    console.log('\n✅ ALL TESTS PASSED!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
