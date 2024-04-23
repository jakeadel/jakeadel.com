const { google } = require('googleapis');

exports.handler = async (event, context) => {
    try {

        const sheets = google.sheets({ version: 'v4', auth: process.env.SHEETS_KEY });

        // ID of your Google Sheets spreadsheet
        const spreadsheetId = process.env.SHEET_ID;
        // Range of cells to retrieve data from
        const range = 'A2:D100';

        // Fetch data from Google Sheets API
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        // Extract values from response
        const values = response.data.values;

        let popValues = [];
        for (let value of values) {
            if (value.length > 0) {
                popValues.push(value)
            }
        }

        console.log({
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(popValues),
        })

        // Return data as JSON response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: JSON.stringify(popValues),
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return {
            statusCode: 500,
            body: 'Error fetching data',
        };
    }
};

