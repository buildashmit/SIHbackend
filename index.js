/* Import necessary libraries */
import axios from 'axios'; // Import axios using ES modules
import cron from 'node-cron'; // Import node-cron using ES modules
import { Parser } from 'json2csv'; // For converting JSON to CSV
import fs from 'fs'; // For writing the CSV to a file

// Set up Facebook Graph API credentials
const ACCESS_TOKEN = 'EAARzbIZC1S28BOzwQ7RU8M17BqMvUuUi0ojqMWYrZA1vObFcoJjU2ZBvTTlilnFZC8MwVWTU5gPZBGxrCZADPymlQjFzPZA5xXZCqiItpVmZAdYMsRLmsldIqKR3ZB2DedCOc8ygceKkoJ0u0DcMnZBOeOdXMJZBZCbmP9UOoYXZAWO1cKB2IBN1c0RSWsKmmEtIDQZC5Iq'; // Replace with your valid token
const searchKeyword = '#flood, #drought, #tsunami, #earthquake, #landslide, #bridgecollapsed, #extremerainfall'; // Can be dynamically changed
const location = 'India'; // Target location
const BASE_URL = 'https://graph.facebook.com/v20.0/search?type=page&q=searchKeyword&fields=name,posts&access_token=EAARzbIZC1S28BOzwQ7RU8M17BqMvUuUi0ojqMWYrZA1vObFcoJjU2ZBvTTlilnFZC8MwVWTU5gPZBGxrCZADPymlQjFzPZA5xXZCqiItpVmZAdYMsRLmsldIqKR3ZB2DedCOc8ygceKkoJ0u0DcMnZBOeOdXMJZBZCbmP9UOoYXZAWO1cKB2IBN1c0RSWsKmmEtIDQZC5Iq'; // Check before implementing

// Define the keywords to filter disaster-related posts (for example, #flood in India)

// Function to fetch disaster data from Facebook
async function fetchDisasterData(keyword, location) {
    try {
        const searchQuery = encodeURIComponent(`${keyword} ${location}`);
        const url = `${BASE_URL}/search?type=page&q=${searchQuery}&fields=name,message,created_time,attachments&access_token=${ACCESS_TOKEN}`;
        const response = await axios.get(url);

        const posts = response.data.data;
        const currentTime = new Date();
        const filteredPosts = [];

        console.log(`Retrieved ${posts.length} posts about ${keyword} in ${location}:`);
        
        posts.forEach(post => {
            const postTime = new Date(post.created_time);
            const timeDifference = (currentTime - postTime) / (1000 * 60); // in minutes
            
            if (timeDifference <= 60) {  // Filter posts within the last hour
                console.log(`Post: ${post.message}`);
                console.log(`Page Name: ${post.name}`);
                console.log(`Created Time: ${post.created_time}`);
                console.log('----------------------------------');

                filteredPosts.push({
                    name: post.name,
                    message: post.message,
                    created_time: post.created_time
                });
            }
        });

        if (filteredPosts.length > 0) {
            convertToCSV(filteredPosts);  // Convert to CSV after filtering posts
        }

        return posts;

    } catch (error) {
        console.error('Error fetching disaster data:', error.response ? error.response.data.error : error.message);
    }
}

// Function to convert JSON data to CSV and write it to a file
function convertToCSV(data) {
    try {
        const fields = ['name', 'message', 'created_time']; // Define CSV headers
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        fs.writeFileSync('disaster_data.csv', csv, { flag: 'a' });
        console.log('CSV file created: disaster_data.csv');
    } catch (err) {
        console.error('Error converting to CSV:', err);
    }
}

// Schedule the function to run every minute
cron.schedule('* * * * *', () => {
    console.log('Fetching real-time disaster data...');
    fetchDisasterData(searchKeyword, location);
});

// To run once when the script starts
fetchDisasterData(searchKeyword, location);
