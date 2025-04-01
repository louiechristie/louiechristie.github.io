import { Temporal } from 'temporal-polyfill';
import analytics from 'analytics.11ty.js';

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

  return;
  `<footer class="d-flex flex-column justify-content-center align-items-center pt-3 mt-4 border-top text-light bg-dark dark-mode">
    <p>© 2025 Louie Christie</p>
    <p>
      <a class="text-light" href="blog/about/">Handmade by Louie Christie</a>
    </p>
    <p>
      <a class="text-light" href="https://www.facebook.com/groups/2352226331/">
        Looking for a different Louie Christie?
      </a>
    </p>
    {% performance %}
    This page ${page.url} was built on {% currentBuildDate %}
    <a href="https://github.com/louiechristie/louiechristie.github.io/actions/">
      <img
        style="vertical-align: middle;"
        src="https://github.com/louiechristie/louiechristie.github.io/actions/workflows/playwright.yml/badge.svg"
        alt="Badge: Github logo, 'Playwright Tests'"
        eleventy:ignore="eleventy:ignore"/>
    </a>
  </footer>`;
}
