import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { updatePresence, updateCustomStatus } from '../../services/api/userStatus';

const DEFAULT_COLORS = [
    '#10B981', // emerald
    '#14B8A6', // teal
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#EF4444', // red
    '#F59E0B', // yellow
];

function UserStatusEditor({ currentUser, onLogout }) {
    const [isPresenceMenuOpen, setIsPresenceMenuOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(currentUser?.custom_status_color || DEFAULT_COLORS[0]);
    const [customStatusText, setCustomStatusText] = useState(currentUser?.custom_status_text || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const menuRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Set default presence to online if not set
        if (currentUser && currentUser.presence === null) {
            handlePresenceChange('online');
        }
        setSelectedColor(currentUser?.custom_status_color || getPresenceColor(currentUser?.presence || 'online'));
        setCustomStatusText(currentUser?.custom_status_text || getPresenceText(currentUser?.presence || 'online'));
    }, [currentUser]);

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsPresenceMenuOpen(false);
        }, 300);
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    const getPresenceColor = (presence) => {
        switch (presence) {
            case 'online': return '#10B981'; // emerald
            case 'idle': return '#F59E0B'; // yellow
            case 'offline': return '#94A3B8'; // slate-400 (grey)
            default: return DEFAULT_COLORS[0];
        }
    };

    const handlePresenceChange = async (newPresence) => {
        if (isUpdating) return;
        
        try {
            setIsUpdating(true);
            console.log('Updating presence to:', newPresence);
            await updatePresence(newPresence);
            
            const presenceColor = getPresenceColor(newPresence);
            console.log('Updating custom status with color:', presenceColor);
            
            // Set custom status when changing presence
            await updateCustomStatus({ 
                custom_status_text: getPresenceText(newPresence),
                custom_status_color: presenceColor
            });
            
            setCustomStatusText(getPresenceText(newPresence));
            setSelectedColor(presenceColor);
            setIsPresenceMenuOpen(false);
        } catch (error) {
            console.error('Error updating presence:', error);
            // Revert to previous state on error
            setCustomStatusText(currentUser?.custom_status_text || getPresenceText(currentUser?.presence || 'online'));
            setSelectedColor(currentUser?.custom_status_color || getPresenceColor(currentUser?.presence || 'online'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleColorChange = async (color) => {
        if (isUpdating) return;
        
        try {
            setIsUpdating(true);
            console.log('Updating status color to:', color);
            await updateCustomStatus({ custom_status_color: color });
            setSelectedColor(color);
        } catch (error) {
            console.error('Error updating status color:', error);
            // Revert to previous color on error
            setSelectedColor(currentUser?.custom_status_color || getPresenceColor(currentUser?.presence || 'online'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStatusTextChange = async (text) => {
        if (isUpdating) return;
        
        try {
            setIsUpdating(true);
            setCustomStatusText(text);
            console.log('Updating status text to:', text);
            await updateCustomStatus({ 
                custom_status_text: text,
                custom_status_color: selectedColor 
            });
        } catch (error) {
            console.error('Error updating status text:', error);
            // Revert to previous text on error
            setCustomStatusText(currentUser?.custom_status_text || getPresenceText(currentUser?.presence || 'online'));
        } finally {
            setIsUpdating(false);
        }
    };

    const getPresenceText = (presence) => {
        switch (presence) {
            case 'online': return 'Online';
            case 'idle': return 'Idle';
            case 'offline': return 'Offline';
            default: return 'Online';
        }
    };

    return (
        <div className="p-4 border-t border-powder-blue dark:border-dark-border bg-[#F8FAFD] dark:bg-dark-bg-secondary">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-powder-blue dark:bg-dark-border overflow-hidden">
                            {currentUser?.avatar_url ? (
                                <img
                                    src={currentUser.avatar_url}
                                    alt={currentUser.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-base font-medium text-gunmetal dark:text-dark-text-primary">
                                    {currentUser?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-bg-secondary">
                            <div className={`w-full h-full rounded-full`} style={{ backgroundColor: selectedColor }} />
                        </div>

                        {/* Presence Menu */}
                        {isPresenceMenuOpen && (
                            <div 
                                ref={menuRef}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                className="absolute bottom-full left-0 mb-1 bg-white dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border rounded-lg shadow-lg py-1 z-50 animate-slideUp min-w-[120px]"
                            >
                                {/* Default Statuses */}
                                <div className="px-3 py-1 text-xs text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider font-medium">
                                    Status
                                </div>
                                <button
                                    onClick={() => handlePresenceChange('online')}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-alice-blue dark:hover:bg-dark-bg-secondary transition-colors duration-200 text-gunmetal dark:text-dark-text-primary"
                                >
                                    <div className="w-2 h-2 rounded-full bg-emerald" />
                                    <span>Online</span>
                                </button>
                                <button
                                    onClick={() => handlePresenceChange('idle')}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-alice-blue dark:hover:bg-dark-bg-secondary transition-colors duration-200 text-gunmetal dark:text-dark-text-primary"
                                >
                                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                    <span>Idle</span>
                                </button>
                                <button
                                    onClick={() => handlePresenceChange('offline')}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-alice-blue dark:hover:bg-dark-bg-secondary transition-colors duration-200 text-gunmetal dark:text-dark-text-primary"
                                >
                                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                                    <span>Offline</span>
                                </button>
                                <div className="px-3 py-1.5 flex justify-center">
                                    <input
                                        type="text"
                                        value={customStatusText}
                                        onChange={(e) => handleStatusTextChange(e.target.value)}
                                        className="w-full text-xs px-2 py-1 rounded bg-alice-blue dark:bg-dark-bg-secondary border border-powder-blue dark:border-dark-border focus:outline-none focus:border-emerald dark:focus:border-emerald text-gunmetal dark:text-dark-text-primary"
                                        placeholder="Set a status..."
                                        maxLength={50}
                                    />
                                </div>

                                {/* Color Picker */}
                                <div className="border-t border-powder-blue dark:border-dark-border mt-1 pt-1">
                                    <div className="px-3 py-1 text-xs text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider font-medium">
                                        Color
                                    </div>
                                    <div className="px-3 py-1.5 flex flex-wrap gap-1.5 justify-center">
                                        {DEFAULT_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => handleColorChange(color)}
                                                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                                                    selectedColor === color 
                                                        ? 'border-emerald scale-110' 
                                                        : 'border-transparent hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <div className="px-3 py-1.5 flex justify-center">
                                        <input
                                            type="text"
                                            value={selectedColor}
                                            onChange={(e) => {
                                                const color = e.target.value;
                                                if (color.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                                                    setSelectedColor(color);
                                                    if (color.length === 7) {
                                                        handleColorChange(color);
                                                    }
                                                }
                                            }}
                                            className="w-[88px] text-xs px-2 py-1 rounded bg-alice-blue dark:bg-dark-bg-secondary border border-powder-blue dark:border-dark-border focus:outline-none focus:border-emerald dark:focus:border-emerald text-gunmetal dark:text-dark-text-primary text-center"
                                            placeholder="#000000"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                            {currentUser?.username || 'Unknown User'}
                        </span>
                        <button
                            onClick={() => setIsPresenceMenuOpen(!isPresenceMenuOpen)}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className="flex items-center gap-1.5 text-sm text-rose-quartz dark:text-dark-text-secondary hover:text-emerald transition-colors duration-200"
                        >
                            {customStatusText ? (
                                <span style={{ color: selectedColor }}>{customStatusText}</span>
                            ) : (
                                <span>{getPresenceText(currentUser.presence)}</span>
                            )}
                        </button>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="p-2 text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200 rounded-xl hover:bg-alice-blue dark:hover:bg-dark-bg-primary"
                    title="Sign out"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

UserStatusEditor.propTypes = {
    currentUser: PropTypes.shape({
        id: PropTypes.string,
        username: PropTypes.string,
        avatar_url: PropTypes.string,
        presence: PropTypes.oneOf(['online', 'offline', 'idle']),
        custom_status_text: PropTypes.string,
        custom_status_color: PropTypes.string
    }).isRequired,
    onLogout: PropTypes.func.isRequired
};

export default UserStatusEditor; 