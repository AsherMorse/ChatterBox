import PropTypes from 'prop-types';

const Footer = ({ onToggle }) => {
    return (
        <footer className="bg-white shadow-sm p-4 mt-auto">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <p className="text-sm text-gray-600">© 2024 ChatGenius. All rights reserved.</p>
                <button
                    onClick={onToggle}
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    Toggle Footer
                </button>
            </div>
        </footer>
    );
};

Footer.propTypes = {
    onToggle: PropTypes.func.isRequired,
};

export default Footer; 