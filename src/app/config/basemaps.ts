export type BasemapMode = 'voyager' | 'swissLight' | 'swissImagery' | 'none';

export const DEFAULT_BASEMAP: BasemapMode = 'swissLight';

export const BASEMAP_OPTIONS = [
  {
    key: 'voyager',
    label: 'Voyager',
    description: 'Fond clair detaille pour la lecture urbaine.',
  },
  {
    key: 'swissLight',
    label: 'Swiss Light',
    description: 'Fond swisstopo sobre pour les structures territoriales.',
  },
  {
    key: 'swissImagery',
    label: 'Swiss Imagerie',
    description: 'Orthophoto pour verifier le terrain.',
  },
  {
    key: 'none',
    label: 'Sans fond',
    description: "Vue analytique centree sur l'indice uniquement.",
  },
] as const satisfies ReadonlyArray<{
  key: BasemapMode;
  label: string;
  description: string;
}>;
