import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../context/AuthContext';

export const useChat = (roomCode) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket || !roomCode || !currentUser) return;

    const handleConnect = () => {
      socket.emit('join-room', { roomCode, userId: user._id }, (response) => {
        if (response.success) {
          setIsConnected(true);
          setMessages(response.messages || []);
          setActiveUsers(response.activeUsers || []);
        } else {
          console.error('Join room error:', response.error);
        }
      });
    };

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleUserJoined = (data) => {
      console.log(`${data.userId} joined the room`);
    };

    const handleUserLeft = (data) => {
      console.log(`${data.userId} left the room`);
    };
     const handleUsersUpdate = ({ users }) => {
      setActiveUsers(users);
    };

    const handlePing = () => {
      socket.emit('pong');
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('receive-message', handleNewMessage);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
socket.on('active-users-updated', handleUsersUpdate);
    socket.on('ping', handlePing);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive-message', handleNewMessage);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
       socket.off('active-users-updated', handleUsersUpdate);
      socket.off('ping', handlePing);
    };
  }, [socket, roomCode,  currentUser, user._id]);

  const sendMessage = (text) => {
    if (!isConnected || !text.trim()) return;

    socket.emit('send-message', {
      roomCode,
      message: text,
      senderId: user._id
    }, (response) => {
      if (!response.success) {
        console.error('Send message error:', response.error);
      }
    });
  };

  return { messages, activeUsers, sendMessage, isConnected };
};