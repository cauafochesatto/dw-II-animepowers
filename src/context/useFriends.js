import { useContext } from 'react';
import { FriendsContext } from './friendsContextInstance';

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends deve ser utilizado dentro de um FriendsProvider');
  }
  return context;
}

