const cron = require('node-cron');
const { resetDailyStats } = require('../controllers/agentControllers/callStatsController');

/**
 * Schedule daily stats reset at midnight (00:00)
 * Cron format: second minute hour day month weekday
 */
function scheduleDailyStatsReset() {
    // Run at midnight every day (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 Running daily stats reset at midnight...');
        try {
            await resetDailyStats();
            console.log('✅ Daily stats reset completed successfully');
        } catch (error) {
            console.error('❌ Error during daily stats reset:', error);
        }
    }, {
        timezone: "America/New_York" // Adjust to your timezone
    });

    console.log('✅ Daily stats reset scheduler initialized (runs at midnight)');
}

module.exports = { scheduleDailyStatsReset };
