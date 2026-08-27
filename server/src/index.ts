import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    message: "AskDocs API çalışıyor",
  });
});

app.listen(port, () => {
  console.log(`AskDocs API http://localhost:${port} adresinde çalışıyor`);
});