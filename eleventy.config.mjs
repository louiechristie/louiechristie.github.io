import {
  IdAttributePlugin,
  InputPathToUrlTransformPlugin,
  HtmlBasePlugin,
} from '@11ty/eleventy';
import { feedPlugin } from '@11ty/eleventy-plugin-rss';
import pluginSyntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import pluginNavigation from '@11ty/eleventy-navigation';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img';

import pluginFilters from './_config/filters.js';

import Cache from '@11ty/eleventy-cache-assets';
import 'dotenv/config';
import eleventyAutoCacheBuster from 'eleventy-auto-cache-buster';
import { Temporal } from 'temporal-polyfill';

const isProduction = process.env.ELEVENTY_RUN_MODE === 'build';

const baseUrl = 'https://www.louiechristie.com';

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function (eleventyConfig) {
  // Drafts, see also _data/eleventyDataSchema.js
  eleventyConfig.addPreprocessor('drafts', '*', (data, content) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === 'build') {
      return false;
    }
  });

  // Copy the contents of the `public` folder to the output folder
  // For example, `./public/css/` ends up in `_site/css/`
  eleventyConfig.addPassthroughCopy({
    './img/': '/img',
  });
  eleventyConfig.addPassthroughCopy('./feed/pretty-atom-feed.xsl');
  eleventyConfig.addPassthroughCopy('stylesheets');
  eleventyConfig.addPassthroughCopy('mstile-*.png');
  eleventyConfig.addPassthroughCopy('favicon*');
  eleventyConfig.addPassthroughCopy('android-chrome*');
  eleventyConfig.addPassthroughCopy('apple-touch-icon*');
  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('browserconfig.xml');
  eleventyConfig.addPassthroughCopy('site.webmanifest');
  eleventyConfig.addPassthroughCopy({
    '_tmp/bak/intro-to-web-dev-course': 'intro-to-web-dev-course',
  });

  // Run Eleventy when these files change:
  // https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

  // Watch images for the image pipeline.
  eleventyConfig.addWatchTarget('content/**/*.{svg,webp,png,jpg,jpeg,gif}');

  // Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
  // Adds the {% css %} paired shortcode
  eleventyConfig.addBundle('css', {
    toFileDirectory: 'dist',
  });
  // Adds the {% js %} paired shortcode
  eleventyConfig.addBundle('js', {
    toFileDirectory: 'dist',
  });

  // Official plugins
  eleventyConfig.addPlugin(pluginSyntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(HtmlBasePlugin, {
    baseHref: isProduction ? baseUrl : config.pathPrefix,
    extensions: 'html',
  });
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom', // or "rss", "json"
    outputPath: '/feed/feed.xml',
    stylesheet: 'pretty-atom-feed.xsl',
    templateData: {
      eleventyNavigation: {
        key: 'Feed',
        order: 4,
      },
    },
    collection: {
      name: 'posts',
      limit: 10,
    },
    metadata: {
      language: 'en-gb',
      title: 'Louie Christie Blog',
      subtitle:
        'Adventurous, tech geek, underground comedian in my own head. 😬',
      base: 'https://www.louiechristie.com/',
      author: {
        name: 'Louie Christie',
      },
    },
  });

  // Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    // Output formats for each image.
    formats: ['avif', 'webp', 'svg', 'auto'],
    svgShortCircuit: true,
    outputDir: '/img/',
    failOnError: true,
    transformOnRequest: false,
    widths: ['auto', 400, 800, 1200],
    failOnError: false,
    htmlOptions: {
      imgAttributes: {
        // e.g. <img loading decoding> assigned on the HTML tag will override these values.
        sizes: '(min-width: 1024em) 400px, 100vw',
        loading: 'lazy',
        decoding: 'async',
      },
    },

    sharpOptions: {
      animated: true,
    },
  });

  // Filters
  eleventyConfig.addPlugin(pluginFilters);

  eleventyConfig.addPlugin(IdAttributePlugin, {
    // by default we use Eleventy’s built-in `slugify` filter:
    // slugify: eleventyConfig.getFilter("slugify"),
    // selector: "h1,h2,h3,h4,h5,h6", // default
  });

  eleventyConfig.addPlugin(eleventyAutoCacheBuster);

  eleventyConfig.addShortcode('currentBuildDate', () => {
    return new Date().toISOString();
  });

  eleventyConfig.addGlobalData('layout', 'layouts/base.njk');

  eleventyConfig.addShortcode('performance', async function () {
    const fullUrl = `${baseUrl}${this.page.url}`;

    const params = new URLSearchParams();
    params.append('url', fullUrl);
    params.append('key', process.env.PAGESPEED_API_KEY);
    // We use the fields query string param to ask the Google API to only
    // return the data we need - a score and title for each category in the
    // Lighthouse test. Without this, the API returns a *lot* of data, which
    // isn't the end of the world but is also unnecessary.
    params.append(
      'fields',
      'lighthouseResult.categories.*.score,lighthouseResult.categories.*.title,lighthouseResult.fetchTime'
    );
    params.append('prettyPrint', false);
    // I use the mobile strategy, but `desktop` is a valid value too.
    params.append('strategy', 'mobile');
    // I've not used the PWA category, but you could if it is relevant to your site.
    params.append('category', 'PERFORMANCE');
    params.append('category', 'ACCESSIBILITY');
    params.append('category', 'BEST-PRACTICES');
    params.append('category', 'SEO');

    let data = await Cache(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
      {
        duration: '1d',
        type: 'json',
      }
    );

    const categoriesObject = data.lighthouseResult.categories;

    const getGrade = function (score) {
      if (score < 0.5) {
        return 'bad';
      }
      if (score < 0.9) {
        return 'ok';
      }
      return 'good';
    };

    const categories = Object.keys(categoriesObject).map(function (key) {
      return {
        title: categoriesObject[key].title,
        score: categoriesObject[key].score,
        percentage: (categoriesObject[key].score * 100).toFixed(),
        grade: getGrade(categoriesObject[key].score),
      };
    });

    function renderCategory(category) {
      return `
      <div class='score-container'>
        <div
          class='arc ${category.grade}'
          style="mask:
            linear-gradient(#0000 0 0) content-box intersect,
            conic-gradient(#000 ${category.score}turn, #0000 0);">
        </div>
        <div class='overlay'>
          ${category.percentage}%
        </div>
      </div>`;
    }

    return `
    <div class='lighthouse-scores'>
      <p>
        <a href="https://developers.google.com/speed/pagespeed/insights/?url=${fullUrl}">
          <img
              eleventy:ignore
              alt='Lighthouse icon'
              src='https://github.com/GoogleChrome/lighthouse/raw/refs/heads/main/assets/lh_favicon.svg'
              width='16'
              height='16'
              class="footer-icon"
            >
        </a>
        Page performance:
      </p>
      <div class='lighthouse-grid-container'>
        <div class='lighthouse-scores-grid'>
          ${categories
            .map((category) => {
              return renderCategory(category);
            })
            .join('')}

          ${categories
            .map((category) => {
              return `<div class='category-title'>${category.title}</div>`;
            })
            .join('')}    
        </div>
      </div>

      <p><center>Last checked: ${Temporal.Instant.from(
        data.lighthouseResult.fetchTime
      )
        .toZonedDateTimeISO('Europe/London')
        .toPlainDate()}
        | <a href="https://developers.google.com/speed/pagespeed/insights/?url=${fullUrl}">check</a><center></p>
    </div>
  `;
  });

  // Features to make your build faster (when you need them)

  // If your passthrough copy gets heavy and cumbersome, add this line
  // to emulate the file copy on the dev server. Learn more:
  // https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

  // eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
}

export const config = {
  // Control which files Eleventy will process
  // e.g.: *.md, *.njk, *.html, *.liquid
  templateFormats: ['11ty.js', 'md', 'njk', 'html'],

  // Pre-process *.md files with: (default: `liquid`)
  markdownTemplateEngine: 'njk',

  // Pre-process *.html files with: (default: `liquid`)
  htmlTemplateEngine: 'njk',

  // These are all optional:
  dir: {
    input: '.', // default: "."
    includes: '_includes', // default: "_includes" (`input` relative)
    data: '../_data', // default: "_data" (`input` relative)
    output: '_site',
  },

  // -----------------------------------------------------------------
  // Optional items:
  // -----------------------------------------------------------------

  // If your site deploys to a subdirectory, change `pathPrefix`.
  // Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

  // When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
  // it will transform any absolute URLs in your HTML to include this
  // folder name and does **not** affect where things go in the output folder.

  pathPrefix: '/',
};
