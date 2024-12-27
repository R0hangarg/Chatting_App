import express from 'express';
import {createServer} from 'http';
import cors from 'cors';
import {Server} from 'socket.io';
import userRouter from './routes/userRoutes';
import cookieParser from 'cookie-parser'
import { prisma } from './database/db';

const app = express();

const server = createServer(app);

const io = new Server(server,{
    cors:{
        origin:"http://localhost:5173",
    }
});

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true // Allow cookies (credentials) to be sent
}));

app.use(express.json());
app.use(cookieParser());

io.on("connection",(socket)=>{
    console.log("User Connected", socket.id)
    socket.on('send-message',async(message,selectedContact)=> {
       socket.to(selectedContact?.contactId).emit('emit-message',message)
        const isExists = await prisma.meassages.findMany({
            where: {
                senderId:selectedContact?.userId,
                receiverId:selectedContact?.contactId,
            }
        })
       if(isExists.length == 0) {
        const result = await prisma.meassages.create({
            data: {
                senderId: selectedContact?.userId,
                receiverId: selectedContact?.contactId,
                content: [message],
            }
        })
       }
       else{
        let existingContent = isExists[0]?.content;
  if (typeof existingContent === 'string') {
    existingContent = [existingContent]; // Convert to an array
  }
        const result = await prisma.meassages.update({
            where: {
                id: isExists[0]?.id,
                senderId: selectedContact?.userId,
                receiverId: selectedContact?.contactId,

            },
            data: {
                content: {
                    push: message, // Append a single new message
                  },
            }
        })
       }
    })
});

io.on("disconnect",()=>{
    console.log("Disconnected")
}
);
app.use("/api/v1/user",userRouter);


server.listen(8000,()=>{
    console.log("Server listening on port 8000");
});