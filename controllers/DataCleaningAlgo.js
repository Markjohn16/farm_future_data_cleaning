const { MongoClient } = require("mongodb");
require("dotenv").config();
const CleanedAdminData = require("../models/cleanedAdminDataModel"); // Correct import

const mode = process.env.MODE;
const DB_LOCAL = mode === "pro" ? process.env.DB_URL : process.env.DB_LOCAL;

class DataCleaningAlgo {
    data_cleaning = async (req, res) => {
        const client = new MongoClient(DB_LOCAL);
        let smaLogs = []; // Store SMA calculation logs

        try {
            await client.connect();
            const db = client.db();
            const collection = db.collection("admincommodityprices");
            const cleanedCollection = db.collection("cleanedAdminData");
            const logsCollection = db.collection("adminSmaLogs");

            let data = await collection.find({}, { projection: { commodity: 1, price: 1, week: 1, _id: 1 } }).toArray();

            if (!data.length) {
                return res.status(404).json({ message: "No data found in the database." });
            }

            const parseWeek = (weekStr) => {
                const months = {
                    "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
                    "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
                };
                let parts = weekStr.split("-");
                return parts.length === 3 && months[parts[1]] ? `${parts[0]}-${months[parts[1]]}-${parts[2]}` : null;
            };

            data.forEach(item => item.parsedWeek = parseWeek(item.week));
            data = data.filter(item => item.parsedWeek !== null);

            data.sort((a, b) => a.commodity.toString().localeCompare(b.commodity.toString()) || a.parsedWeek.localeCompare(b.parsedWeek));

            let commodityGroups = {};
            data.forEach(item => {
                if (!commodityGroups[item.commodity]) {
                    commodityGroups[item.commodity] = [];
                }
                commodityGroups[item.commodity].push(item);
            });

            const removeOutliers = (prices) => {
                let sortedPrices = prices.map(p => p.price).sort((a, b) => a - b);
                if (sortedPrices.length < 4) return prices;
                
                let q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
                let q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
                let iqr = q3 - q1;
                let lowerBound = q1 - 1.5 * iqr;
                let upperBound = q3 + 1.5 * iqr;
                return prices.filter(p => p.price >= lowerBound && p.price <= upperBound);
            };

            const smaWindow = 17;
            let cleanedData = [];

            for (let commodity in commodityGroups) {
                let filteredPrices = removeOutliers(commodityGroups[commodity]);
                filteredPrices.forEach((item, index) => {
                    let start = Math.max(0, index - smaWindow + 1);
                    let relevantPrices = filteredPrices.slice(start, index + 1).map(p => p.price);

                    let sumPrices = relevantPrices.reduce((sum, p) => sum + p, 0);
                    let sma = relevantPrices.length > 0 ? sumPrices / relevantPrices.length : item.price;

                    let cleanedItem = {
                        commodity: item.commodity,
                        commodity_id: item._id.toString(), // Convert ObjectId to string
                        week: item.week,
                        original_price: item.price,
                        cleaned_price: parseFloat(sma.toFixed(2))
                    };

                    cleanedData.push(cleanedItem);

                    let smaLog = {
                        commodity: item.commodity,
                        commodity_id: item._id.toString(),
                        week: item.week,
                        prices: relevantPrices,
                        sum: sumPrices,
                        sma: parseFloat(sma.toFixed(2))
                    };
                    smaLogs.push(smaLog);
                });
            }

            // Check if the cleaned data already exists in the database and replace it
            for (let cleanedItem of cleanedData) {
                // Use updateOne with upsert: true to replace the entire document if it exists
                await CleanedAdminData.updateOne(
                    { commodity: cleanedItem.commodity, commodity_id: cleanedItem.commodity_id, week: cleanedItem.week },
                    { $set: cleanedItem }, // Replace the entire document with the new cleanedItem
                    { upsert: true } // If the document doesn't exist, insert a new one
                );
            }

            // Store SMA logs in the database
            for (let log of smaLogs) {
                await logsCollection.updateOne(
                    { commodity_id: log.commodity_id, week: log.week },
                    { $set: log },
                    { upsert: true }
                );
            }

            return res.status(200).json({
                message: "Data cleaning completed successfully.",
                sma_logs: smaLogs, // Send the SMA logs in the response
            });

        } catch (error) {
            return res.status(500).json({
                message: "Internal Server Error",
                error: error.message
            });
        } finally {
            await client.close();
        }
    };
}

module.exports = new DataCleaningAlgo();
