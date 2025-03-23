import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
            <input
                type="text"
                placeholder="Buscar productos o promociones..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: '10px', width: '300px', marginRight: '10px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Buscar
            </button>
        </form>
    );
};

export default SearchBar;