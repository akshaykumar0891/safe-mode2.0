// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Multiple numbers from .env (comma-separated)
const alertNumbers = process.env.ALERT_PHONE_NUMBERS
  ? process.env.ALERT_PHONE_NUMBERS.split(",").map((n) => n.trim())
  : [];

// ...existing code...
app.post("/send-sms", async (req, res) => {
  try {
    const { location, audioTranscript } = req.body;

    let locationText, mapsLink = "";
    if (typeof location === "object" && location.latitude && location.longitude) {
      locationText = `Lat: ${location.latitude}, Lon: ${location.longitude}`;
      mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    } else {
      locationText = location;
    }

    const messageBody = `
🚨 EMERGENCY ALERT 🚨
Transcript: "${audioTranscript}"
Location: ${locationText}
${mapsLink ? "Live Location: " + mapsLink : ""}
    `.trim();

    // Send SMS to all numbers
    const results = [];
    for (const number of alertNumbers) {
      try {
        const msg = await client.messages.create({
          body: messageBody,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: number,
        });
        results.push({ number, status: "sent", sid: msg.sid });
      } catch (err) {
        results.push({ number, status: "failed", error: err.message });
      }
    }

    const success = results.some((r) => r.status === "sent");
    res.json({ success, results });
  } catch (error) {
    console.error("❌ Twilio Error:", error.message);
    res.json({ success: false, error: error.message });
  }
});
// ...existing code...
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
