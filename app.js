import express from "express"
import bodyParseer from "body-parser"
import GameRouter from "./api/game.js"
import cors from "cors"

const app = express();

app.use(express.json())
app.use(cors())
app.use('/game', GameRouter)

app.listen(10010)