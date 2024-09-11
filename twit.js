import axios from 'axios'; 
import cron from 'node-cron'; 
import { Parser } from 'json2csv'; // For converting JSON to CSV
import fs from 'fs'; 

// Twitter API credentials
const BEARER_TOKEN = 'YOUR_TWITTER_BEARER_TOKEN'; 
const BASE_URL = 'https://api.twitter.com/2/tweets/search/recent';

// Define the disaster-related keyword
let searchKeyword = '#flood #drought #tsunami #earthquake #landslide #bridgecollapsed #extremerainfall #india';

// Function to fetch tweets related to disasters from Twitter
async function fetchTweets(searchKeyword) {
    try {
        // Construct the search query with keyword
        const url = `${BASE_URL}?query=${encodeURIComponent(searchKeyword)}&tweet.fields=created_at,geo&expansions=geo.place_id&place.fields=full_name,geo`;

        // Make the request to Twitter API
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
            },
        });

        const tweets = response.data.data;
        const places = response.data.includes ? response.data.includes.places : [];
        const currentTime = new Date();
        const filteredTweets = [];

        console.log(`Retrieved ${tweets.length} tweets about '${searchKeyword}':`);

        // Process the tweets
        tweets.forEach(tweet => {
            const tweetTime = new Date(tweet.created_at);
            let locationName = 'Location information not available';
            let latitude = null;
            let longitude = null;

            // Check if the tweet has a geo-tagged location
            if (tweet.geo && tweet.geo.place_id) {
                const place = places.find(p => p.id === tweet.geo.place_id);
                if (place) {
                    locationName = place.full_name;
                    if (place.geo && place.geo.bbox) {
                        latitude = place.geo.bbox[1];  // Latitude from bounding box
                        longitude = place.geo.bbox[0]; // Longitude from bounding box
                    }
                }
            }

            const timeDifference = (currentTime - tweetTime) / (1000 * 60); // in minutes
            if (timeDifference <= 120) {  // Filter by recent tweets (within 60 minutes)
                console.log(`Tweet: ${tweet.text}`);
                console.log(`Location: ${locationName} (Lat: ${latitude}, Lon: ${longitude})`);
                console.log('----------------------------------');

                // Push the relevant tweet data to filteredTweets array
                filteredTweets.push({
                    tweet: tweet.text,
                    created_time: tweet.created_at,
                    location_name: locationName,
                    latitude: latitude,
                    longitude: longitude,
                });
            }
        });

        // Convert filtered data to CSV and write to file
        if (filteredTweets.length > 0) {
            convertToCSV(filteredTweets);
        }

        return tweets;

    } catch (error) {
        console.error('Error fetching tweets:', error.response ? error.response.data : error.message);
    }
}

// Function to convert JSON data to CSV and write it to a file
function convertToCSV(data) {
    try {
        const fields = ['tweet', 'created_time', 'location_name', 'latitude', 'longitude']; // Define the CSV headers
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        // Write the CSV data to a file
        fs.writeFileSync('disaster_tweets.csv', csv, { flag: 'a' });  // 'a' flag to append to the file
        console.log('CSV file updated: disaster_tweets.csv');
    } catch (err) {
        console.error('Error converting to CSV:', err);
    }
}

// Schedule the function to run every minute (adjust the interval as needed)
cron.schedule('* * * * *', () => {
    console.log('Fetching real-time disaster tweets...');
    fetchTweets(searchKeyword);
});

// To run once when the script starts
fetchTweets(searchKeyword);


