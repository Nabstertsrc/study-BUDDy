import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <WebView
                source={{ uri: 'https://user.github.io/fluffy-jump/' }} // Replace with actual deployed URL or local server
                style={styles.webview}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
    },
});
