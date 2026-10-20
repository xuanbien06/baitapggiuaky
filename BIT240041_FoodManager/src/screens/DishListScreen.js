import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image, TextInput, Switch, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/apiService';
import { LanguageContext } from '../context/LanguageContext';

export default function DishListScreen({ navigation }) {
    const { t } = useContext(LanguageContext); // Lấy hàm dịch t() từ Context

    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterAvailable, setFilterAvailable] = useState(false);
    const [filterMinPrice, setFilterMinPrice] = useState('');
    const [filterMaxPrice, setFilterMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('none');
    const [showCatModal, setShowCatModal] = useState(false);

    const fetchCats = async () => {
        try {
            const cats = await apiService.getCategories();
            setCategories(cats);
        } catch (error) {}
    };

    const loadData = async () => {
        setLoading(true);
        try {
            await fetchCats();
            const data = await apiService.getDishes();
            setDishes(data);
        } catch (error) { Alert.alert(t('error'), error.message); } 
        finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleDeleteDish = (id) => {
        Alert.alert(t('delete'), t('confirmDelDish'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: async () => {
                    try { await apiService.deleteDish(id); loadData(); } 
                    catch (error) { Alert.alert(t('error'), error.message); }
            }}
        ]);
    };

    const handleDeleteCategory = (cat) => {
        const isUsed = dishes.some(dish => dish.BIT240041_DishCategoryId === cat.BIT240041_Id);
        if (isUsed) {
            Alert.alert(t('error'), t('errDelCat'));
            return;
        }
        Alert.alert(t('delete'), t('confirmDelCat'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: async () => {
                try {
                    await apiService.deleteCategory(cat.id);
                    Alert.alert(t('success'), t('delCatSuccess'));
                    loadData();
                } catch (error) { Alert.alert(t('error'), error.message); }
            }}
        ]);
    };

    let priceError = '';
    if (filterMinPrice && filterMaxPrice && parseInt(filterMinPrice) > parseInt(filterMaxPrice)) priceError = t('errorPrice');

    const processedDishes = dishes.filter(dish => {
        if (searchQuery && !dish.BIT240041_Name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterCategory !== 'ALL' && dish.BIT240041_DishCategoryId !== filterCategory) return false;
        if (filterAvailable && !dish.BIT240041_IsAvailable) return false;
        if (priceError) return false;
        const price = dish.BIT240041_Price;
        if (filterMinPrice && price < parseInt(filterMinPrice)) return false;
        if (filterMaxPrice && price > parseInt(filterMaxPrice)) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_asc') return a.BIT240041_Price - b.BIT240041_Price;
        if (sortBy === 'price_desc') return b.BIT240041_Price - a.BIT240041_Price;
        if (sortBy === 'time_asc') return a.BIT240041_PreparationTime - b.BIT240041_PreparationTime;
        return 0; 
    });

    const renderItem = ({ item }) => {
        const thumbnail = item.BIT240041_DishImage?.find(img => img.BIT240041_IsThumbnail) || item.BIT240041_DishImage?.[0];
        return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DishDetail', { dish: item })}>
                {thumbnail ? (<Image source={{ uri: thumbnail.BIT240041_ImageUrl }} style={styles.image} />) : 
                (<View style={[styles.image, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}><Text style={{color: '#fff', fontSize: 10}}>No Image</Text></View>)}
                <View style={styles.info}>
                    <Text style={styles.name}>{item.BIT240041_Name}</Text>
                    <Text style={styles.price}>{item.BIT240041_Price.toLocaleString('vi-VN')} VNĐ</Text>
                    <Text style={styles.time}>⏱ {item.BIT240041_PreparationTime} {t('mins')}</Text>
                    {!item.BIT240041_IsAvailable && <Text style={styles.unavailable}>{t('unavailable')}</Text>}
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteDish(item.id)}>
                    <Text style={styles.deleteText}>{t('delete')}</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    if (loading) return <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />;

    return (
        <View style={styles.container}>
            <TextInput style={styles.searchInput} placeholder={t('search')} value={searchQuery} onChangeText={setSearchQuery} />
            
            <TouchableOpacity style={styles.toggleFilterBtn} onPress={() => setShowFilters(!showFilters)}>
                <Text style={styles.toggleFilterText}>{showFilters ? t('hideFilter') : t('showFilter')}</Text>
            </TouchableOpacity>

            {showFilters && (
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>{t('category')}</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker selectedValue={filterCategory} onValueChange={(val) => setFilterCategory(val)}>
                            <Picker.Item label={t('allCategories')} value="ALL" />
                            {categories.map(cat => (<Picker.Item key={cat.id} label={cat.BIT240041_Name} value={cat.BIT240041_Id} />))}
                        </Picker>
                    </View>
                    <View style={styles.switchRow}>
                        <Text style={styles.filterLabel}>{t('onlyAvailable')}</Text>
                        <Switch value={filterAvailable} onValueChange={setFilterAvailable} />
                    </View>
                    <Text style={styles.filterLabel}>{t('priceRange')}</Text>
                    <View style={styles.priceRow}>
                        <TextInput style={styles.priceInput} placeholder={t('min')} keyboardType="numeric" value={filterMinPrice} onChangeText={setFilterMinPrice} />
                        <Text style={{marginHorizontal: 10}}>-</Text>
                        <TextInput style={styles.priceInput} placeholder={t('max')} keyboardType="numeric" value={filterMaxPrice} onChangeText={setFilterMaxPrice} />
                    </View>
                    {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
                    <Text style={styles.filterLabel}>{t('sortBy')}</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker selectedValue={sortBy} onValueChange={(val) => setSortBy(val)}>
                            <Picker.Item label={t('sortNone')} value="none" />
                            <Picker.Item label={t('sortPriceAsc')} value="price_asc" />
                            <Picker.Item label={t('sortPriceDesc')} value="price_desc" />
                            <Picker.Item label={t('sortTimeAsc')} value="time_asc" />
                        </Picker>
                    </View>
                    <TouchableOpacity style={styles.clearBtn} onPress={() => { setSearchQuery(''); setFilterCategory('ALL'); setFilterAvailable(false); setFilterMinPrice(''); setFilterMaxPrice(''); setSortBy('none'); }}>
                        <Text style={styles.clearBtnText}>{t('clearFilters')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.addBtn, {flex: 1, marginRight: 5}]} onPress={() => navigation.navigate('DishForm')}>
                    <Text style={styles.addBtnText}>{t('addDish')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addBtn, {flex: 1, marginLeft: 5, backgroundColor: '#2196F3'}]} onPress={() => setShowCatModal(true)}>
                    <Text style={styles.addBtnText}>{t('manageCat')}</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList data={processedDishes} keyExtractor={(item) => item.id.toString()} renderItem={renderItem} ListEmptyComponent={<Text style={styles.emptyText}>{t('noData')}</Text>} />

            <Modal visible={showCatModal} animationType="slide" transparent={true}>
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('catList')}</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({item}) => (
                                <View style={styles.catItem}>
                                    <Text style={{fontWeight: 'bold', flex: 1}}>{item.BIT240041_Name}</Text>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteCategory(item)}>
                                        <Text style={styles.deleteText}>{t('delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                        <TouchableOpacity style={[styles.addBtn, {backgroundColor: '#666', marginTop: 15}]} onPress={() => setShowCatModal(false)}>
                            <Text style={styles.addBtnText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Giữ nguyên toàn bộ StyleSheet cũ
const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
    loader: { flex: 1, justifyContent: 'center' },
    searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16, marginBottom: 10 },
    toggleFilterBtn: { padding: 10, backgroundColor: '#e0e0e0', borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    toggleFilterText: { fontWeight: 'bold', color: '#333' },
    filterContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    filterLabel: { fontWeight: 'bold', marginBottom: 5, color: '#444' },
    pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10, backgroundColor: '#fafafa' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    priceInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fafafa' },
    errorText: { color: 'red', fontSize: 12, marginBottom: 10, fontStyle: 'italic' },
    clearBtn: { marginTop: 10, padding: 10, backgroundColor: '#ff9800', borderRadius: 8, alignItems: 'center' },
    clearBtnText: { color: '#fff', fontWeight: 'bold' },
    actionRow: { flexDirection: 'row', marginBottom: 15 },
    addBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center' },
    addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, marginBottom: 10, borderRadius: 8, elevation: 3, alignItems: 'center' },
    image: { width: 70, height: 70, borderRadius: 8, marginRight: 15 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    price: { fontSize: 14, color: '#e53935', fontWeight: '500' },
    time: { fontSize: 12, color: '#666', marginTop: 3 },
    unavailable: { fontSize: 12, color: '#9e9e9e', marginTop: 5, fontStyle: 'italic' },
    deleteBtn: { padding: 10, backgroundColor: '#ffebee', borderRadius: 8 },
    deleteText: { color: '#d32f2f', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    catItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' }
});