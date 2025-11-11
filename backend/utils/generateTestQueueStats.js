const QueueStatistics = require('../models/queueStatistics');
const Queue = require('../models/queue');

// Generate test queue statistics data
const generateTestQueueStats = async () => {
  try {
    console.log('🧪 Generating test queue statistics...');

    // Get existing queues or create sample ones
    let queues = await Queue.find().limit(3);
    
    if (queues.length === 0) {
      console.log('📝 No queues found, creating sample queues...');
      // Create sample queues if none exist
      const sampleQueues = [
        { queueId: 'sales_queue', name: 'Sales Queue' },
        { queueId: 'support_queue', name: 'Support Queue' },
        { queueId: 'billing_queue', name: 'Billing Queue' }
      ];
      
      for (const queueData of sampleQueues) {
        const existingQueue = await Queue.findOne({ queueId: queueData.queueId });
        if (!existingQueue) {
          await Queue.create(queueData);
        }
      }
      
      queues = await Queue.find().limit(3);
    }

    // Generate statistics for the last 7 days
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      for (const queue of queues) {
        // Check if statistics already exist for this date
        const existingStats = await QueueStatistics.findOne({
          queueId: queue.queueId,
          date: date
        });

        if (existingStats) {
          console.log(`📊 Statistics already exist for ${queue.name} on ${date.toDateString()}`);
          continue;
        }

        // Generate random but realistic statistics
        const totalCalls = Math.floor(Math.random() * 200) + 50; // 50-250 calls
        const answeredCalls = Math.floor(totalCalls * (0.7 + Math.random() * 0.25)); // 70-95% answer rate
        const abandonedCalls = Math.floor((totalCalls - answeredCalls) * (0.6 + Math.random() * 0.4)); // Some abandoned
        const missedCalls = totalCalls - answeredCalls - abandonedCalls;

        const totalWaitTime = answeredCalls * (10 + Math.random() * 50); // 10-60 seconds average
        const totalTalkTime = answeredCalls * (120 + Math.random() * 180); // 2-5 minutes average
        const averageWaitTime = totalWaitTime / Math.max(totalCalls, 1);
        const averageTalkTime = totalTalkTime / Math.max(answeredCalls, 1);

        const longestWaitTime = averageWaitTime * (2 + Math.random() * 3); // 2-5x average
        const shortestWaitTime = Math.max(1, averageWaitTime * Math.random() * 0.5); // 0-50% of average

        const serviceLevelTarget = 60; // 60 seconds
        const callsWithinServiceLevel = Math.floor(answeredCalls * (0.6 + Math.random() * 0.3)); // 60-90%
        const serviceLevelPercentage = (callsWithinServiceLevel / Math.max(totalCalls, 1)) * 100;

        // Generate hourly statistics
        const hourlyStats = new Map();
        const peakHours = [9, 10, 11, 14, 15, 16]; // Business hours
        
        for (let hour = 8; hour < 18; hour++) { // 8 AM to 6 PM
          const isPeakHour = peakHours.includes(hour);
          const hourMultiplier = isPeakHour ? (0.8 + Math.random() * 0.4) : (0.1 + Math.random() * 0.3);
          
          const hourlyCalls = Math.floor(totalCalls * hourMultiplier / 10);
          const hourlyAnswered = Math.floor(hourlyCalls * (answeredCalls / totalCalls));
          const hourlyAbandoned = Math.floor(hourlyCalls * (abandonedCalls / totalCalls));
          const hourlyWaitTime = hourlyCalls * averageWaitTime;
          const hourlyTalkTime = hourlyAnswered * averageTalkTime;

          if (hourlyCalls > 0) {
            hourlyStats.set(hour.toString(), {
              calls: hourlyCalls,
              answered: hourlyAnswered,
              abandoned: hourlyAbandoned,
              totalWaitTime: hourlyWaitTime,
              totalTalkTime: hourlyTalkTime,
              avgWaitTime: hourlyWaitTime / hourlyCalls,
              avgTalkTime: hourlyAnswered > 0 ? hourlyTalkTime / hourlyAnswered : 0
            });
          }
        }

        // Create statistics record
        const statistics = new QueueStatistics({
          queueId: queue.queueId,
          queueName: queue.name,
          date: date,
          totalCalls,
          answeredCalls,
          abandonedCalls,
          missedCalls,
          totalWaitTime,
          totalTalkTime,
          totalHoldTime: totalTalkTime * 0.1, // 10% of talk time on hold
          averageWaitTime,
          averageTalkTime,
          averageHoldTime: averageTalkTime * 0.1,
          longestWaitTime,
          shortestWaitTime,
          serviceLevelTarget,
          callsWithinServiceLevel,
          serviceLevelPercentage,
          peakWaitingCallers: Math.floor(Math.random() * 10) + 1,
          peakCallVolume: Math.max(...Array.from(hourlyStats.values()).map(h => h.calls)),
          peakCallVolumeHour: peakHours[Math.floor(Math.random() * peakHours.length)],
          dumpedCalls: Math.floor(Math.random() * 5), // 0-4 dumped calls
          totalAgentTime: 8 * 3600 * (Math.floor(Math.random() * 8) + 2), // 8 hours per agent
          agentUtilization: 60 + Math.random() * 30, // 60-90% utilization
          hourlyStats,
          firstCallResponseTime: 5 + Math.random() * 15, // 5-20 seconds
          callResolutionRate: 80 + Math.random() * 15, // 80-95%
          transferRate: Math.random() * 10, // 0-10%
          isComplete: dayOffset > 0 // Mark past days as complete
        });

        await statistics.save();
        console.log(`✅ Generated statistics for ${queue.name} on ${date.toDateString()}`);
      }
    }

    console.log('🎉 Test queue statistics generated successfully!');
    
    // Return summary
    const totalStats = await QueueStatistics.countDocuments();
    const uniqueQueues = await QueueStatistics.distinct('queueId');
    
    return {
      success: true,
      message: 'Test data generated successfully',
      totalRecords: totalStats,
      queues: uniqueQueues.length,
      queueIds: uniqueQueues
    };

  } catch (error) {
    console.error('❌ Error generating test queue statistics:', error);
    throw error;
  }
};

