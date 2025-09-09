import EmailOptionsTosend from '../models/EmailOptionsTosend.js';
import nodemailer from 'nodemailer';

import TrackedVessel from '../models/TrackedVessel.js';
import TrackedVesselByUser from '../models/TrackedVesselByUser.js';
import ArchivedTrackedVesselByUser from '../models/ArchivedTrackedVesselByUser.js';
import Organization from '../models/Organization.js';
import LoginUsers from '../models/LoginUsers.js';
import VesselDeletionDays from '../models/VesselDeletionDays.js';


async function getEmailTransporter() {
  const emailOption = await EmailOptionsTosend.findOne({});
  if (!emailOption) throw new Error('Email credentials not found in DB');
  return {
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailOption.user,
        pass: emailOption.pass,
      }
    }),
    emailUser: emailOption.user
  };
}

const cleanupDuplicateTrackedVessels = async () => {
  try {
     const { transporter, emailUser } = await getEmailTransporter();

    const all = await TrackedVesselByUser.find().lean();

    const grouped = new Map();

    for (const doc of all) {
      const key = doc.orgRef
        ? `org-${doc.orgRef.toString()}-${doc.loginUserId}-${doc.IMO}`
        : `user-${doc.loginUserId}-${doc.IMO}`;

      if (!grouped.has(key)) {
        grouped.set(key, [doc]);
      } else {
        grouped.get(key).push(doc);
      }
    }

    const duplicatesToDelete = [];
    const deletedSummaries = [];

    for (const [key, docs] of grouped.entries()) {
      if (docs.length > 1) {
        // Sort by AddedDate descending (latest first), keep the first
        const sorted = docs.sort((a, b) => new Date(b.AddedDate) - new Date(a.AddedDate));
        const toKeep = sorted[0];
        const toDelete = sorted.slice(1);
        duplicatesToDelete.push(...toDelete.map(d => d._id));
        deletedSummaries.push(`Key: ${key} | Kept: ${toKeep._id} | Deleted: ${toDelete.map(d => d._id).join(', ')}`);
        console.log(`Duplicate group [${key}]: Keeping ${toKeep._id}, deleting ${toDelete.length} others`);
      }
    }

    if (duplicatesToDelete.length > 0) {
      await TrackedVesselByUser.deleteMany({ _id: { $in: duplicatesToDelete } });
      console.log(`✅ Deleted ${duplicatesToDelete.length} duplicate tracked vessel entries.`);

      const summaryEmail = {
        from: emailUser,
        to: 'udhaykirank@adyapragnya.com',
        subject: `Daily Maintainance - ${duplicatesToDelete.length} duplicates Deleted`,
        text: `Hello Super Admin,

${duplicatesToDelete.length} duplicate vessel tracking entries were deleted.

Details:
${deletedSummaries.join('\n')}

Regards,
Team Hyla`
      };

      await transporter.sendMail(summaryEmail);
      console.log('📧 Sent cleanup summary email to udhay@gmail.com');
    } else {
      console.log('✅ No duplicate tracked vessels found.');
    }

  } catch (error) {
    console.error('❌ Error in duplicate vessel tracking cleanup:', error);
  }
};

