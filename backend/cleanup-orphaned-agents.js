// Cleanup script to remove orphaned agents that don't have corresponding extensions
require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('./models/agent');
const Extension = require('./models/extension');

async function cleanupOrphanedAgents() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    // Get all valid extensions
    const extensions = await Extension.find({}, { userExtension: 1 }).lean();
    const validExtensions = new Set(extensions.map(ext => ext.userExtension));
    
    console.log(`📋 Valid Extensions (${validExtensions.size}):`);
    validExtensions.forEach(ext => console.log(`   - ${ext}`));
    console.log('');

    // Get all agents
    const agents = await Agent.find({}).lean();
    console.log(`📋 Total Agents in Database: ${agents.length}`);
    
    // Find orphaned agents (agents without corresponding extensions)
    const orphanedAgents = agents.filter(agent => !validExtensions.has(agent.username));
    
    if (orphanedAgents.length === 0) {
      console.log('✅ No orphaned agents found. Database is clean!\n');
    } else {
      console.log(`\n⚠️  Found ${orphanedAgents.length} orphaned agents:\n`);
      orphanedAgents.forEach(agent => {
        console.log(`   - ${agent.username} (${agent.name || 'No name'})`);
      });
      
      console.log('\n🗑️  Removing orphaned agents...');
      
      const result = await Agent.deleteMany({
        username: { $nin: Array.from(validExtensions) }
      });
      
      console.log(`✅ Removed ${result.deletedCount} orphaned agents\n`);
    }
    
    // Show final count
    const remainingAgents = await Agent.countDocuments();
    console.log(`📊 Final Agent Count: ${remainingAgents}`);
    console.log(`📊 Extension Count: ${validExtensions.size}`);
    
    if (remainingAgents === validExtensions.size) {
      console.log('✅ Database is now synchronized!\n');
    } else {
      console.log(`⚠️  Mismatch: ${remainingAgents} agents vs ${validExtensions.size} extensions\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanupOrphanedAgents();
