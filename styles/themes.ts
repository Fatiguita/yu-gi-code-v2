import { Theme } from '../types';

export const defaultTheme: Theme = {
  name: 'Default',
  colors: {
    '--color-background': '#1a1a2e',
    '--color-background-accent': '#16213e',
    '--color-primary': '#4a00e0',
    '--color-secondary': '#3a0ca3',
    '--color-accent': '#e0c3fc',
    '--color-text-main': '#ffffff',
    '--color-text-muted': '#a0aec0',
    '--color-border': '#4a5568',
    '--color-surface-1': '#1e1b4b',
    '--color-surface-2': '#312e6f',
    '--color-success': '#2dd4bf',
    '--color-danger': '#f43f5e',
    '--color-warning': '#facc15',
    '--color-primary-transparent': 'rgba(74, 0, 224, 0.4)',
    '--color-danger-surface': 'rgba(244, 63, 94, 0.2)',
    '--color-success-surface': 'rgba(45, 212, 191, 0.2)',
  }
};

export const fatigahTheme: Theme = {
  name: 'Fa-ti-Gah!',
  colors: {
    '--color-background': '#0A192F', // main dark blue
    '--color-background-accent': '#000000', // second black
    '--color-primary': '#D4AF37', // 4th golden
    '--color-secondary': '#4A2A15', // third brown
    '--color-accent': '#3B82F6', // 5th metallic blue
    '--color-text-main': '#E6F1FF',
    '--color-text-muted': '#8892B0',
    '--color-border': '#D4AF37',
    '--color-surface-1': '#172A45',
    '--color-surface-2': '#112240',
    '--color-success': '#64FFDA',
    '--color-danger': '#FF79C6',
    '--color-warning': '#FFB86C',
    '--color-primary-transparent': 'rgba(212, 175, 55, 0.4)',
    '--color-danger-surface': 'rgba(255, 121, 198, 0.2)',
    '--color-success-surface': 'rgba(100, 255, 218, 0.2)',
  }
};

const orichalcosShunoros1: Theme = {
    name: 'Orichalcos Shunoros',
    colors: {
      '--color-background': '#152324',
      '--color-background-accent': '#1F3435', // Slightly lighter than bg
      '--color-primary': '#2C7A70', // Darkened from #58B4A9 to support light text
      '--color-secondary': '#1E5F5B', // Darkened from #3E8F89
      '--color-accent': '#58B4A9', // Used the old primary as accent (bright enough against dark bg)
      '--color-text-main': '#C9F2EE', // Kept light cyan
      '--color-text-muted': '#8FA6C0', // Lightened from #6B83C3 for better readability on dark
      '--color-border': '#4A8F85',
      '--color-surface-1': '#1F3435',
      '--color-surface-2': '#233D3E', // Darkened from #2A4647 to ensure text pops
      '--color-success': '#80BFB4',
      '--color-danger': '#D65D5D', // Brightened for visibility
      '--color-warning': '#E6D995',
      '--color-primary-transparent': 'rgba(44, 122, 112, 0.4)',
      '--color-danger-surface': 'rgba(214, 93, 93, 0.2)',
      '--color-success-surface': 'rgba(128, 191, 180, 0.2)',
    }
};

const xyzDragonCannon1: Theme = {
    name: 'XYZ-Dragon Cannon',
    colors: {
      '--color-background': '#2E3147', // Darkened from #3C3F5E
      '--color-background-accent': '#554275', // Darkened from #6E5992
      '--color-primary': '#2A7A7C', // Darkened from #48A7A9 to support white text
      '--color-secondary': '#255D60', // Darkened from #3C878A
      '--color-accent': '#F2E699', // Brightened Gold for better contrast on dark
      '--color-text-main': '#FFFFFF',
      '--color-text-muted': '#C0C2C1', // Lightened gray
      '--color-border': '#D6CA7E',
      '--color-surface-1': '#364461', // Darkened
      '--color-surface-2': '#3D5A85', // Darkened from #5675AE to ensure input text is readable
      '--color-success': '#87CEEB',
      '--color-danger': '#E06063',
      '--color-warning': '#F2E699',
      '--color-primary-transparent': 'rgba(42, 122, 124, 0.4)',
      '--color-danger-surface': 'rgba(224, 96, 99, 0.2)',
      '--color-success-surface': 'rgba(135, 206, 235, 0.2)',
    }
};

