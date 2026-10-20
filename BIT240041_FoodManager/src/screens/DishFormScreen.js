import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/apiService';
import { LanguageContext } from '../context/LanguageContext';

export default function DishFormScreen({ route, navigation }) {
    const { t } = useContext(LanguageContext);
    
    const isEditMode = route.params && route.params.dish;
    const existingDish = isEditMode ? route.params.dish : null;

    const [categories, setCategories] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState(existingDish ? existingDish.BIT240041_Name : '');
    const [price, setPrice] = useState(existingDish ? existingDish.BIT240041_Price.toString() : '');
    const [prepTime, setPrepTime] = useState(existingDish ? existingDish.BIT240041_PreparationTime.toString() : '');
    const [description, setDescription] = useState(existingDish ? existingDish.BIT240041_Description : '');
    const [categoryId, setCategoryId] = useState(existingDish ? existingDish.BIT240041_DishCategoryId : '');
    const [isAvailable, setIsAvailable] = useState(existingDish ? existingDish.BIT240041_IsAvailable : true);

    const [images, setImages] = useState(existingDish && existingDish.BIT240041_DishImage ? existingDish.BIT240041_DishImage : []);
    const [newImageUrl, setNewImageUrl] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await apiService.getCategories();
                setCategories(cats);
                if (!isEditMode && cats.length > 0) setCategoryId(cats[0].BIT240041_Id);
            } catch (error) { Alert.alert(t('error'), t('errLoadCat')); } 
            finally { setLoadingCats(false); }
        };
        fetchCategories();
    }, []);

    const handleAddImage = () => {
        if (!newImageUrl.trim()) return;
        setImages([...images, { BIT240041_ImageUrl: newImageUrl.trim(), BIT240041_IsThumbnail: images.length === 0 }]);
        setNewImageUrl('');
    };

    const handleRemoveImage = (indexToRemove) => {
        let updatedImages = images.filter((_, index) => index !== indexToRemove);
        if (images[indexToRemove].BIT240041_IsThumbnail && updatedImages.length > 0) {
            updatedImages[0].BIT240041_IsThumbnail = true;
        }
        setImages(updatedImages);
    };

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert(t('error'), t('errEmpty')); return; }
        if (!categoryId) { Alert.alert(t('error'), t('errEmpty')); return; }
        
        const parsedPrice = parseInt(price);
        const parsedTime = parseInt(prepTime);
        if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { Alert.alert(t('error'), t('errPriceVal')); return; }
        if (!prepTime || isNaN(parsedTime) || parsedTime <= 0) { Alert.alert(t('error'), t('errTimeVal')); return; }

        setSaving(true);
        try {
            const allDishes = await apiService.getDishes();
            const isDuplicate = allDishes.some(d => 
                d.BIT240041_DishCategoryId === categoryId && 
                d.BIT240041_Name.trim().toLowerCase() === name.trim().toLowerCase() &&
                d.id !== (existingDish ? existingDish.id : null)
            );

            if (isDuplicate) {
                Alert.alert(t('error'), t('errDupName'));
                setSaving(false); return;
            }

            const dishData = {
                BIT240041_Id: existingDish ? existingDish.BIT240041_Id : `DISH_${new Date().getTime()}`,
                BIT240041_Name: name.trim(),
                BIT240041_Price: parsedPrice,
                BIT240041_PreparationTime: parsedTime,
                BIT240041_IsAvailable: isAvailable,
                BIT240041_Description: description.trim(),
                BIT240041_DishCategoryId: categoryId,
                BIT240041_DishImage: images
            };

            if (isEditMode) {
                await apiService.updateDish(existingDish.id, dishData);
                Alert.alert(t('success'), t('updateSuccess'), [{ text: 'OK', onPress: () => navigation.navigate('DishList') }]);
            } else {
                await apiService.createDish(dishData);
                Alert.alert(t('success'), t('addSuccess'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
            }
        } catch (error) { Alert.alert(t('sysErr'), error.message); } 
        finally { setSaving(false); }
    };

    if (loadingCats) return <ActivityIndicator size="large" color="#4CAF50" style={{flex: 1, justifyContent: 'center'}} />;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>{t('dishName')}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('namePlaceholder')} />

            <Text style={styles.label}>{t('priceLabel')}</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

            <Text style={styles.label}>{t('prepTimeFormLabel')}</Text>
            <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" />

            <Text style={styles.label}>{t('catLabel')}</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={categoryId} onValueChange={(val) => setCategoryId(val)}>
                    {categories.map((cat) => (
                        <Picker.Item key={cat.id} label={cat.BIT240041_Name} value={cat.BIT240041_Id} />
                    ))}
                </Picker>
            </View>

            <View style={styles.switchRow}>
                <Text style={styles.label}>{t('isAvailLabel')}</Text>
                <Switch value={isAvailable} onValueChange={setIsAvailable} />
            </View>

            <Text style={styles.label}>{t('descLabel')}</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder={t('descPlaceholder')} multiline numberOfLines={4} />

            <Text style={styles.label}>{t('imgUrlLabel')}</Text>
            <View style={styles.imageInputRow}>
                <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} value={newImageUrl} onChangeText={setNewImageUrl} placeholder={t('imgPlaceholder')} />
                <TouchableOpacity style={styles.addImageBtn} onPress={handleAddImage}>
                    <Text style={styles.addImageText}>{t('addBtn')}</Text>
                </TouchableOpacity>
            </View>

            {images.map((img, index) => (
                <View key={index} style={styles.imageItem}>
                    <Image source={{ uri: img.BIT240041_ImageUrl }} style={styles.previewImg} />
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text numberOfLines={1} style={{ fontSize: 12, color: '#666' }}>{img.BIT240041_ImageUrl}</Text>
                        {img.BIT240041_IsThumbnail && <Text style={styles.thumbBadge}>{t('currentThumb')}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveImage(index)}>
                        <Text style={styles.removeText}>{t('delete')}</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
            </TouchableOpacity>
            <View style={{height: 40}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
    pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fafafa', marginBottom: 10 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 10 },
    textArea: { height: 100, textAlignVertical: 'top' },
    imageInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    addImageBtn: { backgroundColor: '#2196F3', padding: 13, borderRadius: 8, marginLeft: 10 },
    addImageText: { color: '#fff', fontWeight: 'bold' },
    imageItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    previewImg: { width: 40, height: 40, borderRadius: 5, backgroundColor: '#ccc' },
    thumbBadge: { color: '#4CAF50', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    removeText: { color: '#e53935', fontWeight: 'bold', padding: 5 },
    saveBtn: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
    saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});