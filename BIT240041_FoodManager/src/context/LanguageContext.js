import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import { translations } from '../constants/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Đề bài yêu cầu ngôn ngữ mặc định là English ('en')
    const [language, setLanguage] = useState('en'); 

    // Khi app vừa mở, kiểm tra xem trước đó người dùng có chọn tiếng Việt không
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
                if (savedLang) {
                    setLanguage(savedLang);
                }
            } catch (error) {
                console.log('Lỗi tải ngôn ngữ:', error);
            }
        };
        loadLanguage();
    }, []);

    // Hàm chuyển đổi ngôn ngữ và lưu lại vào AsyncStorage
    const switchLanguage = async (lang) => {
        setLanguage(lang);
        await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    };

    // Hàm tự động dịch dựa trên key
    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, switchLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};