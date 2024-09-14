import axios from 'axios';
import cron from 'node-cron';
import { Parser } from 'json2csv'; // For converting JSON to CSV
import fs from 'fs';
import dotenv from 'dotenv'; // To load environment variables
import path from 'path';

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

// Define the disaster-related keyword (use 'OR' for broader matching)
let searchKeyword = '#flood';

// Directory where the CSV file will be saved
const saveDir = path.join('D:','web_dev','nodejs','disaster_aggregation_api_backend','disaster_data'); // Modify this path as needed
const csvFilePath = path.join(saveDir, 'disaster_tweets.csv');

// Check if the directory exists, if not, create it
if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });  // Creates the directory if it doesn't exist
}

// Function to fetch tweets related to disasters from Twitter (using RapidAPI)
async function fetchTweets(searchKeyword) {
    try {
        // Construct the search query with the keyword
        const options = {
            method: 'GET',
            url: BASE_URL,
            params: {
                query: searchKeyword,
                search_type: 'Top'
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'twitter-api45.p.rapidapi.com'
            }
        };

        // Make the request to Twitter API via RapidAPI
        const response = await axios.request(options);

        const tweets = response.data.data || [];  // Adapt to RapidAPI response structure
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

        // Write the CSV data to a file in the specified directory
        fs.writeFileSync(csvFilePath, csv, { flag: 'a' });  // 'a' flag to append to the file
        console.log(`CSV file updated: ${csvFilePath}`);
    } catch (err) {
        console.error('Error converting to CSV:', err);
    }
}

// Schedule the function to run every 15 minutes
cron.schedule('*/15 * * * *', () => {
    console.log('Fetching real-time disaster tweets...');
    fetchTweets(searchKeyword);
});

// To run once when the script starts
fetchTweets(searchKeyword);
