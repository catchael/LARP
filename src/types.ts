import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface User {
  id: number;
  email: string;
  last_played: string;
}

export interface Survey {
  id: number;
  user_id: number;
  data: any;
  created_at: string;
}

export interface ScriptRecord {
  id: number;
  user_id: number;
  script_name: string;
  dialogue: { speaker: string; text: string }[];
  created_at: string;
}

export interface AssessmentReport {
  id: number;
  user_id: number;
  report_data: any;
  created_at: string;
}

export type AppPhase =
  | 'login' | 'intro' | 'survey' | 'lobby' | 'teaching'
  | 'script_lobby' | 'script_detail' | 'room_lobby'
  | 'character_preview' | 'game_profile' | 'mission_briefing'
  | 'diary_reveal' // 🌟 加上這行
  | 'game_search' | 'search_end' | 'game_meeting' | 'game_voting'
  | 'game_ending' | 'truth_revealed';

export interface RoomUser {
  id: string;
  email: string;
  isHost: boolean;
  selectedCharacter?: string;
  assignedCharacter?: string;
  avatar?: string;
  isReady?: boolean;
  connectionStatus?: 'online' | 'offline';
}

export interface RoomState {
  id: string;
  scriptId: number;
  users: RoomUser[];
  status: 'waiting' | 'playing';
  assignmentMethod: 'random' | 'manual';
  characterSelections: Record<string, string[]>; // characterName -> array of userEmails
  isPublic: boolean;
  phase: AppPhase;
  phaseEndTime?: number;
}

export interface TeachingModule {
  id: 'delivery' | 'cognitive' | 'vocal';
  title: string;
  pages: TeachingPage[];
}

export interface TeachingPage {
  title: string;
  content: string;
  visualization?: React.ReactNode;
}
