import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const RoomScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const { socket } = useSocket();
  const { user } = useAuth();

  const handleCreateRoom = async () => {
    try {
      const response = await api.post('/rooms', { userId: user._id });
      Alert.alert('Room Created', `Code: ${response.data.code}`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    try {
      await api.post('/rooms/join', { code, userId: user._id });
      
      socket.emit('join-secure-room', code, (response) => {
        if (response.success) {
          navigation.navigate('Chat', { code, isSecure: true });
        } else {
          Alert.alert('Error', response.error);
        }
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to join room');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Create Secure Room" onPress={handleCreateRoom} />
      
      <TextInput
        placeholder="Enter Room Code"
        value={code}
        onChangeText={setCode}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <Button title="Join Room" onPress={handleJoinRoom} />
    </View>
  );
};