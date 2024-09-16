import axios from 'axios';
import cron from 'node-cron';
import { Parser } from 'json2csv'; // For converting JSON to CSV
import fs from 'fs';
import dotenv from 'dotenv'; // To load environment variables
import path from 'path'; // To handle file paths

// Load environment variables from .env file
dotenv.config();

// RapidAPI credentials
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;  // Load from your .env file
const BASE_URL = 'https://twitter-api45.p.rapidapi.com/search.php';

// Check if the API Key is loaded correctly
if (!RAPIDAPI_KEY) {
    console.error('Error: RapidAPI Key not found. Please check your .env file.');
    process.exit(1);  // Exit the script if the key is missing
} else {
    console.log('RapidAPI Key loaded successfully.');
}

// Define the disaster-related keywords (multiple keywords)
const searchKeywords = ['#Floods', '#earthquake', '#cyclone', '#fire', '#heavyrain', '#waterlogging', '#industrialdisaster', '#medicalemergency'];

// Define geocode for India (Latitude, Longitude, Radius)
const GEO_CODE = '20.5937,78.9629,500km'; // Approximate center of India

// Function to fetch tweets related to disasters from Twitter (using RapidAPI)
async function fetchTweets(searchKeyword) {
    try {
        // Construct the search query with the keyword and geocode
        const options = {
            method: 'GET',
            url: BASE_URL,
            params: {
                query: searchKeyword,  // Simpler query
                search_type: 'Latest',  // Use 'Latest' for more recent tweets
                geocode: GEO_CODE       // Ensure the query is location-specific
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
            }
        };

        // Make the request to Twitter API via RapidAPI
        const response = await axios.request(options);

        // Debugging: Check the full response structure
        console.log('API Response:', response.data);

        const tweets = response.data?.timeline || [];  // Adjust based on RapidAPI response structure
        const currentTime = new Date();
        const filteredTweets = [];

        console.log(`Retrieved ${tweets.length} tweets about '${searchKeyword}':`);

        // Process the tweets
        tweets.forEach(tweet => {
            const tweetTime = new Date(tweet.created_at);
            const timeDifference = (currentTime - tweetTime) / (1000 * 60); // in minutes

            if (timeDifference <= 120) {  // Filter by recent tweets (within 120 minutes)
                console.log(`Tweet: ${tweet.text}`);
                console.log(`Created At: ${tweet.created_at}`);
                console.log('----------------------------------');

                // Push the relevant tweet data to filteredTweets array
                filteredTweets.push({
                    tweet: tweet.text,
                    created_time: tweet.created_at,
                });
            }
        });

        // Convert filtered data to CSV and write to file
        if (filteredTweets.length > 0) {
            convertToCSV(filteredTweets);
        } else {
            console.log('No new tweets found within the last 120 minutes.');
        }

        return tweets;

    } catch (error) {
        console.error('Error fetching tweets:', error.response ? error.response.data : error.message);
    }
}

// Function to convert JSON data to CSV and write it to a file
function convertToCSV(data) {
    try {
        const fields = ['tweet', 'created_time']; // Define the CSV headers
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        // Define the file path for Windows
        const savePath = path.join('D:', 'web_dev', 'nodejs', 'disaster_aggregation_api_backend', 'disaster_tweets.csv');

        // Write the CSV data to a file
        fs.writeFileSync(savePath, csv, { flag: 'a' });  // 'a' flag to append to the file
        console.log(`CSV file updated: ${savePath}`);
    } catch (err) {
        console.error('Error converting to CSV:', err);
    }
}

// Schedule the function to run every 15 minutes
cron.schedule('*/15 * * * *', () => {
    console.log('Fetching real-time disaster tweets...');

    // Iterate over all keywords and fetch tweets for each keyword
    searchKeywords.forEach(keyword => {
        fetchTweets(keyword);
    });
});

// To run once when the script starts
searchKeywords.forEach(keyword => fetchTweets(keyword));
