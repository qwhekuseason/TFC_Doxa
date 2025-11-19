import { useEffect, useState } from 'react';

interface BibleReaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BibleReader({ isOpen, onClose }: BibleReaderProps) {
  const [query, setQuery] = useState('John 3');
  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Reset when opened
    setVerses('');
    setError(null);
  }, [isOpen]);

  const fetchPassage = async (q: string) => {
    setLoading(true);
    setError(null);
    setVerses('');
    try {
      // public endpoint: https://bible-api.com/
      const encoded = encodeURIComponent(q.trim());
      const res = await fetch(`https://bible-api.com/${encoded}`);
      if (!res.ok) {
        throw new Error('Unable to load passage');
      }
      const data = await res.json();
      if (data?.text) {
        setVerses(data.text);
      } else if (Array.isArray(data?.verses)) {
        // fallback assemble
        setVerses(data.verses.map((v: any) => `${v.verse}. ${v.text}`).join('\n'));
      } else {
        setVerses('No text available for this reference.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch passage');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-3xl mx-auto my-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Bible Reader</h3>
          <button onClick={onClose} className="text-sm text-gray-600 dark:text-gray-300">Close</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border"
            placeholder="e.g. John 3 or Genesis 1:1-10"
          />
          <button
            onClick={() => fetchPassage(query)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Read'}
          </button>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        <div className="prose max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
          {verses || <p className="text-gray-500">Enter a reference and click Read to fetch the passage.</p>}
        </div>
      </div>
    </div>
  );
}