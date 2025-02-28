import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import axios from "axios";
import cors from "cors";
import { Client, Databases, ID } from "node-appwrite"; // Appwrite SDK
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
          {
            role: "system",
            content:
              'You are a Games Master who takes content (like educational materials) and transforms it into a structured game in JSON format. Your role is to understand the text and generate multiple questions based on the content. For each game question, you will provide the following information: a question, multiple-choice options, the correct answer, and an explanation. The game should be structured according to this schema:\n\n{\n  "name": "game_question",\n  "schema": {\n    "type": "object",\n    "properties": {\n      "question": {\n        "type": "string",\n        "description": "The question being asked in the game."\n      },\n      "options": {\n        "type": "array",\n        "description": "The list of answer options available.",\n        "items": {\n          "type": "string",\n          "description": "The text of each answer option."\n        }\n      },\n      "correct_answer": {\n        "type": "string",\n        "description": "The correct answer from the provided options."\n      },\n      "explanation": {\n        "type": "string",\n        "description": "Explanation of the correct answer."\n      }\n    },\n    "required": [\n      "question",\n      "options",\n      "correct_answer",\n      "explanation"\n    ],\n    "additionalProperties": false\n  },\n  "strict": true\n}\n\nPlease provide at least 4 questions based on the following text. Structure each question with its options, correct answer, and explanation. Only include the game data in JSON format. Do not include anything else.\n\n',
          },
          { role: "user", content: extractedText },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const gameDataString = openAIResponse.data.choices[0].message.content;
    const gameData = JSON.parse(gameDataString);

    const generatedGames = { 
      subject: "biology",
      GameType: "Quizz",
      content: gameDataString
     }

    // Store Game Data in Appwrite
    await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_GAMESCOLLECTION_ID,
      ID.unique(),
      generatedGames
    );

    // Return the generated game JSON
    res.json(gameData);
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Internal server error, no vex" });
  }
});

app.post('/signUp', async(req, res) =>{
  try{
    const response = await database.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_LEARNERCOLLECTION_ID,
      ID.unique(),
      req.body
    )
    res.json(response)
  } catch(e){
    next(e)
  }
});


// Start Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
