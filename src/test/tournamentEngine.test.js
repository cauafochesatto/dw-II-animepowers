import { describe, it, expect } from 'vitest';
import {
  createTournament,
  resolveTournamentMatch,
  autoSimulateTournament,
} from '../utils/tournamentEngine';

describe('Tournament Engine (Single Elimination)', () => {
  const dummyUserBuild = {
    name: 'Goku Titan',
    avatar: '/poderesanime/imagenspoderes/kamehamenha.jpg',
    stats: { forca: 98, velocidade: 95, defesa: 90, resistencia: 92, energia: 95, poderEspecial: 99 },
    signatureMove: 'Kamehameha Supremo',
  };

  describe('Tournament Creation and Bracket Structure', () => {
    it('creates 4-participant tournament with 2 rounds (Semifinals, Grand Final)', () => {
      const tourn = createTournament('Copa 4', 4, [], dummyUserBuild);
      expect(tourn.size).toBe(4);
      expect(tourn.totalRounds).toBe(2);
      expect(tourn.rounds.length).toBe(2);
      // Round 1: 2 matches
      expect(tourn.rounds[0].matches.length).toBe(2);
      // Round 2 (Final): 1 match
      expect(tourn.rounds[1].matches.length).toBe(1);
      expect(tourn.participants.length).toBe(4);
      expect(tourn.status).toBe('in_progress');
      expect(tourn.champion).toBeNull();
    });

    it('creates 8-participant tournament with 3 rounds (Quarters, Semis, Grand Final)', () => {
      const tourn = createTournament('Torneio dos 8', 8, [], dummyUserBuild);
      expect(tourn.size).toBe(8);
      expect(tourn.totalRounds).toBe(3);
      expect(tourn.rounds[0].matches.length).toBe(4); // Quartas
      expect(tourn.rounds[1].matches.length).toBe(2); // Semis
      expect(tourn.rounds[2].matches.length).toBe(1); // Final
      expect(tourn.participants.length).toBe(8);
    });

    it('creates 16-participant tournament with 4 rounds (Round of 16 to Final)', () => {
      const tourn = createTournament('Super 16', 16, [], dummyUserBuild);
      expect(tourn.size).toBe(16);
      expect(tourn.totalRounds).toBe(4);
      expect(tourn.rounds[0].matches.length).toBe(8); // Oitavas
      expect(tourn.rounds[1].matches.length).toBe(4); // Quartas
      expect(tourn.rounds[2].matches.length).toBe(2); // Semis
      expect(tourn.rounds[3].matches.length).toBe(1); // Final
      expect(tourn.participants.length).toBe(16);
    });

    it('sanitizes invalid tournament sizes to default 8', () => {
      const tourn = createTournament('Invalid Size', 12, [], null);
      expect(tourn.size).toBe(8);
      expect(tourn.rounds.length).toBe(3);
    });

    it('includes user build as participant when provided', () => {
      const tourn = createTournament('Copa Solo', 4, [], dummyUserBuild);
      const userFighter = tourn.participants.find((p) => p.name === 'Goku Titan');
      expect(userFighter).toBeDefined();
      expect(userFighter.isAi).toBe(false);
    });
  });

  describe('Match Resolution & Advancement', () => {
    it('resolves ready match and advances winner to the next round', () => {
      let tourn = createTournament('Copa Teste', 4, [], dummyUserBuild);
      const match1 = tourn.rounds[0].matches[0];
      expect(match1.status).toBe('ready');

      // Resolve a primeira semifinal
      tourn = resolveTournamentMatch(tourn, match1.id, { rng: () => 0.5 });
      const updatedMatch1 = tourn.rounds[0].matches[0];
      expect(updatedMatch1.status).toBe('completed');
      expect(updatedMatch1.winner).toBeDefined();
      expect(updatedMatch1.loser).toBeDefined();

      // Verifica se o vencedor foi colocado na Grande Final (Round 2, Match 1, fighter1)
      const finalMatch = tourn.rounds[1].matches[0];
      expect(finalMatch.fighter1).toBeDefined();
      expect(finalMatch.fighter1.name).toBe(updatedMatch1.winner.name);
    });

    it('prevents resolving the same match more than once', () => {
      let tourn = createTournament('Copa Duplicata', 4, [], dummyUserBuild);
      const matchId = tourn.rounds[0].matches[0].id;

      tourn = resolveTournamentMatch(tourn, matchId, { rng: () => 0.5 });
      const winnerFirst = tourn.rounds[0].matches[0].winner;

      // Tenta resolver de novo a mesma partida
      tourn = resolveTournamentMatch(tourn, matchId, { rng: () => 0.1 });
      const winnerSecond = tourn.rounds[0].matches[0].winner;

      expect(winnerFirst.id).toBe(winnerSecond.id);
    });

    it('completes tournament and crowns valid champion when final match is resolved', () => {
      let tourn = createTournament('Copa Completa', 4, [], dummyUserBuild);

      // Simula todo o torneio
      tourn = autoSimulateTournament(tourn, { rng: () => 0.5 });

      expect(tourn.status).toBe('completed');
      expect(tourn.champion).toBeDefined();
      expect(tourn.champion.name).toBeTruthy();

      const finalMatch = tourn.rounds[1].matches[0];
      expect(finalMatch.status).toBe('completed');
      expect(finalMatch.winner.id).toBe(tourn.champion.id);
    });

    it('handles 8-participant full tournament simulation cleanly', () => {
      let tourn = createTournament('Torneio Octogonal', 8, [], dummyUserBuild);
      tourn = autoSimulateTournament(tourn, { rng: () => 0.5 });

      expect(tourn.status).toBe('completed');
      expect(tourn.champion).toBeDefined();
      expect(tourn.rounds[0].matches.every((m) => m.status === 'completed')).toBe(true);
      expect(tourn.rounds[1].matches.every((m) => m.status === 'completed')).toBe(true);
      expect(tourn.rounds[2].matches.every((m) => m.status === 'completed')).toBe(true);
    });
  });
});

