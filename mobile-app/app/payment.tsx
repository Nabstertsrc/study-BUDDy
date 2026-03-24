import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Linking, ScrollView, Animated } from 'react-native';
import { Text } from '@/components/Themed';
import { Stack, useRouter } from 'expo-router';
import {
    Zap,
    CheckCircle2,
    ChevronLeft,
    CreditCard,
    ShieldCheck,
    Star,
    Info
} from 'lucide-react-native';
import { APP_CONFIG } from '@/constants/app-config';
import { useWalletStore } from '@/stores/wallet-store';
import { LinearGradient } from 'expo-linear-gradient';

export default function PaymentScreen() {
    const router = useRouter();
    const { addCredits, balance } = useWalletStore();
    const [selectedTier, setSelectedTier] = useState<'BASIC' | 'PRO' | 'MASTER'>('PRO');

    const TIERS = [
        {
            id: 'BASIC',
            name: 'Academic Basic',
            credits: APP_CONFIG.PAYMENTS.BASIC.CREDITS,
            price: '$5',
            features: ['50 AI Credits', 'Basic OCR Scanning', 'Standard Quizzes'],
            gradient: ['#6366F1', '#4F46E5'],
            paypal: APP_CONFIG.PAYMENTS.BASIC.PAYPAL
        },
        {
            id: 'PRO',
            name: 'Professional',
            credits: APP_CONFIG.PAYMENTS.PRO.CREDITS,
            price: '$10',
            features: ['100 AI Credits', 'Unlimited OCR Scanning', 'Professional Grading', 'Priority Support'],
            gradient: ['#8B5CF6', '#6D28D9'],
            paypal: APP_CONFIG.PAYMENTS.PRO.PAYPAL
        },
        {
            id: 'MASTER',
            name: 'Mastery Scholar',
            credits: APP_CONFIG.PAYMENTS.MASTER.CREDITS,
            price: '$15',
            features: ['150 AI Credits', 'Unlimited Everything', 'Custom Study Paths', 'Academic Coaching'],
            gradient: ['#F43F5E', '#BE123C'],
            paypal: APP_CONFIG.PAYMENTS.MASTER.PAYPAL
        }
    ];

    const handlePurchase = async (tier: typeof TIERS[0]) => {
        Alert.alert(
            "Complete Payment",
            `Redirecting to secure payment for ${tier.name}. Credits will be added upon successful transaction.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Pay via PayPal",
                    onPress: () => {
                        Linking.openURL(tier.paypal);
                        // In a real app, use webhooks. For this demo/testing, we offer a "Verify" flow.
                        setTimeout(() => {
                            Alert.alert("Payment Verification", "Has your payment been completed?", [
                                { text: "Not yet", style: "cancel" },
                                {
                                    text: "Yes, Update Credits",
                                    onPress: async () => {
                                        await addCredits(tier.credits);
                                        Alert.alert("Success!", `${tier.credits} credits have been added to your vault.`);
                                        router.back();
                                    }
                                }
                            ]);
                        }, 2000);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Upgrade Account',
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <ChevronLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Ignite Your Study Power</Text>
                    <Text style={styles.subtitle}>Unlock unrestricted AI models and professional OCR scanning.</Text>
                </View>

                <View style={styles.currentBalance}>
                    <View style={styles.balanceInfo}>
                        <Zap size={20} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.balanceText}>Current Balance: {balance} Credits</Text>
                    </View>
                </View>

                <View style={styles.tiersList}>
                    {TIERS.map((tier) => (
                        <TouchableOpacity
                            key={tier.id}
                            activeOpacity={0.9}
                            onPress={() => setSelectedTier(tier.id as any)}
                        >
                            <LinearGradient
                                colors={tier.gradient as any}
                                style={[
                                    styles.tierCard,
                                    selectedTier === tier.id && styles.selectedTier
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.tierHeader}>
                                    <View>
                                        <Text style={styles.tierName}>{tier.name}</Text>
                                        <Text style={styles.tierCredits}>{tier.credits} AI Credits</Text>
                                    </View>
                                    <Text style={styles.tierPrice}>{tier.price}</Text>
                                </View>

                                <View style={styles.featuresList}>
                                    {tier.features.map((f, i) => (
                                        <View key={i} style={styles.featureItem}>
                                            <CheckCircle2 size={16} color="rgba(255,255,255,0.7)" />
                                            <Text style={styles.featureText}>{f}</Text>
                                        </View>
                                    ))}
                                </View>

                                {selectedTier === tier.id && (
                                    <TouchableOpacity
                                        style={styles.buyButton}
                                        onPress={() => handlePurchase(tier)}
                                    >
                                        <Text style={styles.buyButtonText}>Activate Tier Now</Text>
                                        <CreditCard size={18} color={tier.gradient[1]} />
                                    </TouchableOpacity>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footer}>
                    <View style={styles.securityNote}>
                        <ShieldCheck size={16} color="#475569" />
                        <Text style={styles.securityText}>Secure SSL Encrypted Transactions</Text>
                    </View>
                    <Text style={styles.legalText}>Credits expire after 30 days of inactivity. Transactions are non-refundable.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    currentBalance: {
        alignItems: 'center',
        marginBottom: 20,
    },
    balanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 8,
    },
    balanceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    tiersList: {
        padding: 20,
        gap: 20,
    },
    tierCard: {
        borderRadius: 28,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 6,
    },
    selectedTier: {
        borderWidth: 3,
        borderColor: '#fff',
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    tierName: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tierCredits: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 4,
    },
    tierPrice: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
    },
    featuresList: {
        gap: 10,
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    buyButton: {
        backgroundColor: '#fff',
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    buyButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
    },
    footer: {
        padding: 30,
        alignItems: 'center',
        gap: 12,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    securityText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    legalText: {
        fontSize: 10,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 16,
    }
});
