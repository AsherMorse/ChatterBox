import PropTypes from 'prop-types';

function FileAttachment({ attachment }) {
    const { fileName, fileType, fileSize, fileUrl } = attachment;

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        try {
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
        }
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-alice-blue dark:bg-dark-bg-primary max-w-sm">
            <div className="text-emerald">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gunmetal dark:text-dark-text-primary truncate">
                    {fileName}
                </div>
                <p className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                    {formatFileSize(fileSize)}
                </p>
            </div>
            <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-emerald hover:bg-emerald/90 text-white text-sm rounded-md transition-colors duration-200"
            >
                Download
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