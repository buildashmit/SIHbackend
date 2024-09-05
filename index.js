// Import necessary libraries

// import get from 'axios';
// import schedule from 'node-cron';
const axios = require('axios');
const cron = require('node-cron');

import { Parser } from 'json2csv'; // For converting JSON to CSV
import {fs} from 'fs' // For writing the CSV to a file



// Set up Facebook Graph API credentials
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN'; // Replace with your valid long-lived access token
const BASE_URL = 'https://graph.facebook.com/v16.0';

// Define the keywords to filter disaster-related posts (for example, #flood in India)
const searchKeyword = '#flood, #drought, #tsuanmi, #earthquake, #landslide, #bridgecollapsed, #extremerainfall';  // Can be dynamically changed to any disaster-related keyword
const location = 'India';  // Target location (can be specified further with lat/lon if needed)

// Function to fetch disaster data from Facebook
async function fetchDisasterData(keyword, location) {
    try {
        // Construct the search query
        const searchQuery = encodeURIComponent(`${keyword} ${location}`);

        // Graph API request for public posts containing the keyword
        const url = `${BASE_URL}/search?type=page&q=${searchQuery}&fields=name,message,created_time,attachments&access_token=${ACCESS_TOKEN}`;

        const response = await axios.get(url);
        
        // Process and log the retrieved data
        const posts = response.data.data;

        // Get the current time
        const currentTime = new Date();
        const filteredPosts = [];




        console.log(`Retrieved ${posts.length} posts about ${keyword} in ${location}:`);
        
        posts.forEach(post => {
            const postTime = new Date(post.created_time);

            // Filter posts within the last hour (or another time range)
            const timeDifference = (currentTime - postTime) / (1000 * 60); // in minutes
            if (timeDifference <= 60) {  // You can adjust this time window to suit your needs (e.g., 60 minutes)
                console.log(`Post: ${post.message}`);
                console.log(`Page Name: ${post.name}`);
                console.log(`Created Time: ${post.created_time}`);
                //console.log(`Attachments: ${post.attachments}`);

                /*if (post.place && post.place.location) {
                    const location = post.place.location;
                    const latitude = location.latitude;
                    const longitude = location.longitude;
                    const locationName = location.name;
    
                    console.log(`Location: ${locationName} (Lat: ${latitude}, Lon: ${longitude})`);
                } else {
                    console.log('Location information not available');
                }*/



                console.log('----------------------------------');

                // Push the relevant post data to the filteredPosts array
                filteredPosts.push({
                    name: post.name,
                    message: post.message,
                    created_time: post.created_time
                });
            }
        });

        // Convert filtered data to CSV and write to file
        if (filteredPosts.length > 0) {
            convertToCSV(filteredPosts);  // Insert this line after filtering the posts
        }

        return posts;

    } catch (error) {
        console.error('Error fetching disaster data:', error.response ? error.response.data.error : error.message);
    }
}

// Function to convert JSON data to CSV and write it to a file
function convertToCSV(data) {
    try {
        const fields = ['name', 'message', 'created_time']; // Define the CSV headers
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        // Write the CSV data to a file
        fs.writeFileSync('disaster_data.csv', csv);
        console.log('CSV file created: disaster_data.csv');
    } catch (err) {
        console.error('Error converting to CSV:', err);
    }
}





// Schedule the function to run every minute (adjust the interval as needed)
cron.schedule('* * * * *', () => {
    console.log('Fetching real-time disaster data...');
    fetchDisasterData(searchKeyword, location);
});

// To run once when the script starts
fetchDisasterData(searchKeyword, location);







///////////////////////////////////////////////////////////////////////////////////






























