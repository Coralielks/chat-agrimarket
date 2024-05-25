const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

// Define Schemas based on the provided models
const ChatSchema = new Schema({
  _id: String,
  chat_id: String,
  name: String,
  created_by: String,
  created_at: Date,
  updated_at: Date,
  id: Number,
  record_id: String,
});

const UserSchema = new Schema({
  _id: String,
  chat_id: String,
  unique_id: {
    chat_id: String,
    user: String,
  },
  name: String,
  photo: {
    service: String,
    target: String,
  },
  added_by: String,
  is_chat_admin: Boolean,
  created_at: Date,
  updated_at: Date,
  id: Number,
  record_id: String,
});

const MessageSchema = new Schema({
  _id: String,
  chat_id: String,
  message: {
    content: String,
    content_type: String,
  },
  sender: String,
  status: String,
  created_at: Date,
  updated_at: Date,
  id: Number,
  record_id: String,
});

const Chat = mongoose.model('Chat', ChatSchema);
const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle joining a chat room
  socket.on('joinRoom', async ({ chat_id, user_id }) => {
    const user = await User.findOne({ 'unique_id.user': user_id });
    if (user) {
      socket.join(chat_id);
      console.log(`${user.name} joined chat ${chat_id}`);
    }
  });

  // Handle sending a message
  socket.on('sendMessage', async ({ chat_id, content, sender_id }) => {
    const user = await User.findOne({ 'unique_id.user': sender_id });
    if (user) {
      const newMessage = new Message({
        _id: new mongoose.Types.ObjectId(),
        chat_id,
        message: { content, content_type: 'text' },
        sender: user._id,
        status: 'Sent',
        created_at: new Date(),
        updated_at: new Date(),
        id: Math.floor(Math.random() * 1000), // Example ID generation
        record_id: new mongoose.Types.ObjectId().toString(),
      });

      await newMessage.save();
      io.to(chat_id).emit('message', newMessage);
      console.log(`Message from ${user.name}: ${content}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
