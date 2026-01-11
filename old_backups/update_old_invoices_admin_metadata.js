/**
 * Script to add admin metadata to old invoices created by admin for reps
 * Run this once in browser console while logged in as admin
 */

async function updateOldInvoicesWithAdminMetadata() {
    try {
        console.log('🔄 Starting to update old invoices with admin metadata...');
        
        // Get current admin user
        const currentUser = AuthSystem.getCurrentUser();
        if (!currentUser) {
            console.error('❌ No user logged in');
            return;
        }
        
        const role = getUserRole();
        if (role !== 'admin') {
            console.error('❌ Current user is not admin');
            return;
        }
        
        console.log('✅ Admin user:', currentUser.name, currentUser.email);
        
        // Get all sales
        const salesSnapshot = await db.collection('sales').get();
        console.log('📊 Total sales found:', salesSnapshot.size);
        
        let updatedCount = 0;
        let skippedCount = 0;
        const batch = db.batch();
        let batchCount = 0;
        
        for (const doc of salesSnapshot.docs) {
            const sale = doc.data();
            
            // Skip if already has isAdminEntry
            if (sale.isAdminEntry === true) {
                skippedCount++;
                continue;
            }
            
            // Check if this invoice was created by admin for a rep
            // Logic: if repEmail exists and is different from createdByEmail
            const repEmail = (sale.repEmail || '').toLowerCase();
            const createdByEmail = (sale.createdByEmail || '').toLowerCase();
            
            // Also check if created_by_admin or adminEntry flags exist
            const isAdminCreated = sale.created_by_admin === true || 
                                   sale.adminEntry === true || 
                                   sale.entry_source === 'admin';
            
            // Or check if repEmail doesn't match createdByEmail (admin created for rep)
            const isDifferentUser = repEmail && createdByEmail && repEmail !== createdByEmail;
            
            if (isAdminCreated || isDifferentUser) {
                // Add admin metadata
                const updateData = {
                    isAdminEntry: true,
                    recordedByName: sale.recordedByName || currentUser.name || 'إدارة',
                    originalCreatorId: sale.originalCreatorId || sale.createdBy || currentUser.id,
                    adminEntry: true,
                    created_by_admin: true,
                    entry_source: 'admin',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add note if not exists
                const currentNotes = sale.notes || '';
                if (!currentNotes.includes('تم التسجيل بمعرفة الإدارة')) {
                    updateData.notes = currentNotes + ' - (تم التسجيل بمعرفة الإدارة)';
                }
                
                batch.update(doc.ref, updateData);
                batchCount++;
                updatedCount++;
                
                console.log(`📝 Updated invoice ${sale.invoiceNumber} (${doc.id})`);
                
                // Commit batch every 500 operations (Firestore limit)
                if (batchCount >= 500) {
                    await batch.commit();
                    console.log(`✅ Batch committed: ${batchCount} invoices`);
                    batchCount = 0;
                }
            } else {
                skippedCount++;
            }
        }
        
        // Commit remaining batch
        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ Final batch committed: ${batchCount} invoices`);
        }
        
        console.log('🎉 Update complete!');
        console.log(`   ✅ Updated: ${updatedCount} invoices`);
        console.log(`   ⏭️  Skipped: ${skippedCount} invoices`);
        
        // Refresh the page to see changes
        if (confirm(`تم تحديث ${updatedCount} فاتورة. هل تريد تحديث الصفحة لرؤية التغييرات؟`)) {
            location.reload();
        }
        
    } catch (error) {
        console.error('❌ Error updating invoices:', error);
    }
}

// Run the script
console.log('📋 To update old invoices with admin metadata, run:');
console.log('   updateOldInvoicesWithAdminMetadata()');
