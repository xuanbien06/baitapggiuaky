import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_CONFIG } from '../constants/config';

export const syncService = {
    // Thêm một thao tác vào hàng đợi khi mất mạng
    addToQueue: async (action, data) => {
        try {
            const queueStr = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
            let queue = queueStr ? JSON.parse(queueStr) : [];
            
            if (action === 'UPDATE') {
                // Tối ưu: Nếu đang sửa món mà món đó vừa được TẠO MỚI lúc offline, ta gộp lại thành 1 lệnh CREATE
                const createIndex = queue.findIndex(q => q.action === 'CREATE' && q.data.BIT240041_Id === data.BIT240041_Id);
                if (createIndex >= 0) {
                    queue[createIndex].data = data; 
                } else {
                    // Nếu sửa một lệnh UPDATE cũ
                    const updateIndex = queue.findIndex(q => q.action === 'UPDATE' && q.data.BIT240041_Id === data.BIT240041_Id);
                    if(updateIndex >= 0) queue[updateIndex].data = data;
                    else queue.push({ action, data });
                }
            } else {
                queue.push({ action, data });
            }

            await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
        } catch (error) { console.log('Lỗi lưu queue:', error); }
    },

    // Hàm tự động chạy khi có mạng lại
    processQueue: async () => {
        try {
            const queueStr = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
            let queue = queueStr ? JSON.parse(queueStr) : [];
            if (queue.length === 0) return { count: 0 }; 

            let successCount = 0;

            for (let item of queue) {
                // Kiểm tra xem Id này đã tồn tại trên MockAPI chưa (Giải quyết chống trùng lặp theo đề bài)
                const checkRes = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}?BIT240041_Id=${item.data.BIT240041_Id}`);
                const checkData = await checkRes.json();
                const isExistOnServer = checkData && checkData.length > 0;
                
                if (item.action === 'CREATE') {
                    if (isExistOnServer) {
                        // Đã lên server trước đó nhưng bị rớt mạng lúc nhận -> Chuyển thành PUT cập nhật
                        await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}/${checkData[0].id}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.data)
                        });
                    } else {
                        // Chưa có -> Gửi POST tạo mới
                        await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.data)
                        });
                    }
                    successCount++;
                } else if (item.action === 'UPDATE' && isExistOnServer) {
                    await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISHES}/${checkData[0].id}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.data)
                    });
                    successCount++;
                }
            }
            
            // Xóa hàng đợi khi đồng bộ thành công
            await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
            return { count: successCount };
        } catch (error) {
            console.log('Lỗi đồng bộ:', error);
            return { count: 0, error: true };
        }
    }
};