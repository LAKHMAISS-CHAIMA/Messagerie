import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, FlatList, Text, KeyboardAvoidingView } from 'react-native';
import { useChat } from '../hooks/useChat';
import MessageBubble from '../components/MessageBubble';
import ActiveUsersList from '../components/ActiveUsersList';

const ChatScreen = ({ route }) => {
  const { roomCode } = route.params;
    const { user } = useAuth();
  const [message, setMessage] = useState('');
  const { messages, activeUsers, sendMessage, isConnected } = useChat(roomCode, user);
  
  const flatListRef = useRef();

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior="padding"
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble 
            message={item}
            isCurrentUser={item.sender === user._id}
          />
        )}
        contentContainerStyle={{ padding: 10 }}
      />

      <View style={{ padding: 10, flexDirection: 'row' }}>
        <TextInput
          style={{ 
            flex: 1, 
            borderWidth: 1, 
            borderRadius: 20, 
            padding: 10,
            marginRight: 10
          }}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          onSubmitEditing={handleSend}
        />
        <Button 
          title="Send" 
          onPress={handleSend} 
          disabled={!isConnected || !message.trim()}
        />
      </View>
       <View style={{ flex: 1 }}>
      <ActiveUsersList 
        users={activeUsers} 
        currentUserId={user.id} 
      />
      
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble 
            message={item}
            isCurrentUser={item.sender === user.id}
          />
        )}
        keyExtractor={item => item.id}
        style={{ flex: 1 }}
      />
      
      <View style={{ padding: 10, flexDirection: 'row' }}>
        <TextInput
          style={{ flex: 1, marginRight: 10 }}
          value={message}
          onChangeText={setMessage}
          placeholder="Écrire un message..."
        />
        <Button 
          title="Envoyer" 
          onPress={() => {
            sendMessage(message);
            setMessage('');
          }}
        />
      </View>
    </View>
    </KeyboardAvoidingView>
  );
};