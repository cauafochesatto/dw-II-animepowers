import { useContext } from 'react';
import { CharacterContext } from './characterContextInstance';

export function useCharacterGame() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacterGame deve ser utilizado dentro de um CharacterProvider');
  }
  return context;
}

