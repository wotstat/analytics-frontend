import type { BattleMode, BattleGameplay } from './battleModes'

type BattleModeFamilyItem = { mode: BattleMode, gameplay?: BattleGameplay, label?: string }
type BattleModeFamily = {
  title: string
  children: (BattleModeFamilyItem | { label: string, children: BattleModeFamilyItem[] })[]
}

const definitions = {
  'steel-hunter': {
    title: 'Стальной охотник',
    children: [
      { mode: 'BATTLE_ROYALE_SOLO', label: 'Соло' },
      { mode: 'BATTLE_ROYALE_SQUAD', label: 'Взвод' },
    ],
  },
  'tournaments': {
    title: 'Турниры',
    children: [
      {
        label: 'Обычные',
        children: [
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'ctf' },
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'domination' },
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'assault2' },
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'domination3' },
        ],
      },
      {
        label: 'Натиск',
        children: [
          { mode: 'TOURNAMENT_COMP7', gameplay: 'comp7' },
          { mode: 'TOURNAMENT_COMP7', gameplay: 'assault2' },
        ],
      },
    ],
  },
  'training-all': {
    title: 'Тренировочные',
    children: [
      {
        label: 'Обычные',
        children: [
          { mode: 'TRAINING', gameplay: 'ctf' },
          { mode: 'TRAINING', gameplay: 'domination' },
          { mode: 'TRAINING', gameplay: 'assault' },
          { mode: 'TRAINING', gameplay: 'assault2' },
          { mode: 'TRAINING', gameplay: 'domination3' },
          { mode: 'TRAINING', gameplay: 'bootcamp' },
          { mode: 'TRAINING', gameplay: 'comp7' },
          { mode: 'EPIC_RANDOM_TRAINING', label: 'Генеральное сражение' },
        ],
      },
      {
        label: 'Стальной охотник',
        children: [
          { mode: 'BATTLE_ROYALE_TRN_SOLO', label: 'Соло' },
          { mode: 'BATTLE_ROYALE_TRN_SQUAD', label: 'Взвод' },
        ],
      },
      {
        label: 'Другое',
        children: [
          { mode: 'TRAINING_COMP7', label: 'Натиск' },
        ],
      }
    ],
  },
  'waffentrager': {
    title: 'Последний Waffenträger',
    children: [
      { mode: 'WHITE_TIGER', label: 'Обычный' },
      { mode: 'WHITE_TIGER_2', label: 'Против блогеров' },
      { mode: 'EVENT_BATTLES', label: 'Обычный до 2025' },
      { mode: 'EVENT_BATTLES_2', label: 'Против блогеров до 2025' },
    ],
  },
  'heroes-time': {
    title: 'Время героев',
    children: [
      { mode: 'HB_OFFENCE', label: 'Прорыв' },
      { mode: 'HB_DEFENCE', label: 'Оборона' },
    ],
  },
  'babylon': {
    title: 'Вавилон: Запретная зона',
    children: [
      { mode: 'HALLOWEEN', label: 'Обычный' },
      { mode: 'HALLOWEEN_MEDIUM', label: 'Средний' },
      { mode: 'HALLOWEEN_HARD', label: 'Сложный' },
      { mode: 'HALLOWEEN_DEFENCE', label: 'Проект Вавилон' },
    ],
  },
  'last-stand': {
    title: 'Последний рубеж',
    children: [
      { mode: 'LAST_STAND', label: 'Нормально' },
      { mode: 'LAST_STAND_MEDIUM', label: 'Тяжело' },
      { mode: 'LAST_STAND_HARD', label: 'Жесть' },
    ],
  },
  'random-newbie': {
    title: 'Случайный бой (для новичков)',
    children: [
      { mode: 'RANDOM_NP2', label: 'Новые аккаунты' },
      { mode: 'WINBACK', label: 'Вернулись в игру' },
    ],
  },
  'stories': {
    title: 'Сценарии',
    children: [
      { mode: 'STORY_MODE', label: 'Сюжетный режим' },
      { mode: 'STORY_MODE_ONBOARDING', label: 'Введение' },
      { mode: 'STORY_MODE_REGULAR', label: 'Обычный' },
    ],
  },
} satisfies Record<string, BattleModeFamily>

export type BattleModeFamilyKey = keyof typeof definitions
export const battleModeFamilies: Record<string, BattleModeFamily> = definitions
