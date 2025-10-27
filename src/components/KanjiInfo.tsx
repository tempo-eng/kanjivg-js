import React from 'react';
import { KanjiData } from '../types';

interface KanjiInfoProps {
  kanjiData: KanjiData;
}

/**
 * KanjiInfo - Component to display information about the kanji
 */
export const KanjiInfo: React.FC<KanjiInfoProps> = ({ kanjiData }) => {
  return (
    <div className="kanji-info" style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
      <h3>Character: {kanjiData.character}</h3>
      <p>Stroke Count: {kanjiData.strokeCount}</p>
      {kanjiData.radicalInfo && (
        <p>Radical: {kanjiData.radicalInfo.radical}</p>
      )}
      {kanjiData.components && kanjiData.components.length > 0 && (
        <p>Components: {kanjiData.components.join(', ')}</p>
      )}
      {kanjiData.unicode && (
        <p>Unicode: U+{kanjiData.unicode.toUpperCase()}</p>
      )}
    </div>
  );
};