import {
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
} from '@expo-google-fonts/rubik';
import {
  Assistant_400Regular,
  Assistant_600SemiBold,
  Assistant_700Bold,
} from '@expo-google-fonts/assistant';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/** Passed to expo-font's useFonts() — one entry per family file to load. */
export const fontAssets = {
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
  Assistant_400Regular,
  Assistant_600SemiBold,
  Assistant_700Bold,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
};

/**
 * Named roles instead of raw family strings at call sites — Rubik for
 * headings, Assistant for body copy, JetBrains Mono for eyebrows/labels/
 * numbers (tabular figures read well in a monospace face).
 */
const fonts = {
  displaySemiBold: 'Rubik_600SemiBold',
  displayBold: 'Rubik_700Bold',
  displayExtraBold: 'Rubik_800ExtraBold',

  bodyRegular: 'Assistant_400Regular',
  bodySemiBold: 'Assistant_600SemiBold',
  bodyBold: 'Assistant_700Bold',

  monoMedium: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
};

export default fonts;
