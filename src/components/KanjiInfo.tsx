import React from 'react';
import { KanjiData } from '../types';

interface KanjiInfoProps {
  kanjiData: KanjiData;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * KanjiInfo - Component to display information about the kanji
 */
export const KanjiInfo: React.FC<KanjiInfoProps> = ({ kanjiData, className, style }) => {
  const defaultStyle: React.CSSProperties = {
    marginTop: '1rem',
    padding: '1rem',
    border: '1px solid #ccc'
  };

  const mergedStyle = { ...defaultStyle, ...style };

  return (
    <div className={className || "kanji-info"} style={mergedStyle}>
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