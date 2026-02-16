import React from 'react';

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    if (pageNumbers.length <= 1) return null; // No mostrar si solo hay 1 página

    return (
        <nav style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <ul style={{ display: 'flex', listStyle: 'none', padding: 0, gap: '5px' }}>
                {pageNumbers.map((number) => (
                    <li key={number}>
                        <button 
                            onClick={() => paginate(number)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                background: number === currentPage ? '#007bff' : '#fff',
                                color: number === currentPage ? '#fff' : '#333',
                                cursor: 'pointer',
                                fontWeight: number === currentPage ? 'bold' : 'normal',
                            }}
                        >
                            {number}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Pagination;