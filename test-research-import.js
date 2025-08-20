// Quick test to verify research system imports
try {
  console.log('Testing research system import...')
  const { createResearchSystem } = require('./dist/research/index.js')
  console.log('✅ createResearchSystem imported successfully')
  
  try {
    const system = createResearchSystem()
    console.log('✅ Research system created successfully')
    console.log('✅ Research system has research property:', !!system.research)
    console.log('✅ Research system dispose method exists:', typeof system.dispose)
    system.dispose()
  } catch (e) {
    console.log('❌ Error creating research system:', e.message)
    console.log('Stack:', e.stack)
  }
} catch (e) {
  console.log('❌ Import error:', e.message)
  console.log('Stack:', e.stack)
}