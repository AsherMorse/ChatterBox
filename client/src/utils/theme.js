// Initialize theme with dark mode as default
export const initializeTheme = () => {
    // Check if there's a saved preference
    const savedTheme = localStorage.getItem('theme');
    
    // If no saved preference, set dark mode as default
    if (!savedTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        return;
    }

    // Otherwise, apply the saved preference
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

// Toggle theme function for components to use
export const toggleTheme = (isDark, setIsDark) => {
    setIsDark(!isDark);
    if (!isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}; 