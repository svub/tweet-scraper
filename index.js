import 'dotenv/config';
import { stringify } from 'csv-stringify/sync';
import { getUserTweets } from './twitter.js';
import { dir, log, warn } from 'console';
import { writeFile } from 'fs/promises';

const userIds = process.env.USER_IDS.split(',');
const maxTweetsPerUser = process.env.MAX_TWEETS_PER_USER;
const month = (new Date().getMonth()); // previous month
const year = new Date().getFullYear();
const startTime = `${year}-${month.toString().padStart(2, '0')}-01T00:00:00Z`; // YYYY-MM-DDTHH:mm:ssZ (ISO 8601/RFC 3339)
const endTime = `${year}-${(month + 1).toString().padStart(2, '0')}-01T00:00:00Z`;

let csv = stringify([['text', 'uid', 'name', 'date', 'type', 'flagged']]);
let errorLog = []
let count = 0;

log(`Let's do it. 🚀\nGetting up to ${maxTweetsPerUser} Tweets each for ${userIds.length} users between ${startTime} and ${endTime}`);
if (userIds.length * maxTweetsPerUser / 100 > 900) warn('This might fail due to rate limiting.');

while (userIds.length > 0) {
  const userId = userIds.pop();
  try {
    const tweets = await getUserTweets(userId, startTime, endTime)
    count += tweets.length;

    // Text, uid, uName, time, type(Tweet,Retweet or Reply), flagged-as-sensitive?
    const transformed = tweets.map(tweet => [ tweet.text, tweet.author_id, tweet.author_name, tweet.created_at, (tweet.referenced_tweets ? tweet.referenced_tweets[0].type : 'tweet'), tweet.possibly_sensitive ] );
    csv += stringify(transformed);
  } catch (e) {
    errorLog.push(e);
  }
};

await writeFile('results.csv', csv);
await writeFile('results.log', errorLog.join("\n"));

log(`Done. 🤓\nReceived ${count} Tweets. Results are stored in results.csv. `);