// Generate test data for a specific queue and date
const generateTestDataForQueue = async (queueId, queueName, date = new Date()) => {
  try {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    // Check if data already exists
    const existing = await QueueStatistics.findOne({
      queueId,
      date: queryDate
    });

    if (existing) {
      console.log(`📊 Statistics already exist for ${queueName} on ${queryDate.toDateString()}`);
      return existing;
    }

    // Generate realistic data
    const totalCalls = Math.floor(Math.random() * 100) + 20;
    const answeredCalls = Math.floor(totalCalls * (0.75 + Math.random() * 0.2));
    const abandonedCalls = Math.floor((totalCalls - answeredCalls) * 0.7);
    const missedCalls = totalCalls - answeredCalls - abandonedCalls;

    const statistics = new QueueStatistics({
      queueId,
      queueName,
      date: queryDate,
      totalCalls,
      answeredCalls,
      abandonedCalls,
      missedCalls,
      totalWaitTime: totalCalls * (15 + Math.random() * 30),
      totalTalkTime: answeredCalls * (90 + Math.random() * 120),
      averageWaitTime: 15 + Math.random() * 30,
      averageTalkTime: 90 + Math.random() * 120,
      longestWaitTime: 60 + Math.random() * 120,
      shortestWaitTime: 1 + Math.random() * 10,
      serviceLevelTarget: 60,
      callsWithinServiceLevel: Math.floor(answeredCalls * (0.7 + Math.random() * 0.25)),
      serviceLevelPercentage: 70 + Math.random() * 25,
      activeAgents: Math.floor(Math.random() * 5) + 2,
      hourlyStats: new Map() // Empty for now
    });

    await statistics.save();
    console.log(`✅ Generated test data for ${queueName} on ${queryDate.toDateString()}`);
    
    return statistics;
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  }
};

module.exports = {
  generateTestQueueStats,
  generateTestDataForQueue
};