import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ActiveUsersList = ({ users, currentUserId }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>En ligne ({users.length})</Text>
      {users.map(user => (
        <View key={user.userId} style={styles.userItem}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: user.userId === currentUserId ? '#4CAF50' : '#2196F3' }
          ]} />
          <Text style={styles.username}>
            {user.username}
            {user.userId === currentUserId && ' (Vous)'}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  username: {
    fontSize: 14
  }
});

export default ActiveUsersList;