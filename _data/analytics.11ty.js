import 'dotenv/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'fs';
import { Temporal } from 'temporal-polyfill';

// Get today's date
const today = Temporal.Now.plainDateISO();

// Calculate yesterday
const yesterday = today.subtract({ days: 1 });

// Calculate one month ago
const oneMonthAgo = today.subtract({ months: 1 });

const startDate = oneMonthAgo.toString();
const endDate = yesterday.toString();

// Initialize the Analytics Data client
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(
    fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
  ),
});

async function getEngagementTime() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [{ name: 'userEngagementDuration' }],
    dimensions: [{ name: 'pagePath' }],
  });

  if (response && response.rows.length > 0) {
    return response.rows[0].metricValues[0].value;
  } else {
    return 0;
  }
}

export default getEngagementTime;
