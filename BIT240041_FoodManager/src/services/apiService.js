import { API_CONFIG, STORAGE_KEYS } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from './syncService';

// Hàm kiểm tra mạng nhanh
const checkNetwork = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected;
};

export const apiService = {
    getCategories: async () => {
        const isOnline = await checkNetwork();
        if (isOnline) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`);
                const data = await response.json();
                await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data)); // Lưu đệm cục bộ
                return data;
            } catch (error) {}
        }
        // Đọc từ máy ảo nếu mất mạng
        const local = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
        return local ? JSON.parse(local) : [];
    },

    getDishes: async () => {
        const isOnline = await checkNetwork();
        if (isOnline) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}`);
                const data = await response.json();
                await AsyncStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(data)); // Lưu đệm cục bộ
                return data;
            } catch (error) {}
        }
        const local = await AsyncStorage.getItem(STORAGE_KEYS.DISHES);
        return local ? JSON.parse(local) : [];
    },

    createDish: async (dishData) => {
        const isOnline = await checkNetwork();
        if (isOnline) {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dishData),
            });
            if (!response.ok) throw new Error('Lỗi thêm món ăn mới');
            return await response.json();
        } else {
            // XỬ LÝ OFFLINE: Lưu vào máy ảo và đẩy vào hàng đợi
            const tempId = `temp_${Date.now()}`;
            const newDish = { ...dishData, id: tempId };
            const localStr = await AsyncStorage.getItem(STORAGE_KEYS.DISHES);
            let localDishes = localStr ? JSON.parse(localStr) : [];
            localDishes.push(newDish);
            await AsyncStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(localDishes));
            
            await syncService.addToQueue('CREATE', dishData);
            return newDish;
        }
    },

    updateDish: async (id, dishData) => {
        const isOnline = await checkNetwork();
        if (isOnline && !id.toString().startsWith('temp_')) {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dishData),
            });
            if (!response.ok) throw new Error('Lỗi cập nhật món ăn');
            return await response.json();
        } else {
            // XỬ LÝ OFFLINE
            const localStr = await AsyncStorage.getItem(STORAGE_KEYS.DISHES);
            let localDishes = localStr ? JSON.parse(localStr) : [];
            const index = localDishes.findIndex(d => d.BIT240041_Id === dishData.BIT240041_Id);
            if (index >= 0) {
                localDishes[index] = { ...dishData, id };
                await AsyncStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(localDishes));
            }
            await syncService.addToQueue('UPDATE', dishData);
            return dishData;
        }
    },

    deleteDish: async (id) => {
        const isOnline = await checkNetwork();
        if (isOnline && !id.toString().startsWith('temp_')) {
            await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}/${id}`, { method: 'DELETE' });
        } else {
            const localStr = await AsyncStorage.getItem(STORAGE_KEYS.DISHES);
            let localDishes = localStr ? JSON.parse(localStr) : [];
            localDishes = localDishes.filter(d => d.id !== id);
            await AsyncStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(localDishes));
        }
    },

    deleteCategory: async (id) => {
        await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}/${id}`, { method: 'DELETE' });
    }
};