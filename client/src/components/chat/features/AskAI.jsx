import React, { useState } from 'react';
import { askAI } from '../../../services/api/askService';

const AskAI = () => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const result = await askAI(query);
            setResponse(result);
        } catch (err) {
            setError(err.message || 'Failed to get AI response');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-white dark:bg-dark-bg-secondary rounded-lg shadow">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about the chat history..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald dark:bg-dark-bg-primary dark:border-dark-border"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Thinking...' : 'Ask'}
                </button>
            </form>

            {error && (
                <div className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    {error}
                </div>
            )}

            {response && (
                <div className="flex flex-col gap-3">
                    <div className="p-4 bg-emerald/5 dark:bg-emerald/10 rounded-lg">
                        <h3 className="font-semibold mb-2">Answer:</h3>
                        <p className="text-gray-700 dark:text-gray-300">{response.answer}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-dark-bg-primary rounded-lg">
                        <h3 className="font-semibold mb-2">Context from chat history:</h3>
                        <div className="space-y-2">
                            {response.context.map((doc, index) => (
                                <div key={index} className="p-2 bg-white dark:bg-dark-bg-secondary rounded border dark:border-dark-border">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{doc.content}</p>
                                    {doc.metadata && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            {doc.metadata.senderId && <span>From: {doc.metadata.senderId}</span>}
                                            {doc.metadata.createdAt && (
                                                <span className="ml-2">
                                                    at: {new Date(doc.metadata.createdAt).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AskAI; 