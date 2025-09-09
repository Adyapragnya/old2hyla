import EmailOptionsTosend from '../models/EmailOptionsTosend.js';
import nodemailer from 'nodemailer';

import Organization from '../models/Organization.js';
import LoginUsers from '../models/LoginUsers.js';
import TrackedVessel from '../models/TrackedVessel.js';

import TrackedVesselByUser from '../models/TrackedVesselByUser.js';
import ArchivedTrackedVesselByUser from '../models/ArchivedTrackedVesselByUser.js';

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

const SubscriptionManagement = async () => {
  try {
    console.log('running-subs');
    const { transporter, emailUser } = await getEmailTransporter();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // === ORGANIZATION SUBSCRIPTION ===

    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setUTCHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setUTCHours(23, 59, 59, 999);

    // 1. Send reminder to org admins for subscriptions expiring tomorrow
    const orgsToRemind = await Organization.find({
    subscriptionEndDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
    active: true,
    }).lean();

    console.log('orgs',orgsToRemind);
    for (const org of orgsToRemind) {
      const orgAdmins = await LoginUsers.find({
        orgRef: org._id,
        role: 'organization admin',
        active: true,
      }).lean();

      const emails = orgAdmins.map(admin => admin.email).filter(Boolean);

        console.log('org-sub-reminder',emails)

      if (emails.length > 0) {
        const subject = `Subscription Expiry Reminder for ${org.companyName}`;
        const text = `Hi ${org.adminFirstName},

Your subscription will expire on ${org.subscriptionEndDate.toDateString()}. Please renew to continue using our services.

Thank you,
Team Hyla`;

        await transporter.sendMail({
          from: emailUser,
          to: emails,
          subject,
          text,
        });

        console.log(`Sent subscription expiry reminder to org admins of ${org.companyName}`);
      }
    }

   

    // 2. Expired organizations: deactivate org and users, archive and delete vessels
    const expiredOrgs = await Organization.find({
      subscriptionEndDate: { $lte: today },
      active: true,
    });

    for (const org of expiredOrgs) {
      // Deactivate org
      org.active = false;
      await org.save();

      // Deactivate org users
      await LoginUsers.updateMany({ orgRef: org._id }, { active: false });

     
      // Find and archive vessels tracked by org users
      const vessels = await TrackedVesselByUser.find({ orgRef: org._id });
      for (const vessel of vessels) {
        await ArchivedTrackedVesselByUser.create({
          ...vessel.toObject(),
          reason: 'not-renewed-subscription',
        });
        await TrackedVesselByUser.deleteOne({ _id: vessel._id });

      }
      
      // 1. Clean up orphaned vessels
        const imoList = [...new Set(vessels.map(v => v.IMO))];

        for (const imo of imoList) {
        const isTracked = await TrackedVesselByUser.exists({ IMO: imo });
        if (!isTracked) {
            await TrackedVessel.deleteOne({ IMO: imo });
            console.log(`Deleted orphaned vessel IMO ${imo}`);
        }
        }

        // 2. Notify org admins
        const orgAdmins = await LoginUsers.find({
        orgRef: org._id,
        role: 'organization admin'
        }).lean();

        const emails = orgAdmins.map(u => u.email).filter(Boolean);

        console.log('org-sub-ended-deleted',emails)
        if (emails.length > 0) {

        const subject = `Subscription Expired - Account Deactivated`;
        const text = `Hi ${org.adminFirstName},

        Your organization's subscription has expired. Your account and tracked vessels have been deactivated.

        To restore access, please renew your subscription.
        
        Best regards,
        Team Hyla`;

        await transporter.sendMail({
            from: emailUser,
            to: emails,
            subject,
            text
        });

        console.log(`Sent deactivation notice to org admins of ${org.companyName}`);
        }


      

      console.log(`Deactivated org ${org.companyName}, users, and archived their vessels due to subscription expiry.`);
    }

    // === GUEST USERS TRIAL ===

    // Calculate 15 days trial in milliseconds
    const trialPeriodMs = 15 * 24 * 60 * 60 * 1000;

    // 3. Send reminder to guests whose trial expires tomorrow
    const trialEndStart = new Date(tomorrowStart.getTime() - trialPeriodMs);
    const trialEndEnd = new Date(tomorrowEnd.getTime() - trialPeriodMs);

    const guestsToRemind = await LoginUsers.find({
    role: 'guest',
    active: true,
    createdAt: { $gte: trialEndStart, $lte: trialEndEnd },
    }).lean();



    for (const guest of guestsToRemind) {

        console.log('guest-sub-reminder',guest.email)

      if (guest.email) {
        const subject = `Trial Period Expiry Reminder`;
        const text = `Hi ${guest.firstName},

Your 15-day trial period will expire tomorrow. Please contact us if you'd like to continue using our services.

Thank you,
Team Hyla`;

        await transporter.sendMail({
          from: emailUser,
          to: guest.email,
          subject,
          text,
        });

        console.log(`Sent trial expiry reminder to guest ${guest.email}`);
      }
    }

    // 4. Deactivate guests whose trial expired today or earlier, archive and delete vessels
    const trialExpiryCutoff = new Date(today.getTime() - trialPeriodMs);

    const guestsToDeactivate = await LoginUsers.find({
    role: 'guest',
    active: true,
    createdAt: { $lte: trialExpiryCutoff },
    });


for (const guest of guestsToDeactivate) {

        console.log('guest-sub-deleted',guest.email)

  guest.active = false;
  await guest.save();

  const vessels = await TrackedVesselByUser.find({ loginUserId: guest.loginUserId });

  for (const vessel of vessels) {
    await ArchivedTrackedVesselByUser.create({
      ...vessel.toObject(),
      reason: 'not-renewed-subscription',
    });
    await TrackedVesselByUser.deleteOne({ _id: vessel._id });
  }

  // 🧹 Clean orphaned vessels after guest cleanup
  const imoList = [...new Set(vessels.map(v => v.IMO))];
  for (const imo of imoList) {
    const isTracked = await TrackedVesselByUser.exists({ IMO: imo });
    if (!isTracked) {
      await TrackedVessel.deleteOne({ IMO: imo });
      console.log(`Deleted orphaned vessel IMO ${imo}`);
    }
  }

  // 📩 Send email to guest after deactivation
  if (guest.email) {
    const subject = `Trial Ended – Account Deactivated`;
    const text = `Hi ${guest.firstName},

Your trial has ended. Your account and tracked vessels have been deactivated.

Thanks for trying Hyla!
Team Hyla`;

    await transporter.sendMail({
      from: emailUser,
      to: guest.email,
      subject,
      text,
    });

    console.log(`Sent deactivation notice to guest ${guest.email}`);
  }

  console.log(`Deactivated guest ${guest.email} and archived their vessels due to trial expiry.`);
}

  } catch (error) {
    console.error('Error in subscription management job:', error);
  }
};

export default SubscriptionManagement;
