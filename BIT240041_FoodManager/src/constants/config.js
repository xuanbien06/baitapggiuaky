// Thay chuỗi URL_MOCKAPI_CUA_BAN bằng URL gốc thực tế của bạn trên MockAPI
// LƯU Ý: Không có dấu gạch chéo (/) ở cuối URL
const BASE_URL = 'https://6ad713aef71f154ac487b494.mockapi.io/api/v1';

export const API_CONFIG = {
  BASE_URL: BASE_URL,
  ENDPOINTS: {
    CATEGORIES: '/BIT240041_DishCategory',
    DISHES: '/BIT240041_Dish',
  }
};

export const STORAGE_KEYS = {
  CATEGORIES: 'BIT240041_Storage_DishCategory',
  DISHES: 'BIT240041_Storage_Dish',
  SYNC_QUEUE: 'BIT240041_Storage_SyncQueue',
  LANGUAGE: 'BIT240041_Storage_Language'
};