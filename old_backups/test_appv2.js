// Test script to verify appV2 is accessible
console.log('Testing appV2 accessibility...');
if (typeof window.appV2 !== 'undefined') {
    console.log('✅ appV2 is defined:', window.appV2);
    console.log('✅ appV2.filterProd method exists:', typeof window.appV2.filterProd);
} else {
    console.log('❌ appV2 is not defined');
}