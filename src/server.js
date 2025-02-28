import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import axios from "axios";
import cors from "cors";
import { Client, Databases } from "node-appwrite"; // Appwrite SDK
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5557;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer Setup for File Uploads (temporary storage)
const upload = multer({ storage: multer.memoryStorage() });

// Appwrite Setup
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const database = new Databases(client);

// API Route to Handle File Upload and Process PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded, no file has been uploaded" });
    }
    // Extract text from PDF
    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    const extractedText = data.text;

    // Send text to OpenAI
    const openAIResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: "Generate game data for this content" },
          { role: "user", content: extractedText },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const gameData = openAIResponse.data.choices[0].message.content;

    // Store Game Data in Appwrite
    // const response = await database.createDocument(
    //   process.env.APPWRITE_DATABASE_ID,
    //   process.env.APPWRITE_COLLECTION_ID,
    //   'unique()',
    //   { text: extractedText, gameData }
    // );
    // Return the generated game JSON
    res.json(gameData);
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Internal server error, no vex" });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
