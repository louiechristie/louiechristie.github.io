import { Temporal } from 'temporal-polyfill';

export default async function (data) {
  const humanReadableTime = (seconds) => {
    const duration = Temporal.Duration.from({ seconds });

    // More than an hour
    if (seconds >= 60 * 60) {
      const roundedDuration = duration.round({
        largestUnit: 'hours',
        smallestUnit: 'hours',
        roundingIncrement: seconds >= 60 * 60,
      });
      const hours = roundedDuration.hours;
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }

    // More than 15 minutes, 15 minute increments
    if (seconds >= 60 * 15) {
      const roundedDuration = duration.round({
        largestUnit: 'minutes',
        smallestUnit: 'minutes',
        roundingIncrement: 15,
      });
      const minutes = roundedDuration.minutes;
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    // More than 1 minutes, 1 minute increments
    if (seconds >= 60) {
      const roundedDuration = duration.round({
        largestUnit: 'minutes',
        smallestUnit: 'minutes',
        roundingIncrement: 1,
      });
      const minutes = roundedDuration.minutes;
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    // More than 15 seconds, 15 second increments
    if (seconds >= 15) {
      const roundedDuration = duration.round({
        largestUnit: 'seconds',
        smallestUnit: 'seconds',
        roundingIncrement: 15,
      });
      const secs = roundedDuration.seconds;
      return `${secs} second${secs > 1 ? 's' : ''}`;
    }

    // Less than 15 seconds
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  // Calculate one month ago
  const oneMonthAgo = today.subtract({ months: 1 });

  const startDate = oneMonthAgo;
  const endDate = 'yesterday';

  let data = await Cache(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${data.page.url}`,
    {
      duration: '1d',
      type: 'json',
    }
  );

  return `
      <div>
        <pre>${data.analytics}</pre>
        <p><img src="https://www.google.com/s2/favicons?sz=16&domain_url=https%3A%2F%2Fanalytics.google.com%2F" alt="Google Analytics Logo"> Analytics</p>
        <div>Total humans' lives squandered browsing ${
          Temporal.PlainDate.compare(
            today,
            Temporal.PlainDate.from({ year: today.year, month: 3, day: 14 })
          ) > 0
            ? '(last month)'
            : '(since 14 Feb)'
        }:</div>
         <div class="analytics-stats-container">
          <div class="analytics-stats">
              <div class="analytics-stats-key">Website:</div>
              <div class="analytics-stats-value">${humanReadableTime(
                siteEngagementTime
              )}</div>
              <div class="analytics-stats-key">Webpage ${
                data.page.url || 'url not found'
              }: </div>
              <div class="analytics-stats-value">${humanReadableTime(
                pageEngagementTime
              )}</div>
          </div>
        </div>

       <p><center>Last checked: ${endDate}</center></p>
      </div>
    `;
}
