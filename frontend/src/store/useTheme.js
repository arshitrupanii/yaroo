import { create } from 'zustand'

const DEFAULT_THEME = "retro";

const getInitialTheme = () => {
    const storedTheme = localStorage.getItem("chat-theme");

    if (!storedTheme || storedTheme === "dark") {
        localStorage.setItem("chat-theme", DEFAULT_THEME);
        return DEFAULT_THEME;
    }

    return storedTheme;
};

export const Usethemes = create((set)=>({
    theme : getInitialTheme(),
    
    setTheme : (theme) => {
        localStorage.setItem("chat-theme" , theme)
        set({theme})
    }
}))
