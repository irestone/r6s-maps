import { find } from 'lodash'

export type TMap = {
  id: string,
  slug: string,
  name: string,
  description: string,
  location: string,
  released: string, // ISO
  reworked: string, // ISO
  playlists: 'new-comer' | 'casual' | 'ranked',
  preview: string, // URL
  levels: string[], // TLevelData{id}
}

export type TLevelType = 'b' | '1f' | '2f' | '3f' | 'r'

export type TLevelData = {
  id: string,
  type: TLevelType,
  blueprint: {
    src: string,
    width: number,
    height: number,
  },
  objects: any[],
}

const levels: TLevelData[] = [
  {
    id: 1,
    type: 'b',
    blueprint: { src: '/assets/maps/chalet/basement.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 2,
    type: '1f',
    blueprint: { src: '/assets/maps/chalet/1-floor.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 3,
    type: '2f',
    blueprint: { src: '/assets/maps/chalet/2-floor.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 4,
    type: 'r',
    blueprint: { src: '/assets/maps/chalet/roof.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 5,
    type: 'b',
    blueprint: { src: '/assets/maps/bank/basement.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 6,
    type: '1f',
    blueprint: { src: '/assets/maps/bank/1-floor.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 7,
    type: '2f',
    blueprint: { src: '/assets/maps/bank/2-floor.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 8,
    type: 'r',
    blueprint: { src: '/assets/maps/bank/roof.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 9,
    type: 'b',
    blueprint: { src: '/assets/maps/consulate/basement.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 10,
    type: '1f',
    blueprint: { src: '/assets/maps/consulate/1-floor.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 11,
    type: '2f',
    blueprint: { src: '/assets/maps/consulate/2-floor.jpg', width: 1600, height: 900 },
    objects: [],
  },
  {
    id: 12,
    type: 'r',
    blueprint: { src: '/assets/maps/consulate/roof.jpg', width: 1600, height: 900 },
    objects: [],
  },
]

const maps: TMap[] = [
  {
    id: 1,
    slug: 'chalet',
    name: 'Chalet',
    description:
      'A shootout in an “après-ski” chalet in the French alps. This area contrasts the warm, cozy mood of its interiors with the cold, constrained visibility of its exteriors.',
    location: 'Courchevel, France',
    released: '2015-12-01T00:00:00.000Z',
    reworked: '2020-09-01T00:00:00.000Z',
    playlists: ['casual', 'ranked'],
    preview: '/assets/maps/chalet/preview.jpg',
    levels: [1, 2, 3, 4],
  },
  {
    id: 2,
    slug: 'bank',
    name: 'Bank',
    description:
      'Team Rainbow has been called to raid a major bank. The focus is on providing a sense of progression for attackers as they make their way through progressively more fortified areas of the building.',
    location: 'Los Angeles, California',
    released: '2015-12-01T00:00:00.000Z',
    playlists: ['new-comer', 'casual', 'ranked'],
    preview: '/assets/maps/bank/preview.jpg',
    levels: [5, 6, 7, 8],
  },
  {
    id: 3,
    slug: 'consulate',
    name: 'Consulate',
    description:
      'A high-risk, highly secured fortified location, this map depicts an assault on a French consulate in Ivory Coast.',
    location: 'Abidjan, Ivory Coast',
    released: '2015-12-01T00:00:00.000Z',
    playlists: ['casual', 'ranked'],
    preview: '/assets/maps/consulate/preview.jpg',
    levels: [9, 10, 11, 12],
  },
]

const db = { maps, levels }

// export const getMap = (predicate: ListIterateeCustom<TMap, boolean>) => find(maps, predicate)

// ! Throwing an error here in getters. Kinda meh..

export const getMapBySlug = (slug: string): TMap => {
  const map = find(maps, { slug })
  if (!map) throw new Error('Map not found.')
  return map
}

export const getMapById = (id: string): TMap => {
  const map = find(maps, { id })
  if (!map) throw new Error('Map not found.')
  return map
}

export const getLevelById = (id: string): TLevelData => {
  const level = find(levels, { id })
  if (!level) throw new Error('Level not found.')
  return level
}

export default db