// 30th reminders , 31st deletion , orphaned entries deletion , unused vessels deletion
const checkAndHandleVesselTracking = async () => {
  try {
   const { transporter, emailUser } = await getEmailTransporter();

    const today = new Date();

    const settings = await VesselDeletionDays.findOne() || { reminderDay: 30, deleteDay: 31 };

    // Ensure deleteDay is always greater than reminderDay
    if (settings.deleteDay <= settings.reminderDay) {
      throw new Error('Invalid settings: deleteDay must be greater than reminderDay');
    }

    const notifyStart = new Date(today);
    notifyStart.setDate(today.getDate() - settings.reminderDay);
    notifyStart.setHours(0, 0, 0, 0);

    const notifyEnd = new Date(today);
    notifyEnd.setDate(today.getDate() - settings.reminderDay);
    notifyEnd.setHours(23, 59, 59, 999); // End of day

    const deleteBefore = new Date(today);
    deleteBefore.setDate(today.getDate() - settings.deleteDay);
    deleteBefore.setHours(0, 0, 0, 0);


     // === 3. HANDLE ORPHANED TRACKINGS ===
    const allTrackedIMOs = await TrackedVessel.distinct('IMO');
    const orphaned = await TrackedVesselByUser.find({
      IMO: { $nin: allTrackedIMOs }
    }).lean();

    let orphanedCount = 0;
    const orphanedIds = [];

    for (const orphan of orphaned) {
      orphanedIds.push(orphan._id.toString());
      orphanedCount++;

      const archivedData = {
        originalId: orphan._id,
        IMO: orphan.IMO,
        loginUserId: orphan.loginUserId,
        email: orphan.email,
        AdminId: orphan.AdminId,
        OrgId: orphan.OrgId,
        orgRef: orphan.orgRef,
        AddedDate: orphan.AddedDate,
        favorite: orphan.favorite,
        reminderSent: orphan.reminderSent || false,
        reason: 'orphaned'
      };

      await ArchivedTrackedVesselByUser.create(archivedData);
      await TrackedVesselByUser.deleteOne({ _id: orphan._id });
      console.log(`Deleted orphaned tracking for IMO ${orphan.IMO}`);
    }

    // Send summary email to admin if any orphaned records were deleted
    if (orphanedCount > 0) {
      const adminEmail = 'udhaykirank@adyapragnya.com';
      const adminSubject = `Daily Maintainance - ${orphanedCount} orphaned records deleted`;
      const adminText = `Hello Super Admin,

${orphanedCount} orphaned vessel tracking entries(s) have been archived and deleted.

Document IDs(field- originalId):
${orphanedIds.join('\n')}

Please review if necessary.

Best Regards,
Team Hyla`;

      await transporter.sendMail({
        from: emailUser,
        to: adminEmail,
        subject: adminSubject,
        text: adminText
      });

      console.log(`Sent orphaned cleanup summary email to admin (${adminEmail})`);
    }


    // Match only those added exactly 30 days ago
    const reminderDocs = await TrackedVesselByUser.find({
    AddedDate: { $gte: notifyStart, $lte: notifyEnd },
    $or: [
        { reminderSent: false },
        { reminderSent: { $exists: false } }
    ]
    }).lean();

   
    for (const doc of reminderDocs) {
      const imo = doc.IMO;
      const vessel = await TrackedVessel.findOne({ IMO: imo }).lean();
      const vesselName = vessel?.AIS?.NAME || 'Unknown Vessel';
      const vesselInfo = `${vesselName} (${imo})`;

      if (doc.orgRef) {

      const reminderText = `This is a reminder that your organization's tracking for vessel ${vesselInfo} will be deleted tomorrow.\n\n- Team Hyla`;

        const org = await Organization.findById(doc.orgRef).lean();
        const orgUsers = await LoginUsers.find({
          orgRef: doc.orgRef,
          role: { $in: ['organization admin', 'organizational user'] },
          
        }).lean();

        const emails = orgUsers.map(u => u.email).filter(Boolean);
        if (emails.length > 0) {
          await transporter.sendMail({
            from: emailUser,
            to: emails,
            subject: `Reminder: Vessel Tracking Expiring - ${vesselName}`,
            text: reminderText
          });
          console.log(`Reminder sent to org users of ${org?.companyName || 'Unknown Org'} for IMO ${imo}`);
        }
      } else if (doc.loginUserId) {
      const reminderText = `This is a reminder that your tracking for vessel ${vesselInfo} will be deleted tomorrow.\n\n- Team Hyla`;

        const user = await LoginUsers.findOne(
            { loginUserId: doc.loginUserId, role: { $in: ['hyla admin', 'guest'] } }
          ).lean();
        if (user && user.email) {
          await transporter.sendMail({
            from: emailUser,
            to: user.email,
            subject: `Reminder: Vessel Tracking Expiring - ${vesselName}`,
            text: reminderText
          });
          console.log(`Reminder sent to user ${user.email} for IMO ${imo}`);
        }
      }

      await TrackedVesselByUser.updateOne({ _id: doc._id }, { reminderSent: true });
    }


    // === 2. DELETE ONLY IF REMINDER WAS SENT AND ENTRY IS ≥ 31 DAYS OLD ===
      // === 2. DELETION & ARCHIVAL ===
    const deletableDocs = await TrackedVesselByUser.find({
      AddedDate: { $lte: deleteBefore },
    }).lean();

    // Before deleting, mark any missing `reminderSent` field as true
    const docsToUpdate = deletableDocs
    .filter(doc => doc.reminderSent !== true)
    .map(doc => doc._id);

    if (docsToUpdate.length > 0) {
    await TrackedVesselByUser.updateMany(
        { _id: { $in: docsToUpdate } },
        { $set: { reminderSent: true } }
    );
    }

    const groupedByIMO = {};
    for (const doc of deletableDocs) {
      if (!groupedByIMO[doc.IMO]) groupedByIMO[doc.IMO] = [];
      groupedByIMO[doc.IMO].push(doc);
    }

    for (const [imo, docs] of Object.entries(groupedByIMO)) {
      const vessel = await TrackedVessel.findOne({ IMO: imo }).lean();
      const vesselName = vessel?.AIS?.NAME || 'Unknown Vessel';
      const vesselInfo = `${vesselName} (${imo})`;

      const archivedEntries = docs.map(d => ({
        originalId: d._id,
        IMO: d.IMO,
        loginUserId: d.loginUserId,
        email: d.email,
        AdminId: d.AdminId,
        OrgId: d.OrgId,
        orgRef: d.orgRef,
        AddedDate: d.AddedDate,
        favorite: d.favorite,
        reminderSent: d.reminderSent,
        reason: '30-days-expired'
      }));

      try {
        const inserted = await ArchivedTrackedVesselByUser.insertMany(archivedEntries, { ordered: false });
        const insertedIds = inserted.map(x => x.originalId.toString());
        const toDelete = docs.filter(d => insertedIds.includes(d._id.toString()));
        const toDeleteIds = toDelete.map(d => d._id);

        if (toDeleteIds.length > 0) {
          await TrackedVesselByUser.deleteMany({ _id: { $in: toDeleteIds } });

          // === Send deletion notifications ===
          for (const d of toDelete) {

            if (d.orgRef) {
            const deletionText = `Your organization's tracking for vessel ${vesselInfo} has been deleted.\n\n- Team Hyla`;

              const orgUsers = await LoginUsers.find({
                orgRef: d.orgRef,
                role: { $in: ['organization admin', 'organizational user'] }
              }).lean();

              const emails = orgUsers.map(u => u.email).filter(Boolean);
              if (emails.length > 0) {
                await transporter.sendMail({
                  from: emailUser,
                  to: emails,
                  subject: `Deleted: Vessel Tracking - ${vesselName}`,
                  text: deletionText
                });
              }
            } else if (d.loginUserId) {

            const deletionText = `Your tracking for vessel ${vesselInfo} has been deleted.\n\n- Team Hyla`;

              const user = await LoginUsers.findOne(
                  { loginUserId: d.loginUserId, role: { $in: ['hyla admin', 'guest'] } }
                ).lean();
              if (user && user.email) {
                await transporter.sendMail({
                  from: emailUser,
                  to: user.email,
                  subject: `Deleted: Vessel Tracking - ${vesselName}`,
                  text: deletionText
                });
              }
            }
          }

          console.log(`Archived and deleted ${toDeleteIds.length} records for IMO ${imo}`);
        }

        const failedCount = archivedEntries.length - insertedIds.length;
        if (failedCount > 0) {
          console.warn(`${failedCount} failed to archive for IMO ${imo}`);
        }

      } catch (err) {
        console.error(`InsertMany failed for IMO ${imo}:`, err);
      }

      // === Clean up vessel if no users are tracking it
      const stillTracked = await TrackedVesselByUser.exists({ IMO: imo });
      if (!stillTracked) {
        await TrackedVessel.deleteOne({ IMO: imo });
      }
    }

        // === EXTRA: Periodic cleanup for any orphaned vessels ===
        const orphanedVessels = await TrackedVessel.find({
        IMO: { $nin: await TrackedVesselByUser.distinct('IMO') }
        });

        if (orphanedVessels.length > 0) {
        const orphanedIMOList = orphanedVessels.map(v => v.IMO);
        
        for (const vessel of orphanedVessels) {
            await TrackedVessel.deleteOne({ IMO: vessel.IMO });
            console.log(`Deleted orphaned vessel IMO ${vessel.IMO}`);
        }

        // Send summary email to admin
        const adminEmail = 'udhaykirank@adyapragnya.com'; // change as needed
        const adminSubject = `Daily Maintenance - ${orphanedVessels.length} unused vessels deleted`;
        const adminText = `Hello Super Admin,

        ${orphanedVessels.length} unused vessels (no user tracking) have been deleted.

        List of deleted IMO numbers:
        ${orphanedIMOList.join('\n')}

        Please review if necessary.

        Best Regards,
        Team Hyla`;

        await transporter.sendMail({
            from: emailUser,
            to: adminEmail,
            subject: adminSubject,
            text: adminText
        });

        console.log(`Sent orphaned vessels cleanup summary email to admin (${adminEmail})`);
        }

      

  } catch (error) {
    console.error('Error in scheduled vessel tracking job:', error);
  }
};





export { checkAndHandleVesselTracking, cleanupDuplicateTrackedVessels };
