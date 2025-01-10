import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

function FileUpload({ onFileSelect, disabled }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (disabled) return;
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (disabled) return;
        
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const handleButtonClick = (e) => {
        e.stopPropagation();
        if (disabled) return;
        fileInputRef.current?.click();
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative flex items-center justify-center
                ${isDragging ? 'opacity-70' : ''}
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
        >
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
                onClick={(e) => e.stopPropagation()}
            />
            <button
                type="button"
                onClick={handleButtonClick}
                disabled={disabled}
                className={`
                    p-2
                    text-rose-quartz dark:text-dark-text-secondary
                    hover:text-emerald dark:hover:text-emerald
                    transition-colors duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title="Attach file"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            </button>
        </div>
    );
}

FileUpload.propTypes = {
    onFileSelect: PropTypes.func.isRequired,
    disabled: PropTypes.bool
};

export default FileUpload; 