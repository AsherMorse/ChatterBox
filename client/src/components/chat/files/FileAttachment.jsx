import PropTypes from 'prop-types';
import { useState } from 'react';

function FileAttachment({ attachment }) {
    const { fileName, fileType, fileSize, fileUrl } = attachment;
    const [isDownloading, setIsDownloading] = useState(false);
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        if (isDownloading) return;

        if (fileSize > MAX_FILE_SIZE) {
            alert(`File is too large to download (max ${formatFileSize(MAX_FILE_SIZE)})`);
            return;
        }
        
        try {
            setIsDownloading(true);
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading file:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const isFileTooLarge = fileSize > MAX_FILE_SIZE;

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-alice-blue 
                        dark:bg-[#2A2D30] w-full max-w-[400px] mb-2">
            <div className="text-emerald">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gunmetal dark:text-dark-text-primary truncate">
                    {fileName}
                </div>
                <p className={`text-xs ${isFileTooLarge ? 'text-red-500' : 'text-rose-quartz dark:text-dark-text-secondary'}`}>
                    {formatFileSize(fileSize)} {isFileTooLarge && '(Too large)'}
                </p>
            </div>
            <button
                onClick={handleDownload}
                disabled={isDownloading || isFileTooLarge}
                className={`
                    px-3 py-1.5 rounded-lg
                    flex items-center gap-1.5
                    text-sm font-medium
                    transition-all duration-200
                    ${isFileTooLarge 
                        ? 'text-red-500 hover:bg-red-500/10' 
                        : 'text-emerald hover:bg-emerald/10'
                    }
                    ${isDownloading ? 'opacity-75 cursor-wait' : ''}
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={isFileTooLarge ? `File is too large (max ${formatFileSize(MAX_FILE_SIZE)})` : ''}
            >
                {isDownloading ? (
                    <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Downloading...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isFileTooLarge ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            )}
                        </svg>
                        <span>{isFileTooLarge ? 'Too Large' : 'Download'}</span>
                    </>
                )}
            </button>
        </div>
    );
}

FileAttachment.propTypes = {
    attachment: PropTypes.shape({
        fileName: PropTypes.string.isRequired,
        fileType: PropTypes.string.isRequired,
        fileSize: PropTypes.number.isRequired,
        fileUrl: PropTypes.string.isRequired,
        thumbnailUrl: PropTypes.string
    }).isRequired
};

export default FileAttachment; 