import express from "express"
import bodyParseer from "body-parser"
import GameRouter from "./api/game.js"
import cors from "cors"
import https from "https";
import fs from 'fs'


const privateKey = fs.readFileSync('./h5api.musemateapp.com.key', 'utf8');
const certificate = fs.readFileSync('./h5api.musemateapp.com.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();

app.use(express.json())
app.use(cors())
app.use('/game', GameRouter)


const httpsServer = https.createServer(credentials, app)
httpsServer.listen(10010)