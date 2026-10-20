import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { apiService } from '../services/apiService';
import { LanguageContext } from '../context/LanguageContext';

export default function DishDetailScreen({ route, navigation }) {
    const { t } = useContext(LanguageContext);
    const [dishInfo, setDishInfo] = useState(route.params.dish);

    const images = dishInfo.BIT240041_DishImage || [];
    const thumbnail = images.find(img => img.BIT240041_IsThumbnail) || images[0];

    const prepTime = dishInfo.BIT240041_PreparationTime;
    const timeLabel = prepTime <= 15 ? `Quick / ${t('quick')}` : `Regular / ${t('regular')}`;
    const timeColor = prepTime <= 15 ? '#4CAF50' : '#ff9800'; 

    const handleSetThumbnail = (selectedIndex) => {
        Alert.alert(t('changeThumbConfirm'), '', [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('agree'),
                onPress: async () => {
                    try {
                        const updatedImages = images.map((img, index) => ({
                            ...img,
                            BIT240041_IsThumbnail: index === selectedIndex
                        }));
                        const updatedDish = { ...dishInfo, BIT240041_DishImage: updatedImages };
                        setDishInfo(updatedDish);
                        await apiService.updateDish(dishInfo.id, updatedDish);
                        Alert.alert(t('success'), t('changeThumbSuccess'));
                    } catch (error) { Alert.alert(t('error'), error.message); }
                }
            }
        ]);
    };

    return (
        <ScrollView style={styles.container}>
            {thumbnail ? (
                <Image source={{ uri: thumbnail.BIT240041_ImageUrl }} style={styles.image} />
            ) : (
                <View style={[styles.image, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{color: '#777'}}>{t('noImage')}</Text>
                </View>
            )}

            <View style={styles.details}>
                <Text style={styles.name}>{dishInfo.BIT240041_Name}</Text>
                <Text style={styles.price}>{dishInfo.BIT240041_Price.toLocaleString('vi-VN')} VNĐ</Text>
                
                <View style={[styles.timeBadge, { backgroundColor: timeColor }]}>
                    <Text style={styles.timeBadgeText}>⏱ {prepTime} {t('mins')} ({timeLabel})</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('status')}</Text>
                    <Text style={[styles.value, { color: dishInfo.BIT240041_IsAvailable ? '#4CAF50' : '#e53935' }]}>
                        {dishInfo.BIT240041_IsAvailable ? t('available') : t('unavailable')}
                    </Text>
                </View>

                <Text style={styles.descTitle}>{t('descDetail')}</Text>
                <Text style={styles.description}>{dishInfo.BIT240041_Description}</Text>

                {images.length > 0 && (
                    <View style={styles.galleryContainer}>
                        <Text style={styles.descTitle}>{t('galleryTitle')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                            {images.map((img, index) => (
                                <TouchableOpacity key={index} style={styles.galleryItem} onPress={() => handleSetThumbnail(index)}>
                                    <Image source={{ uri: img.BIT240041_ImageUrl }} style={[styles.galleryImg, img.BIT240041_IsThumbnail && styles.galleryImgActive]} />
                                    {img.BIT240041_IsThumbnail && (
                                        <View style={styles.thumbLabel}><Text style={styles.thumbLabelText}>{t('isThumbnail')}</Text></View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('DishForm', { dish: dishInfo })}>
                    <Text style={styles.editBtnText}>{t('editDish')}</Text>
                </TouchableOpacity>
                <View style={{height: 40}} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    image: { width: '100%', height: 250, resizeMode: 'cover' },
    details: { padding: 20 },
    name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    price: { fontSize: 20, color: '#e53935', fontWeight: 'bold', marginBottom: 15 },
    timeBadge: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginBottom: 15 },
    timeBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    row: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
    label: { fontSize: 16, color: '#666', width: 100 },
    value: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    descTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
    description: { fontSize: 16, color: '#555', lineHeight: 24 },
    galleryContainer: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderColor: '#eee' },
    galleryScroll: { flexDirection: 'row' },
    galleryItem: { marginRight: 15, position: 'relative' },
    galleryImg: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
    galleryImgActive: { borderColor: '#4CAF50' },
    thumbLabel: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(76, 175, 80, 0.9)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
    thumbLabelText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    editBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30, marginBottom: 20 },
    editBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});