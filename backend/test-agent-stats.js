// Test script to verify agent statistics are being tracked correctly
require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('./models/agent');

async function testAgentStats() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Find all agents
    const agents = await Agent.find({});
    
    console.log('\n📊 AGENT STATISTICS REPORT\n');
    console.log('='.repeat(80));
    
    if (agents.length === 0) {
      console.log('⚠️  No agents found in database');
    } else {
      agents.forEach(agent => {
        console.log(`\n👤 Agent: ${agent.name} (${agent.username})`);
        console.log('-'.repeat(80));
        
        console.log('\n📅 TODAY\'S STATS:');
        console.log(`   Total Calls:        ${agent.totalCallsToday}`);
        console.log(`   Answered Calls:     ${agent.answeredCallsToday}`);
        console.log(`   Missed Calls:       ${agent.missedCallsToday}`);
        console.log(`   Avg Talk Time:      ${agent.averageTalkTimeToday}s`);
        console.log(`   Avg Wrap Time:      ${agent.averageWrapTimeToday}s`);
        console.log(`   Avg Hold Time:      ${agent.averageHoldTimeToday}s`);
        console.log(`   Avg Ring Time:      ${agent.averageRingTimeToday}s`);
        
        console.log('\n📈 OVERALL STATS:');
        console.log(`   Total Calls:        ${agent.totalCallsOverall}`);
        console.log(`   Answered Calls:     ${agent.answeredCallsOverall}`);
        console.log(`   Missed Calls:       ${agent.missedCallsOverall}`);
        console.log(`   Avg Talk Time:      ${agent.averageTalkTimeOverall}s`);
        console.log(`   Avg Wrap Time:      ${agent.averageWrapTimeOverall}s`);
        console.log(`   Avg Hold Time:      ${agent.averageHoldTimeOverall}s`);
        console.log(`   Avg Ring Time:      ${agent.averageRingTimeOverall}s`);
        
        // Validation
        const todayValid = agent.totalCallsToday === (agent.answeredCallsToday + agent.missedCallsToday);
        const overallValid = agent.totalCallsOverall === (agent.answeredCallsOverall + agent.missedCallsOverall);
        
        console.log('\n✅ VALIDATION:');
        console.log(`   Today:   ${todayValid ? '✅ PASS' : '❌ FAIL'} (Total = Answered + Missed)`);
        console.log(`   Overall: ${overallValid ? '✅ PASS' : '❌ FAIL'} (Total = Answered + Missed)`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Test completed successfully\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testAgentStats();