const princessChris2: Theme = {
    name: 'Princess Chris',
    colors: {
      '--color-background': '#FDF0E1', // Very light peach
      '--color-background-accent': '#FFD1CD', // Darker peach for contrast
      '--color-primary': '#F494B0', // Pink (supports dark text)
      '--color-secondary': '#F08C85', // Darkened Salmon
      '--color-accent': '#D65D7A', // Changed from Pale Peach (#FFD7B3) to Dark Rose. Crucial for light mode visibility.
      '--color-text-main': '#4A2810', // Darkened brown for sharper contrast
      '--color-text-muted': '#8A4E57', // Darker reddish-brown
      '--color-border': '#E0A694',
      '--color-surface-1': '#FFF6EC',
      '--color-surface-2': '#FAE5D6', // Slightly darker to differentiate inputs
      '--color-success': '#4E9CA0', // Darker teal for light bg
      '--color-danger': '#B85C68', // Darker red for light bg
      '--color-warning': '#D98E28', // Darker orange/gold
      '--color-primary-transparent': 'rgba(244, 148, 176, 0.4)',
      '--color-danger-surface': 'rgba(184, 92, 104, 0.2)',
      '--color-success-surface': 'rgba(78, 156, 160, 0.2)',
    }
};

const maiKujaku1: Theme = {
    name: 'Mai Kujaku (DOMA)',
    colors: {
      '--color-background': '#364143',
      '--color-background-accent': '#4B4A5A',
      '--color-primary': '#64617E',
      '--color-secondary': '#49585F',
      '--color-accent': '#B7BCC0',
      '--color-text-main': '#E2E8F0',
      '--color-text-muted': '#898F8F',
      '--color-border': '#64617E',
      '--color-surface-1': '#3E4B4D',
      '--color-surface-2': '#434E52',
      '--color-success': '#68A38F',
      '--color-danger': '#CF8D97',
      '--color-warning': '#AAAE7C',
      '--color-primary-transparent': 'rgba(100, 97, 126, 0.4)',
      '--color-danger-surface': 'rgba(207, 141, 151, 0.2)',
      '--color-success-surface': 'rgba(104, 163, 143, 0.2)',
    }
};

const critias1: Theme = {
    name: 'Critias',
    colors: {
      '--color-background': '#354457',
      '--color-background-accent': '#4C5F87',
      '--color-primary': '#8598C0',
      '--color-secondary': '#4C5F87',
      '--color-accent': '#C7D3CF',
      '--color-text-main': '#FFFFFF',
      '--color-text-muted': '#90A1A8',
      '--color-border': '#8598C0',
      '--color-surface-1': '#3D5067',
      '--color-surface-2': '#455A73',
      '--color-success': '#AAAE7C',
      '--color-danger': '#B1565B',
      '--color-warning': '#E3B289',
      '--color-primary-transparent': 'rgba(133, 152, 192, 0.4)',
      '--color-danger-surface': 'rgba(177, 86, 91, 0.2)',
      '--color-success-surface': 'rgba(170, 174, 124, 0.2)',
    }
};

const hermos: Theme = {
    name: 'Hermos',
    colors: {
      '--color-background': '#5A3A22',
      '--color-background-accent': '#90593B',
      '--color-primary': '#BA7C55',
      '--color-secondary': '#90593B',
      '--color-accent': '#EEE365',
      '--color-text-main': '#FFD8B1',
      '--color-text-muted': '#DFAD8A',
      '--color-border': '#BA7C55',
      '--color-surface-1': '#6B4628',
      '--color-surface-2': '#7C522E',
      '--color-success': '#68A38F',
      '--color-danger': '#B1565B',
      '--color-warning': '#FFD8B1',
      '--color-primary-transparent': 'rgba(186, 124, 85, 0.4)',
      '--color-danger-surface': 'rgba(177, 86, 91, 0.2)',
      '--color-success-surface': 'rgba(104, 163, 143, 0.2)',
    }
};

export const themes: Theme[] = [
    defaultTheme,
    fatigahTheme,
    orichalcosShunoros1,
    xyzDragonCannon1,
    princessChris2,
    maiKujaku1,
    critias1,
    hermos,
];
