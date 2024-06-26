import db from '../../../lib/db';
import User from '../../../models/User';
import bcrypt from 'bcrypt';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return;
  }
  const {
    f_name: firstName,
    l_name: lastName,
    inviteCode,
    email: username,
    password,
    phoneNumber,
  } = req.body;
  console.log(req.body);
  if (
    !firstName ||
    firstName.trim() === '' ||
    !username ||
    username.trim() === '' ||
    !password ||
    password.trim().length < 5
  ) {
    res.status(422).json({ message: 'Validation error.' });
    return;
  }

  await db.connect();

  const existingUser = await User.findOne({ username: username });

  if (existingUser) {
    res.status(422).json({ message: 'User already exists.' });
    await db.disconnect();
    return;
  }
  try {
    // Find the inviter by invite code, or default to the seed user if not found
    let inviter;

    if (inviteCode) {
      console.log(inviteCode);
      inviter = await User.findOne({ inviteCode: inviteCode });
    }

    if (!inviter) {
      console.log('inviter not found');
      // The invite code could be invalid or missing, so we default to the seed user
      // Replace 'seedUserInviteCode' with the actual invite code of your seed user
      inviter = await User.findOne({ inviteCode: 'TD5tkLcdE' });
    }

    const newUser = new User({
      username: username,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      password,
      inviter: inviter._id,
    });

    const user = await newUser.save();

    console.log('user created successfully');

    // // Update the invitees arrays of the inviter and its ancestors
    // inviter.inviteesLevel1.push(user._id);
    // await inviter.save();

    // // Check if the inviter is not the seed user before updating ancestors
    // if (inviter.inviteCode !== 'TD5tkLcdE') {
    //   console.log('inviter is not seed user');
    //   console.log(inviter.inviter);
    //   if (inviter.inviter) {
    //     const inviterL2 = await User.findById(inviter.inviter);
    //     inviterL2.inviteesLevel2.push(user._id);
    //     await inviterL2.save();

    //     if (inviterL2.inviter) {
    //       console.log('going to level 3');
    //       let inviterL3 = await User.findById(inviterL2.inviter);
    //       inviterL3.inviteesLevel3.push(user._id);
    //       await inviterL3.save();
    //     }
    //   }
    // }

    await db.disconnect();
    res.status(201).send({
      message: 'user created successfully!',
      _id: user._id,
      f_name: user.firstName,
      inviteCode: user.inviteCode,
      level1: user.inviteesLevel1,
      level2: user.inviteesLevel2,
      level3: user.inviteesLevel3,
      status: user.registrationStatus,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
}

export default handler;
