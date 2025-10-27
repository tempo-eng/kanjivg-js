import React, { useState, useEffect } from 'react';
import { KanjiCard, createKanjiVG, KanjiInfo } from 'kanjivg-js';
import './App.css';

function App() {
  const [kanji, setKanji] = useState<KanjiInfo | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [kanjivg, setKanjivg] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize KanjiVG
  useEffect(() => {
    const initKanjiVG = async () => {
      try {
        // Create KanjiVG instance with bundled data
        const kv = await createKanjiVG(50);
        setKanjivg(kv);
      } catch (error) {
        console.error('Failed to initialize KanjiVG:', error);
      }
    };
    initKanjiVG();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kanjivg || !inputValue.trim()) return;

    setLoading(true);
    try {
      const result = await kanjivg.lookup(inputValue.trim());
      if (result) {
        setKanji(result);
      } else {
        alert('Kanji not found');
      }
    } catch (error) {
      console.error('Error looking up kanji:', error);
      alert('Error looking up kanji');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomKanji = async () => {
    if (!kanjivg) return;

    setLoading(true);
    try {
      // Get a random kanji from the search results
      // const results = await kanjivg.search('行'); // Start with a common kanji
      const results = [await kanjivg.getRandom()];
      console.log(results);
      if (results && results.length > 0) {
        // Get a random kanji from the first few results
        const randomIndex = Math.floor(Math.random() * Math.min(results.length, 10));
        setKanji(results[randomIndex]);
        setInputValue(results[randomIndex].character);
      }
    } catch (error) {
      console.error('Error getting random kanji:', error);
      alert('Error getting random kanji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>KanjiVG Demo</h1>
        
        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Enter a kanji character"
              maxLength={1}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !inputValue.trim()}>
              {loading ? 'Loading...' : 'Show Kanji'}
            </button>
          </form>
          
          <button 
            onClick={handleRandomKanji} 
            disabled={loading}
            className="random-button"
          >
            Choose Random Kanji
          </button>
        </div>

        {kanji && (
          <div className="kanji-display">
            {/* <h2>{kanji.character}</h2> */}
            <KanjiCard
              kanji={kanji}
              showInfo={false}
              animationOptions={{
                strokeDuration: 800, // ✅ Duration of each stroke in ms
                strokeDelay: 500, // ✅ Delay between strokes in ms
                flashNumbers: false, // ✅ Show stroke numbers
                showNumbers: true,
                loop: false, // ✅ Don't loop animation
                showTrace: true,
                strokeStyling: {
                  strokeColour: 'black',
                  strokeThickness: 6,
                  strokeRadius: 10,
                },
                radicalStyling: {
                  radicalColour:'#ff0000',
                  radicalThickness: 2,
                  radicalRadius: 0,
                },
                traceStyling: {
                  traceColour: '#a9a5a5',
                  traceThickness: 2,
                  traceRadius: 0,
                },
                numberStyling: {
                  fontColour: '#10d6a1',
                  fontWeight: 900,
                  fontSize: 12,
                }
              }}
            />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;