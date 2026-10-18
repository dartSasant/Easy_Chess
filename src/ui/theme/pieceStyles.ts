export type PieceStyleId = 'classic' | 'gold-green' | 'gold-red' | 'cream-moss';

interface SideColors {
  fill: string;
  stroke: string;
}

export interface PieceStyle {
  id: PieceStyleId;
  name: string;
  white: SideColors;
  black: SideColors;
}

export const PIECE_STYLES: Record<PieceStyleId, PieceStyle> = {
  classic: {
    id: 'classic',
    name: 'White and black',
    white: { fill: '#FFFFFF', stroke: '#2E3B2E' },
    black: { fill: '#1F2A1F', stroke: '#F6F3EC' },
  },
  'gold-green': {
    id: 'gold-green',
    name: 'Gold and deep green',
    white: { fill: '#CBAA6B', stroke: '#5C4720' },
    black: { fill: '#2E3B2E', stroke: '#151D15' },
  },
  'gold-red': {
    id: 'gold-red',
    name: 'Gold and brick red',
    white: { fill: '#CBAA6B', stroke: '#5C4720' },
    black: { fill: '#A5382C', stroke: '#4A130D' },
  },
  'cream-moss': {
    id: 'cream-moss',
    name: 'Cream and moss',
    white: { fill: '#FFF8E6', stroke: '#6B5B3A' },
    black: { fill: '#3F5E3F', stroke: '#1B2A1B' },
  },
};

export const DEFAULT_PIECE_STYLE: PieceStyleId = 'classic';