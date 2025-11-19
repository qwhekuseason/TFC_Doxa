import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface QuizConfig {
  mode: 'random' | 'specific';
  book?: string;
  chapter?: number;
  questionCount: number;
}

export default function BibleQuiz({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [config, setConfig] = useState<QuizConfig>({
    mode: 'random',
    questionCount: 10
  });
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      // Use Bible API to fetch passages and generate questions
      const response = await fetch(
        config.mode === 'specific'
          ? `https://bible-api.com/${config.book}+${config.chapter}`
          : 'https://bible-api.com/john+3:16' // Replace with random verse logic
      );
      
      const data = await response.json();
      // Transform Bible API response into quiz questions
      // This is a simplified example - enhance based on your needs
      // Use passage text if available to create a sample question
      console.log(data);
      const passageText = (data && (data.text || data[0]?.text || '')) as string;
      setQuestions([
        {
          text: passageText ? `Based on the passage: ${passageText}` : 'Sample question based on passage',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correct: 0
        }
        // Generate more questions based on the passage
      ]);
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) generateQuiz();
  }, [isOpen, config]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bible Quiz</h2>
            <button onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quiz Configuration */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="block mb-2">Quiz Mode</label>
              <select
                value={config.mode}
                onChange={(e) => setConfig({ ...config, mode: e.target.value as 'random' | 'specific' })}
                className="w-full p-2 border rounded"
              >
                <option value="random">Random Questions</option>
                <option value="specific">Specific Book/Chapter</option>
              </select>
            </div>

            {config.mode === 'specific' && (
              <>
                <div>
                  <label className="block mb-2">Book</label>
                  <input
                    type="text"
                    value={config.book}
                    onChange={(e) => setConfig({ ...config, book: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. John"
                  />
                </div>
                <div>
                  <label className="block mb-2">Chapter</label>
                  <input
                    type="number"
                    value={config.chapter}
                    onChange={(e) => setConfig({ ...config, chapter: Number(e.target.value) })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. 3"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block mb-2">Number of Questions</label>
              <input
                type="number"
                value={config.questionCount}
                onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })}
                className="w-full p-2 border rounded"
                min="1"
                max="20"
              />
            </div>

            <button
              onClick={generateQuiz}
              disabled={loading}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {loading ? 'Generating Quiz...' : 'Generate New Quiz'}
            </button>
          </div>

          {/* Quiz Questions */}
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <p className="font-medium mb-4">{q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt: string, j: number) => (
                    <button
                      key={j}
                      className="w-full p-2 text-left border rounded hover:bg-gray-50"
                      onClick={() => {/* Handle answer selection */}}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}